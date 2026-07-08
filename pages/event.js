import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { lookupGuest } from '../lib/guestLookup';

export default function EventPage() {
  const router = useRouter();
  const { id, token } = router.query;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('details');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveChat, setLiveChat] = useState([]);
  const [newChat, setNewChat] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    if (id) {
      loadEvent(id);
      const storedGuest = localStorage.getItem(`everafter_guest_${id}`);
      if (storedGuest) {
        try {
          setGuest(JSON.parse(storedGuest));
        } catch (e) {
          console.error('Failed to parse guest from localStorage', e);
        }
      }
    }
  }, [id, router.isReady]);

  async function loadEvent(slug) {
    setLoading(true);
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!eventData) { setEvent(null); setLoading(false); return; }

    const { data: guests } = await supabase.from('guests').select('*').eq('event_id', eventData.id).order('table_number');
    const { data: timeline } = await supabase.from('timeline_items').select('*').eq('event_id', eventData.id).order('sort_order');
    const { data: menuItems } = await supabase.from('menu_items').select('*').eq('event_id', eventData.id);
    const { data: guestMessages } = await supabase.from('guestbook').select('*').eq('event_id', eventData.id).order('created_at', { ascending: false });
    const { data: eventPhotos } = await supabase.from('photos').select('*').eq('event_id', eventData.id).eq('is_approved', true).order('created_at', { ascending: false });
    const { data: chatMessages } = await supabase.from('live_chat_messages').select('*').eq('event_id', eventData.id).order('created_at', { ascending: true });

    const menu = {};
    if (menuItems) menuItems.forEach(item => { menu[item.course_type] = item.dish_name; });

    setMessages(guestMessages || []);
    setPhotos(eventPhotos || []);
    setLiveChat(chatMessages || []);

    const loadedEvent = {
      id: eventData.id,
      couple: eventData.host_name || 'Guest',
      date: new Date(eventData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      venue: eventData.venue || '',
      backgroundTheme: eventData.background_theme || '',
      coverPhoto: eventData.cover_photo || '',
      guests: guests?.map(g => ({ 
        id: g.id,
        token: g.guest_token || '',
        firstName: g.first_name, 
        lastName: g.last_name, 
        name: `${g.first_name} ${g.last_name}`.trim(), 
        table: g.table_number, 
        diet: g.dietary_requirements || '' 
      })) || [],
      timeline: timeline?.map(t => ({ time: t.event_time?.slice(0, 5), event: t.title, location: t.location || '' })) || [],
      menu: { starter: menu.starter || '', main: menu.main || '', dessert: menu.dessert || '' }
    };
    setEvent(loadedEvent);

    if (token) {
      const found = loadedEvent.guests.find(g => g.token === token);
      if (found) {
        setGuest(found);
        localStorage.setItem(`everafter_guest_${slug}`, JSON.stringify(found));
        await supabase.from('guests').update({ checked_in_at: new Date().toISOString() }).eq('id', found.id);
      }
    }
    
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const matches = event.guests.filter(g => 
      g.firstName.toLowerCase() === firstName.toLowerCase().trim() && 
      g.lastName.toLowerCase() === lastName.toLowerCase().trim()
    );

    if (matches.length === 1) { 
      const found = matches[0];
      setGuest(found); 
      setError(''); 
      localStorage.setItem(`everafter_guest_${id}`, JSON.stringify(found));
      
      // Record check-in time
      await supabase.from('guests').update({ checked_in_at: new Date().toISOString() }).eq('id', found.id);
    } else if (matches.length > 1) {
      setError('Multiple guests found with this name. Please use your unique check-in link provided during RSVP.');
    } else { 
      setError('We couldn\'t find your name on the guest list. Please check spelling or contact the hosts.'); 
    }
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSubmitting(true);
    const { data, error } = await supabase.from('guestbook').insert({
      event_id: event.id,
      guest_name: guest.name,
      message: newMessage
    }).select().single();
    if (!error && data) {
      setMessages([data, ...messages]);
      setNewMessage('');
    }
    setIsSubmitting(false);
  };

  const handlePhotoUpload = async (e) => {
    if (!event) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      const { error: dbError } = await supabase.from('photos').insert({
        event_id: event.id,
        image_url: base64String,
        caption: photoCaption,
        uploaded_by: guest?.name || 'Guest',
        is_approved: false
      });

      if (!dbError) {
        alert('Photo uploaded! It will appear in the gallery once approved by the host.');
        setPhotoCaption('');
      } else {
        alert('Upload failed: ' + dbError.message);
      }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const submitChat = async (e) => {
    e.preventDefault();
    if (!newChat.trim() || !event || !guest) return;
    const { data, error } = await supabase.from('live_chat_messages').insert({
      event_id: event.id,
      guest_id: guest.id,
      sender_name: guest.firstName,
      message: newChat,
      is_admin: false
    }).select().single();
    if (!error && data) {
      setLiveChat([...liveChat, data]);
      setNewChat('');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2' }}>
        <p style={{ fontSize: '40px', animation: 'spin 1s linear infinite' }}>⏳</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '60px', margin: 0 }}>404</h1>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Event not found</p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Please check your QR code or link</p>
        </div>
      </div>
    );
  }

  if (guest) {
    const tabs = ['details', 'timeline', 'menu', 'photos', 'messages', 'chat'];
    return (
      <div className="dashboard-layout" style={{ backgroundImage: event.backgroundTheme ? `url(${event.backgroundTheme})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh' }}>
        <header className="dashboard-header" style={{ background: event.backgroundTheme ? 'rgba(255, 255, 255, 0.85)' : 'white', backdropFilter: 'blur(10px)' }}>
          <motion.h2 initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 'var(--fluid-font-lg)' }}>
            {event.couple}
          </motion.h2>
          <button onClick={() => { setGuest(null); localStorage.removeItem(`everafter_guest_${id}`); }} style={{ background: '#f3f4f6', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Sign Out
          </button>
        </header>
        
        <nav className="dashboard-nav hide-scrollbar">
          <div className="nav-items-container">
            {tabs.map(t => (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={t} 
                onClick={() => setActiveTab(t)} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', borderRadius: '12px', cursor: 'pointer', background: activeTab === t ? 'linear-gradient(to right, #f43f5e, #ec4899)' : 'white', color: activeTab === t ? 'white' : '#4b5563', position: 'relative', border: activeTab === t ? '2px solid transparent' : '1px solid #e5e7eb', boxShadow: activeTab === t ? '0 4px 12px rgba(244,63,94,0.3)' : '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {t === 'details' && '👤'}{t === 'timeline' && '⏱'}{t === 'menu' && '🍽'}{t === 'photos' && '📸'}{t === 'messages' && '💬'}{t === 'chat' && '✨'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'capitalize' }}>{t}</span>
              </motion.button>
            ))}
          </div>
        </nav>

        <main className="dashboard-main" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'details' && (
                <div style={{ background: 'white', borderRadius: '24px', padding: '0 0 40px 0', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  {event.coverPhoto && (
                    <img src={event.coverPhoto} alt="Event Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '20px' }} />
                  )}
                  <div style={{ padding: event.coverPhoto ? '0 20px' : '40px 20px 0 20px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Your Table</p>
                    <p style={{ fontSize: '80px', fontFamily: 'Playfair Display, serif', fontWeight: 700, background: 'linear-gradient(to bottom right, #f43f5e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0' }}>{guest.table}</p>
                    {guest.diet && <p style={{ color: '#6b7280', marginTop: '16px', fontSize: '14px' }}>🥗 Dietary: {guest.diet}</p>}
                  <p style={{ marginTop: '24px', color: '#4b5563', fontSize: '18px' }}>Welcome, <strong>{guest.name}</strong>!</p>
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>{event.date} • {event.venue}</p>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div style={{ background: 'white', borderRadius: '24px', padding: '30px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '24px', textAlign: 'center', fontSize: '22px' }}>Event Timeline</h3>
                  {event.timeline.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '0 10px' }}>
                      <div style={{ color: '#f43f5e', fontWeight: 700, minWidth: '55px', textAlign: 'right' }}>{item.time}</div>
                      <div style={{ borderLeft: '2px solid #fecdd3', paddingLeft: '16px', paddingBottom: '10px' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>{item.event}</p>
                        {item.location && <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>📍 {item.location}</p>}
                      </div>
                    </div>
                  ))}
                  {event.timeline.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center' }}>No timeline events scheduled.</p>}
                </div>
              )}

              {activeTab === 'menu' && (
                <div style={{ background: 'white', borderRadius: '24px', padding: '30px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '30px', textAlign: 'center', fontSize: '24px' }}>The Menu</h3>
                  {['starter', 'main', 'dessert'].map(course => (
                    event.menu[course] && (
                      <div key={course} style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <p style={{ textTransform: 'uppercase', letterSpacing: '3px', color: '#f43f5e', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>{course}</p>
                        <p style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#1f2937' }}>{event.menu[course]}</p>
                      </div>
                    )
                  ))}
                  {!event.menu.starter && !event.menu.main && !event.menu.dessert && <p style={{ color: '#6b7280', textAlign: 'center' }}>Menu not available yet.</p>}
                </div>
              )}

              {activeTab === 'photos' && (
                <div style={{ background: 'white', borderRadius: '24px', padding: '30px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '16px', fontSize: '22px', textAlign: 'center' }}>Photo Gallery</h3>
                  
                  <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>Upload a Photo</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input type="text" placeholder="Add a caption (optional)" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px' }} />
                      <label style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '12px 20px', borderRadius: '8px', cursor: uploadingPhoto ? 'not-allowed' : 'pointer', fontWeight: 600, textAlign: 'center' }}>
                        {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>

                  {photos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
                      <p style={{ color: '#6b7280', fontSize: '15px' }}>Be the first to share a moment!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {photos.map(photo => (
                        <div key={photo.id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: 'white' }}>
                          <img src={photo.image_url} alt={photo.caption} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '8px' }}>
                            {photo.caption && <p style={{ fontSize: '12px', margin: '0 0 4px', fontWeight: 500 }}>{photo.caption}</p>}
                            <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>— {photo.uploaded_by}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div style={{ background: 'white', borderRadius: '24px', padding: '30px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '8px', fontSize: '22px', textAlign: 'center' }}>Guestbook</h3>
                  <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>Leave a message for {event.couple}!</p>
                  
                  <form onSubmit={submitMessage} style={{ marginBottom: '30px' }}>
                    <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Write your message here..." style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #e5e7eb', height: '100px', boxSizing: 'border-box', fontSize: '15px', resize: 'vertical' }} required></textarea>
                    <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '15px' }}>{isSubmitting ? 'Sending...' : 'Submit Message'}</button>
                  </form>

                  <div>
                    {messages.map(msg => (
                      <div key={msg.id} style={{ background: '#f9fafb', padding: '16px', borderRadius: '16px', marginBottom: '12px' }}>
                        <p style={{ margin: '0 0 8px', color: '#1f2937', lineHeight: '1.5' }}>"{msg.message}"</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>— {msg.guest_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="login-background" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundImage: event.backgroundTheme ? `url(${event.backgroundTheme})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: 'white', borderRadius: '24px', padding: '40px 30px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 24px' }}></div>
        <h1 style={{ fontSize: '32px', fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '4px', color: '#1f2937' }}>{event.couple}</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px', fontSize: '14px', fontWeight: 400 }}>{event.date}</p>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '16px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>Find Your Table</label>
          <div style={{ marginBottom: '8px' }}>
            <div className="floating-input-group">
              <input 
                id="first-name"
                type="text" 
                value={firstName} 
                onChange={(e) => { setFirstName(e.target.value); setError(''); }} 
                placeholder=" " 
                required 
              />
              <label htmlFor="first-name">First Name</label>
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div className="floating-input-group">
              <input 
                id="last-name"
                type="text" 
                value={lastName} 
                onChange={(e) => { setLastName(e.target.value); setError(''); }} 
                placeholder=" " 
                required 
              />
              <label htmlFor="last-name">Last Name</label>
            </div>
          </div>
          {error && <p style={{ color: '#dc2626', textAlign: 'center', marginBottom: '16px', fontSize: '14px', background: '#fef2f2', padding: '12px', borderRadius: '12px', fontWeight: 500 }}>{error}</p>}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            style={{ width: '100%', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '16px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(244,63,94,0.3)', transition: 'box-shadow 0.2s' }}
          >
            ✨ Enter Dashboard
          </motion.button>
        </form>
        
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#d1d5db', marginTop: '30px' }}>EverAfter Hub</p>
      </motion.div>
    </div>
  );
}