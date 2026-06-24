import { useState } from 'react';
import { useRouter } from 'next/router';
import { getEventData, getGuestbookMessages, getSongRequests, addGuestbookMessage, addSongRequest } from '../../../lib/eventData';

function lookupGuest(guests, name) {
  return guests.find(
    (g) => g.name.toLowerCase() === name.toLowerCase()
  );
}

export default function EventPage({ event }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guest, setGuest] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [guestbookMessages, setGuestbookMessages] = useState([]);
  const [songRequests, setSongRequests] = useState([]);
  const router = useRouter();

  const loadDashboardData = async (eventId) => {
    const messages = await getGuestbookMessages(eventId);
    setGuestbookMessages(messages);
    const songs = await getSongRequests(eventId);
    setSongRequests(songs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const found = lookupGuest(event.guests, name.trim());
      if (found) {
        setGuest(found);
        loadDashboardData(event.eventId);
      } else {
        setError('Name not found. Please check your spelling or contact the host.');
        setIsSubmitting(false);
      }
    }, 600);
  };

  if (guest) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)', padding: '16px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <header className="animate-fadeIn" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 16px' }}></div>
            <h1 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '8px' }}>{event.couple}</h1>
            <p style={{ color: '#6b7280', fontWeight: 300 }}>Welcome, <span style={{ color: '#f43f5e', fontWeight: 500 }}>{guest.name}</span>! ✨</p>
            <button onClick={() => setGuest(null)} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 16px', borderRadius: '20px', marginTop: '12px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>← Back</button>
          </header>

          <div className="glass-card animate-fadeIn" style={{ borderRadius: '24px', padding: '32px', marginBottom: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-24px', right: '-24px', fontSize: '60px', opacity: 0.1 }}>🌸</div>
            <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: 500 }}>Your Table</p>
            <p style={{ fontSize: '80px', fontFamily: 'Playfair Display, serif', fontWeight: 700, background: 'linear-gradient(to bottom right, #f43f5e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>{guest.table}</p>
            {guest.diet && <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '14px' }}>🥗 <span style={{ fontWeight: 500 }}>{guest.diet}</span></p>}
            <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', fontSize: '50px', opacity: 0.1 }}>💫</div>
          </div>

          <div className="animate-fadeIn" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            {[
              { key: 'photos', icon: '📸', label: 'Photos' },
              { key: 'timeline', icon: '⏱', label: 'Timeline' },
              { key: 'menu', icon: '🍽', label: 'Menu' },
              { key: 'guestbook', icon: '💬', label: 'Guestbook' },
              { key: 'requests', icon: '🎵', label: 'Requests' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? 'tab-active' : 'tab-inactive'} style={{ padding: '10px 18px', borderRadius: '9999px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="glass-card animate-fadeIn" style={{ borderRadius: '24px', padding: '24px', minHeight: '300px' }}>
            {activeTab === 'photos' && <PhotoGallery event={event} />}
            {activeTab === 'timeline' && <Timeline timeline={event.timeline} />}
            {activeTab === 'menu' && <Menu menu={event.menu} />}
            {activeTab === 'guestbook' && <Guestbook name={guest.name} eventId={event.eventId} messages={guestbookMessages} onUpdate={() => loadDashboardData(event.eventId)} />}
            {activeTab === 'requests' && <SongRequests name={guest.name} eventId={event.eventId} requests={songRequests} onUpdate={() => loadDashboardData(event.eventId)} />}
          </div>

          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '32px' }}>✨ With love, {event.couple} ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '40px', left: '40px', fontSize: '36px', opacity: 0.3 }} className="animate-float">🌸</div>
      <div style={{ position: 'absolute', top: '80px', right: '60px', fontSize: '28px', opacity: 0.3 }} className="animate-float">✨</div>
      <div style={{ position: 'absolute', bottom: '80px', left: '80px', fontSize: '28px', opacity: 0.3 }} className="animate-float">🌿</div>
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '36px', opacity: 0.3 }} className="animate-float">💫</div>

      <div className="glass-card animate-fadeIn" style={{
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ width: '80px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 24px' }}></div>
        
        <h1 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#1f2937', marginBottom: '8px' }}>{event.couple}</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '8px', fontWeight: 300 }}>{event.date}</p>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginBottom: '32px', fontWeight: 300 }}>{event.venue}</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#4b5563', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>Find Your Table</label>
          
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px 16px 16px 48px', fontSize: '16px', outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' }} placeholder="Enter your full name..." required />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }}>👤</span>
          </div>

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%' }}>{isSubmitting ? 'Finding...' : '✨ Find My Table'}</button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px', fontWeight: 300 }}>Your table number will appear instantly</p>
      </div>
    </div>
  );
}

function PhotoGallery({ event }) {
  const [images] = useState(event.photos || []);
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>📸 Photos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {images.map((pic, i) => (
          <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1' }}>
            <img src={pic.url} alt={pic.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      {images.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>No photos yet</p>}
    </div>
  );
}

function Timeline({ timeline }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>⏱ Timeline</h2>
      {timeline.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(to bottom right, #f43f5e, #ec4899)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{i + 1}</div>
            {i < timeline.length - 1 && <div style={{ width: '2px', height: '30px', background: '#fbcfe8', margin: '4px auto' }}></div>}
          </div>
          <div>
            <p style={{ fontWeight: 600, margin: 0 }}>{item.event}</p>
            <p style={{ color: '#f43f5e', fontSize: '13px', margin: '2px 0' }}>{item.time}</p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>📍 {item.location}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Menu({ menu }) {
  const courses = [
    { label: 'Starter', dish: menu.starter, emoji: '🥗' },
    { label: 'Main', dish: menu.main, emoji: '🍖' },
    { label: 'Dessert', dish: menu.dessert, emoji: '🍫' },
  ];
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>🍽 Menu</h2>
      {courses.map((c, i) => (
        <div key={i} style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>{c.emoji}</span>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', margin: 0 }}>{c.label}</p>
            <p style={{ fontWeight: 600, margin: '2px 0 0 0' }}>{c.dish || 'TBA'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Guestbook({ name, eventId, messages, onUpdate }) {
  const [msg, setMsg] = useState('');
  const handleSend = async (e) => {
    e.preventDefault();
    if (msg.trim()) {
      await addGuestbookMessage(eventId, name, msg);
      setMsg('');
      onUpdate();
    }
  };
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>💬 Guestbook</h2>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Leave a message..." style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: '10px', padding: '10px' }} maxLength={200} />
        <button type="submit" style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 600 }}>Send</button>
      </form>
      {messages.map((m, i) => (
        <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '10px', marginBottom: '8px' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{m.guest_name}</p>
          <p style={{ color: '#4b5563', margin: '4px 0 0 0' }}>{m.message}</p>
        </div>
      ))}
    </div>
  );
}

function SongRequests({ name, eventId, requests, onUpdate }) {
  const [song, setSong] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (song.trim()) {
      await addSongRequest(eventId, song, name);
      setSong('');
      onUpdate();
    }
  };
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>🎵 Song Requests</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input value={song} onChange={(e) => setSong(e.target.value)} placeholder="Song title & artist..." style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: '10px', padding: '10px' }} />
        <button type="submit" style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 600 }}>Request</button>
      </form>
      {requests.map((r, i) => (
        <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '10px', marginBottom: '8px' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>🎵 {r.song_title}</p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0 0' }}>by {r.requested_by} • 👍 {r.votes}</p>
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const event = await getEventData(params.eventId);
    if (!event) {
      return { notFound: true };
    }
    return { props: { event } };
  } catch (error) {
    return { notFound: true };
  }
}