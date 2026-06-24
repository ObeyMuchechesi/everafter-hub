import { useState } from 'react';
import { supabase } from '../lib/supabase';

const YOUR_USER_ID = '2b4afcb9-4075-42a5-a612-949496562698';

export default function Admin() {
  const [email, setEmail] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'wedding',
    event_name: '',
    host_name: '',
    event_date: '',
    venue: '',
    slug: ''
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'muchechesio@gmail.com') {
      setLoggedIn(true);
      loadEvents();
    } else {
      alert('Wrong email');
    }
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    setEvents(data || []);
  };

  const createEvent = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('events')
      .insert({
        user_id: YOUR_USER_ID,
        event_type: newEvent.event_type,
        event_name: newEvent.event_name,
        host_name: newEvent.host_name,
        event_date: newEvent.event_date,
        venue: newEvent.venue,
        slug: newEvent.slug
      });
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Event created successfully!');
      setShowForm(false);
      setNewEvent({ event_type: 'wedding', event_name: '', host_name: '', event_date: '', venue: '', slug: '' });
      loadEvents();
    }
  };

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
        <div className="glass-card" style={{ padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '24px' }}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email" 
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '16px', boxSizing: 'border-box' }} 
              required 
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#1f2937' }}>📋 My Events</h1>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Event'}
          </button>
        </div>

        {showForm && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '16px' }}>Create New Event</h3>
            <form onSubmit={createEvent} style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
              <select value={newEvent.event_type} onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                <option value="wedding">💒 Wedding</option>
                <option value="corporate">💼 Corporate</option>
                <option value="birthday">🎂 Birthday</option>
                <option value="gala">✨ Gala</option>
                <option value="party">🎉 Party</option>
                <option value="other">🎯 Other</option>
              </select>
              <input placeholder="Event Name" value={newEvent.event_name} onChange={(e) => setNewEvent({...newEvent, event_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
              <input placeholder="Host/Couple Name" value={newEvent.host_name} onChange={(e) => setNewEvent({...newEvent, host_name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
              <input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
              <input placeholder="Venue" value={newEvent.venue} onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
              <input placeholder="URL slug (e.g., tanya-birthday-2026)" value={newEvent.slug} onChange={(e) => setNewEvent({...newEvent, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e5e7eb' }} required />
              <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>Create Event</button>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {events.map(event => (
            <div key={event.id} className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{event.event_name}</p>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0' }}>
                  {event.event_type} • {new Date(event.event_date).toLocaleDateString()} • {event.venue}
                </p>
                <code style={{ fontSize: '12px', color: '#f43f5e' }}>/{event.slug}</code>
              </div>
              <a href={`/event/${event.slug}`} target="_blank" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>View →</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}