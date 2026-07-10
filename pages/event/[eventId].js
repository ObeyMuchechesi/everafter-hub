import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function EventPage() {
  const router = useRouter();
  const { eventId } = router.query;
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    if (eventId) loadEvent(eventId);
  }, [eventId, router.isReady]);

  async function loadEvent(slug) {
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!eventData) { setEvent(null); setLoading(false); return; }

    const { data: guests } = await supabase.from('guests').select('*').eq('event_id', eventData.id);

    setEvent({
      couple: eventData.host_name || 'Guest',
      date: new Date(eventData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      venue: eventData.venue || '',
      guests: guests?.map(g => ({ name: g.full_name, table: g.table_number, diet: g.dietary_requirements || '' })) || []
    });
    setLoading(false);
  }

  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff1f2' }}><p>🌸</p></div>;
  if (!event) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff1f2' }}><div style={{textAlign:'center'}}><h1>404</h1><p>Event not found</p></div></div>;

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = event.guests.find(g => g.name.toLowerCase() === name.trim().toLowerCase());
    if (found) { setGuest(found); setError(''); }
    else { setError('Name not found'); }
  };

  if (guest) {
    return (
      <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#fff1f2,#fdf2f8,#fffbeb)',padding:16 }}>
        <div style={{background:'white',borderRadius:24,padding:48,textAlign:'center',maxWidth:400,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}}>
          <p style={{color:'#9ca3af',fontSize:12,textTransform:'uppercase',letterSpacing:2}}>Your Table</p>
          <p style={{fontSize:80,fontFamily:'Playfair Display,serif',fontWeight:700,color:'#f43f5e',margin:'16px 0'}}>{guest.table}</p>
          {guest.diet && <p style={{color:'#6b7280'}}>🥗 {guest.diet}</p>}
          <p style={{marginTop:24}}>Welcome, {guest.name}!</p>
          <button onClick={()=>setGuest(null)} style={{marginTop:16,background:'transparent',border:'1px solid #e5e7eb',padding:'8px 20px',borderRadius:20,cursor:'pointer'}}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'linear-gradient(135deg,#fff1f2,#fdf2f8,#fffbeb)' }}>
      <div style={{background:'white',borderRadius:24,padding:48,maxWidth:400,width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}}>
        <h1 style={{fontSize:28,fontFamily:'Playfair Display,serif',textAlign:'center',marginBottom:4}}>{event.couple}</h1>
        <p style={{textAlign:'center',color:'#6b7280',marginBottom:4,fontSize:14}}>{event.date}</p>
        <p style={{textAlign:'center',color:'#9ca3af',marginBottom:24,fontSize:13}}>{event.venue}</p>
        <form onSubmit={handleSubmit}>
          <input type="text" value={name} onChange={(e)=>{setName(e.target.value);setError('')}} style={{width:'100%',border:'2px solid #e5e7eb',borderRadius:12,padding:16,fontSize:16,boxSizing:'border-box',marginBottom:12}} placeholder="Enter your full name..." required />
          {error && <p style={{color:'#dc2626',textAlign:'center',marginBottom:12}}>{error}</p>}
          <button type="submit" style={{width:'100%',background:'linear-gradient(to right,#f43f5e,#ec4899)',color:'white',padding:14,borderRadius:9999,border:'none',fontWeight:600,fontSize:16,cursor:'pointer'}}>✨ Find My Table</button>
        </form>
      </div>
    </div>
  );
}