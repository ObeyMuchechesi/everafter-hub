import { useState } from 'react';
import { useRouter } from 'next/router';
import { lookupGuest } from '../../../lib/guestLookup';
import { getEventData } from '../../../lib/eventData';

export default function EventLanding({ event }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ fontSize: '36px', marginBottom: '16px' }}>🌸</div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const guest = lookupGuest(event.guests, name.trim());
      if (guest) {
        router.push({
          pathname: `/event/${event.slug}/dashboard`,
          query: {
            name: guest.name,
            table: guest.table,
            diet: guest.diet || '',
          }
        });
      } else {
        setError('Name not found. Please check your spelling or contact the host.');
        setIsSubmitting(false);
      }
    }, 600);
  };

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
      <div style={{ position: 'absolute', top: '80px', right: '60px', fontSize: '28px', opacity: 0.3, animationDelay: '1s' }} className="animate-float">✨</div>
      <div style={{ position: 'absolute', bottom: '80px', left: '80px', fontSize: '28px', opacity: 0.3, animationDelay: '2s' }} className="animate-float">🌿</div>
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '36px', opacity: 0.3, animationDelay: '0.5s' }} className="animate-float">💫</div>

      <div className="glass-card animate-fadeIn" style={{
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          width: '80px',
          height: '4px',
          background: 'linear-gradient(to right, #fb7185, #fbbf24)',
          borderRadius: '9999px',
          margin: '0 auto 24px'
        }}></div>
        
        <h1 style={{
          fontSize: '36px',
          fontFamily: 'Playfair Display, serif',
          textAlign: 'center',
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          {event.couple}
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '8px', fontWeight: 300 }}>
          {event.date}
        </p>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginBottom: '32px', fontWeight: 300 }}>
          {event.venue}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: '#4b5563',
            marginBottom: '8px',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Find Your Table
          </label>
          
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              style={{
                width: '100%',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px 16px 16px 48px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your full name..."
              required
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px' }}>👤</span>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center'
            }} className="animate-fadeIn">
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%' }}>
            {isSubmitting ? 'Finding...' : '✨ Find My Table'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '24px', fontWeight: 300 }}>
          Your table number will appear instantly
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const event = await getEventData(params.eventId);
    if (!event) {
      return { notFound: true };
    }
    return { 
      props: { event }
    };
  } catch (error) {
    console.error('Error loading event:', error);
    return { notFound: true };
  }
}