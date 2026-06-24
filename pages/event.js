import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function EventPage() {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

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

    const { data: guests } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eventData.id)
      .order('table_number');

    const { data: timeline } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('event_id', eventData.id)
      .order('sort_order');

    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', eventData.id);

    const menu = {};
    if (menuItems) menuItems.forEach(item => { menu[item.course_type] = item.dish_name; });

    setEvent({
      couple: eventData.host_name || 'Guest',
      date: new Date(eventData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      venue: eventData.venue || '',
      guests: guests?.map(g => ({ name: g.full_name, table: g.table_number, diet: g.dietary_requirements || '' })) || [],
      timeline: timeline?.map(t => ({ time: t.event_time?.slice(0, 5), event: t.title, location: t.location || '' })) || [],
      menu: { starter: menu.starter || '', main: menu.main || '', dessert: menu.dessert || '' }
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2' }}>
        <p style={{ fontSize: '40px' }}>🌸</p>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = event.guests.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
    if (found) { setGuest(found); setError(''); }
    else { setError('Name not found. Please check your spelling.'); }
  };

  if (guest) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 20px' }}></div>
          <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Your Table</p>
          <p style={{ fontSize: '90px', fontFamily: 'Playfair Display, serif', fontWeight: 700, background: 'linear-gradient(to bottom right, #f43f5e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0' }}>{guest.table}</p>
          {guest.diet && <p style={{ color: '#6b7280', marginTop: '16px', fontSize: '14px' }}>🥗 {guest.diet}</p>}
          <p style={{ marginTop: '24px', color: '#4b5563', fontSize: '16px' }}>Welcome, <strong>{guest.name}</strong>!</p>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>{event.couple} • {event.venue}</p>
          <button onClick={() => setGuest(null)} style={{ marginTop: '20px', background: 'transparent', border: '1px solid #e5e7eb', padding: '10px 24px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '48px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '60px', height: '4px', background: 'linear-gradient(to right, #fb7185, #fbbf24)', borderRadius: '9999px', margin: '0 auto 20px' }}></div>
        <h1 style={{ fontSize: '30px', fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '4px', color: '#1f2937' }}>{event.couple}</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2px', fontSize: '14px', fontWeight: 300 }}>{event.date}</p>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '28px', fontSize: '13px' }}>📍 {event.venue}</p>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>Find Your Table</label>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => { setName(e.target.value); setError(''); }} 
              style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px 16px 16px 44px', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} 
              placeholder="Enter your full name..." 
              required 
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}>👤</span>
          </div>
          {error && <p style={{ color: '#dc2626', textAlign: 'center', marginBottom: '12px', fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '10px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '16px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(244,63,94,0.3)' }}>✨ Find My Table</button>
        </form>
        
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#d1d5db', marginTop: '20px' }}>EverAfter Hub</p>
      </div>
    </div>
  );
}