import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { lookupGuest } from '../lib/guestLookup';

export default function EventPage() {
  const router = useRouter();
  const { id } = router.query;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('details');
  const [newMessage, setNewMessage] = useState('');
  const [newSong, setNewSong] = useState('');
  const [messages, setMessages] = useState([]);
  const [songs, setSongs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (id) loadEvent(id);
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
    const { data: songReqs } = await supabase.from('song_requests').select('*').eq('event_id', eventData.id).order('votes', { ascending: false });

    const menu = {};
    if (menuItems) menuItems.forEach(item => { menu[item.course_type] = item.dish_name; });

    setMessages(guestMessages || []);
    setSongs(songReqs || []);

    setEvent({
      id: eventData.id,
      couple: eventData.host_name || 'Guest',
      date: new Date(eventData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      venue: eventData.venue || '',
      guests: guests?.map(g => ({ name: g.full_name, table: g.table_number, diet: g.dietary_requirements || '' })) || [],
      timeline: timeline?.map(t => ({ time: t.event_time?.slice(0, 5), event: t.title, location: t.location || '' })) || [],
      menu: { starter: menu.starter || '', main: menu.main || '', dessert: menu.dessert || '' }
    });
    setLoading(false);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const found = lookupGuest(event.guests, fullName);
    if (found) { setGuest(found); setError(''); }
    else { setError('Name not found. Please check your spelling.'); }
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

  const submitSong = async (e) => {
    e.preventDefault();
    if (!newSong.trim()) return;
    setIsSubmitting(true);
    const { data, error } = await supabase.from('song_requests').insert({
      event_id: event.id,
      requested_by: guest.name,
      song_title: newSong,
      votes: 1
    }).select().single();
    if (!error && data) {
      setSongs([...songs, data]);
      setNewSong('');
    }
    setIsSubmitting(false);
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
    const tabs = ['details', 'timeline', 'menu', 'photos', 'messages', 'songs'];
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
        <div style={{ padding: '20px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>{event.couple}</h2>
          <button onClick={() => { setGuest(null); setFirstName(''); setLastName(''); }} style={{ background: '#f3f4f6', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Sign Out</button>
        </div>
        
        <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 20px', background: 'white', gap: '8px', borderBottom: '1px solid #e5e7eb', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontWeight: 600, background: activeTab === t ? 'linear-gradient(to right, #f43f5e, #ec4899)' : '#f3f4f6', color: activeTab === t ? 'white' : '#4b5563', whiteSpace: 'nowrap', fontSize: '14px' }}>
              {t === 'details' && '👤 '}{t === 'timeline' && '⏱ '}{t === 'menu' && '🍽 '}{t === 'photos' && '📸 '}{t === 'messages' && '💬 '}{t === 'songs' && '🎵 '}
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '20px', maxWidth: '600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {activeTab === 'details' && (
            <div style={{ background: 'white', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Your Table</p>
              <p style={{ fontSize: '80px', fontFamily: 'Playfair Display, serif', fontWeight: 700, background: 'linear-gradient(to bottom right, #f43f5e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0' }}>{guest.table}</p>
              {guest.diet && <p style={{ color: '#6b7280', marginTop: '16px', fontSize: '14px' }}>🥗 Dietary: {guest.diet}</p>}
              <p style={{ marginTop: '24px', color: '#4b5563', fontSize: '18px' }}>Welcome, <strong>{guest.name}</strong>!</p>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>{event.date} • {event.venue}</p>
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
            <div style={{ background: 'white', borderRadius: '24px', padding: '30px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '16px', fontSize: '22px' }}>Photo Gallery</h3>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📸</div>
              <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.5' }}>The photo gallery will be available during and after the event.</p>
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

          {activeTab === 'songs' && (
            <div style={{ background: 'white', borderRadius: '24px', padding: '30px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '8px', fontSize: '22px', textAlign: 'center' }}>Song Requests</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>Request a song to be played at the event!</p>
              
              <form onSubmit={submitSong} style={{ marginBottom: '30px' }}>
                <input type="text" value={newSong} onChange={(e) => setNewSong(e.target.value)} placeholder="Song Title & Artist" style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #e5e7eb', boxSizing: 'border-box', fontSize: '15px' }} required />
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '15px' }}>{isSubmitting ? 'Sending...' : 'Request Song'}</button>
              </form>

              <div>
                {songs.map(song => (
                  <div key={song.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '16px', borderRadius: '16px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#1f2937', fontWeight: 600 }}>{song.song_title}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Requested by {song.requested_by}</p>
                    </div>
                    <div style={{ background: '#fce7f3', color: '#be185d', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                      👍 {song.votes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '40px 30px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 24px' }}></div>
        <h1 style={{ fontSize: '32px', fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '4px', color: '#1f2937' }}>{event.couple}</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px', fontSize: '14px', fontWeight: 400 }}>{event.date}</p>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '16px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>Find Your Table</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => { setFirstName(e.target.value); setError(''); }} 
              style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} 
              placeholder="First Name" 
              required 
            />
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => { setLastName(e.target.value); setError(''); }} 
              style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} 
              placeholder="Last Name" 
              required 
            />
          </div>
          {error && <p style={{ color: '#dc2626', textAlign: 'center', marginBottom: '16px', fontSize: '14px', background: '#fef2f2', padding: '12px', borderRadius: '12px', fontWeight: 500 }}>{error}</p>}
          <button type="submit" style={{ width: '100%', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '16px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(244,63,94,0.3)', transition: 'transform 0.2s' }}>✨ Enter Dashboard</button>
        </form>
        
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#d1d5db', marginTop: '30px' }}>EverAfter Hub</p>
      </div>
    </div>
  );
}