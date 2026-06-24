import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';

export default function EventPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) loadEvent(eventId);
  }, [eventId]);

  async function loadEvent(slug) {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!eventData) { setLoading(false); return; }

    const { data: guests } = await supabase.from('guests').select('*').eq('event_id', eventData.id);
    const { data: menuItems } = await supabase.from('menu_items').select('*').eq('event_id', eventData.id);
    const { data: timeline } = await supabase.from('timeline_items').select('*').eq('event_id', eventData.id).order('sort_order');

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
        <p style={{ fontSize: '32px' }}>🌸</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px' }}>404</h1>
          <p>Event not found</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = event.guests.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
    if (found) { setGuest(found); setError(''); }
    else { setError('Name not found'); }
  };

  if (guest) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)', padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '48px', textAlign: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Your Table</p>
          <p style={{ fontSize: '80px', fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#f43f5e', margin: '16px 0' }}>{guest.table}</p>
          {guest.diet && <p style={{ color: '#6b7280' }}>🥗 {guest.diet}</p>}
          <p style={{ marginTop: '24px' }}>Welcome, {guest.name}!</p>
          <button onClick={() => setGuest(null)} style={{ marginTop: '16px', background: 'transparent', border: '1px solid #e5e7eb', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer' }}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '48px', maxWidth: '400px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '28px', fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '4px' }}>{event.couple}</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '4px', fontSize: '14px' }}>{event.date}</p>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '24px', fontSize: '13px' }}>{event.venue}</p>
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px', fontSize: '16px', boxSizing: 'border-box', marginBottom: '12px' }} placeholder="Enter your full name..." required />
          {error && <p style={{ color: '#dc2626', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '14px', borderRadius: '9999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>✨ Find My Table</button>
        </form>
      </div>
    </div>
  );
}