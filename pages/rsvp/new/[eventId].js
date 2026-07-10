import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';
import { motion } from 'framer-motion';
import FullPageLoader from '../../../components/FullPageLoader';
import Spinner from '../../../components/Spinner';

export default function NewRSVP() {
  const router = useRouter();
  const { eventId } = router.query;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dietary, setDietary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId]);

  async function loadEvent(id) {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setError('Event not found.');
    } else {
      setEvent(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and Surname are required");
      return;
    }
    
    setIsSubmitting(true);
    const response = await fetch('/api/rsvp/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        firstName,
        lastName,
        phoneNumber,
        dietaryRequirements: dietary
      })
    });

    const result = await response.json();
    if (response.ok && result.success) {
      setSuccess(true);
    } else {
      alert(result.error || 'Failed to submit RSVP');
    }
    setIsSubmitting(false);
  }

  if (loading) {
    return <FullPageLoader text="Loading Invitation..." />;
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf2f8' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px', fontFamily: 'Playfair Display, serif' }}>Oops!</h2>
          <p style={{ color: '#4b5563' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: event.background_theme ? `url(${event.background_theme})` : '#fdf2f8', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', padding: '20px' }}>
      <div style={{ background: event.background_theme ? 'rgba(255, 255, 255, 0.95)' : 'white', backdropFilter: 'blur(10px)', padding: '40px 30px', borderRadius: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        {event.cover_photo && (
          <img src={event.cover_photo} alt="Event Cover" style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', marginBottom: '24px' }} />
        )}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#f43f5e', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>You are invited to</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#1f2937', marginBottom: '8px' }}>{event.event_name}</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {event.venue && <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>📍 {event.venue}</p>}
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#10b981', marginBottom: '12px' }}>RSVP Confirmed!</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.6 }}>Thank you, {firstName}! You've been successfully added to the guest list and a seat has been reserved for you.</p>
            
            <div style={{ marginTop: '24px', background: '#f3f4f6', padding: '20px', borderRadius: '12px' }}>
              <p style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '14px' }}>We look forward to seeing you!</p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Please check in with your name on the day of the event.</p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>First Name <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Enter your first name" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>Surname <span style={{color: '#ef4444'}}>*</span></label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Enter your surname" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>Phone Number <span style={{color: '#ef4444'}}>*</span></label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="e.g. 0772764534" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>Dietary Requirements</label>
              <input type="text" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="e.g. Vegetarian, Nut allergy (leave blank if none)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '15px', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(244,63,94,0.3)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isSubmitting ? <><Spinner size="20px" /> Reserving...</> : 'Submit RSVP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
