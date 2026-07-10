import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function RSVP() {
  const router = useRouter();
  const { token } = router.query;
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('attending');
  const [diet, setDiet] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function loadGuestData(guestToken) {
    setLoading(true);
    // In a real RLS setup, this would be a backend call, or the token must match perfectly.
    // For now, we query the guest by token.
    const { data, error } = await supabase
      .from('guests')
      .select('*, events(*)')
      .eq('guest_token', guestToken)
      .single();

    if (error || !data) {
      setError('Invalid or expired RSVP token.');
      setLoading(false);
      return;
    }

    setGuest(data);
    setEvent(data.events);
    setStatus(data.rsvp_status || 'attending');
    setDiet(data.dietary_requirements || '');
    setLoading(false);
  }

  useEffect(() => {
    if (token) {
      loadGuestData(token);
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase
      .from('guests')
      .update({ rsvp_status: status, dietary_requirements: diet })
      .eq('guest_token', token);

    setIsSubmitting(false);
    if (!error) {
      setSuccess(true);
    } else {
      alert('Failed to save RSVP. Please try again.');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf2f8' }}>
        <div style={{ fontSize: '40px', animation: 'spin 1s linear infinite' }}>⏳</div>
      </div>
    );
  }

  if (error) {
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf2f8', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px 30px', borderRadius: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '2px', color: '#f43f5e', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>You are invited to</p>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#1f2937', marginBottom: '8px' }}>{event.event_name}</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#10b981', marginBottom: '12px' }}>RSVP Confirmed!</h2>
            <p style={{ color: '#4b5563', lineHeight: 1.6 }}>Thank you, {guest.first_name}. We have recorded your response.</p>
            {status === 'attending' && (
              <p style={{ color: '#4b5563', marginTop: '12px', fontSize: '14px' }}>Keep this link safe! You will use it to check in and access the guest portal on the day of the event.</p>
            )}
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>Hello, {guest.first_name} {guest.last_name}!</p>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>Will you be attending?</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStatus('attending')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: status === 'attending' ? '2px solid #10b981' : '2px solid #e5e7eb', background: status === 'attending' ? '#d1fae5' : 'white', color: status === 'attending' ? '#065f46' : '#4b5563', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Yes, I&apos;ll be there!</button>
                <button type="button" onClick={() => setStatus('declined')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: status === 'declined' ? '2px solid #ef4444' : '2px solid #e5e7eb', background: status === 'declined' ? '#fee2e2' : 'white', color: status === 'declined' ? '#991b1b' : '#4b5563', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>No, I can&apos;t make it</button>
              </div>
            </div>

            <AnimatePresence>
              {status === 'attending' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '8px', display: 'block' }}>Any dietary requirements?</label>
                  <input type="text" value={diet} onChange={(e) => setDiet(e.target.value)} placeholder="e.g. Vegetarian, Nut allergy (leave blank if none)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '15px', boxSizing: 'border-box' }} />
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(244,63,94,0.3)', marginTop: '8px' }}>
              {isSubmitting ? 'Saving...' : 'Confirm RSVP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
