import { useState } from 'react';

// ----- inline helpers (no extra imports needed) -----
function lookupGuest(guests, name) {
  return guests.find((g) => g.name.toLowerCase() === name.toLowerCase());
}

async function getEventData(slug) {
  const res = await fetch('/api/event?slug=' + slug);
  if (!res.ok) return null;
  return await res.json();
}

async function getGuestbookMessages(eventId) {
  const res = await fetch('/api/guestbook?eventId=' + eventId);
  if (!res.ok) return [];
  return await res.json();
}

async function getSongRequests(eventId) {
  const res = await fetch('/api/songs?eventId=' + eventId);
  if (!res.ok) return [];
  return await res.json();
}

async function addGuestbookMessage(eventId, guestName, message) {
  await fetch('/api/guestbook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, guestName, message }),
  });
}

async function addSongRequest(eventId, songTitle, requestedBy) {
  await fetch('/api/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, songTitle, requestedBy }),
  });
}
// ----------------------------------------------------

export default function EventPage({ event }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guest, setGuest] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [guestbookMessages, setGuestbookMessages] = useState([]);
  const [songRequests, setSongRequests] = useState([]);

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
        setError('Name not found.');
        setIsSubmitting(false);
      }
    }, 600);
  };

  if (guest) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)', padding: '16px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 16px' }}></div>
            <h1 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '8px' }}>{event.couple}</h1>
            <p style={{ color: '#6b7280', fontWeight: 300 }}>Welcome, <span style={{ color: '#f43f5e', fontWeight: 500 }}>{guest.name}</span>! ✨</p>
            <button onClick={() => setGuest(null)} style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '6px 16px', borderRadius: '20px', marginTop: '12px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>← Back</button>
          </header>
          <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '24px', padding: '32px', marginBottom: '32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Your Table</p>
            <p style={{ fontSize: '80px', fontFamily: 'Playfair Display, serif', fontWeight: 700, background: 'linear-gradient(to bottom right, #f43f5e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>{guest.table}</p>
            {guest.diet && <p style={{ color: '#6b7280', marginTop: '12px' }}>🥗 {guest.diet}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            {['photos','timeline','menu','guestbook','requests'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '10px 18px', borderRadius: '9999px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', border: 'none',
                background: activeTab === tab ? 'linear-gradient(to right, #f43f5e, #ec4899)' : 'white',
                color: activeTab === tab ? 'white' : '#4b5563'
              }}>{tab}</button>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '24px', padding: '24px', minHeight: '300px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '24px', padding: '48px', maxWidth: '450px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', textAlign: 'center', color: '#1f2937', marginBottom: '8px' }}>{event.couple}</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '24px' }}>{event.date}</p>
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px', fontSize: '16px', boxSizing: 'border-box', marginBottom: '12px' }} placeholder="Enter your full name..." required />
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '12px', marginBottom: '12px', textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={isSubmitting} style={{ width: '100%', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '14px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>{isSubmitting ? 'Finding...' : '✨ Find My Table'}</button>
        </form>
      </div>
    </div>
  );
}

function PhotoGallery({ event }) {
  const photos = event.photos || [];
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>📸 Photos</h2>
      {photos.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>No photos yet</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {photos.map((pic, i) => (
          <div key={i} style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <img src={pic.url} alt={pic.caption} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline({ timeline }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>⏱ Timeline</h2>
      {timeline.map((item, i) => (
        <div key={i} style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{item.time} — {item.event}</p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>📍 {item.location}</p>
        </div>
      ))}
    </div>
  );
}

function Menu({ menu }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>🍽 Menu</h2>
      {menu.starter && <p><strong>Starter:</strong> {menu.starter}</p>}
      {menu.main && <p><strong>Main:</strong> {menu.main}</p>}
      {menu.dessert && <p><strong>Dessert:</strong> {menu.dessert}</p>}
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
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Leave a message..." style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: '10px', padding: '10px' }} />
        <button type="submit" style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 600 }}>Send</button>
      </form>
      {messages.map((m, i) => (
        <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '10px', marginBottom: '8px' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{m.guest_name}</p>
          <p style={{ color: '#4b5563', margin: 0 }}>{m.message}</p>
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
        <input value={song} onChange={(e) => setSong(e.target.value)} placeholder="Song title..." style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: '10px', padding: '10px' }} />
        <button type="submit" style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 600 }}>Request</button>
      </form>
      {requests.map((r, i) => (
        <div key={i} style={{ background: 'white', padding: '12px', borderRadius: '10px', marginBottom: '8px' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>🎵 {r.song_title}</p>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>by {r.requested_by}</p>
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const event = await getEventData(params.eventId);
    if (!event) return { notFound: true };
    return { props: { event } };
  } catch (error) {
    return { notFound: true };
  }
}