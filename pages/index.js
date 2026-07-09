import { useState } from 'react';
import { useRouter } from 'next/router';
import { lookupGuest } from '../lib/guestLookup';
import { Sparkles, Star, Heart, Flower2, User } from 'lucide-react';
import Particles from '../components/Particles';

export default function EventLanding({ event }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!event) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'var(--bg-color)',
        position: 'relative'
      }}>
        <Particles count={15} />
        <div className="glass-card" style={{
          borderRadius: '24px',
          padding: '48px',
          width: '100%',
          maxWidth: '460px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <h1 style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginBottom: '12px', color: 'var(--text-main)' }}>EverAfter Hub</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Open your event link or visit the admin page to manage this experience.</p>
          <button
            onClick={() => router.push('/admin')}
            className="btn-primary"
          >
            Go to Admin
          </button>
        </div>
      </div>
    );
  }

  if (router.isFallback) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--accent-primary)' }}>
            <Flower2 size={36} />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
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
      background: 'var(--bg-color)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Particles count={25} />
      <div style={{ position: 'absolute', top: '40px', left: '40px', color: 'var(--accent-glow)' }} className="animate-float"><Flower2 size={36} /></div>
      <div style={{ position: 'absolute', top: '80px', right: '60px', color: 'var(--accent-glow)', animationDelay: '1s' }} className="animate-float"><Sparkles size={28} /></div>
      <div style={{ position: 'absolute', bottom: '80px', left: '80px', color: 'var(--accent-glow)', animationDelay: '2s' }} className="animate-float"><Heart size={28} /></div>
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', color: 'var(--accent-glow)', animationDelay: '0.5s' }} className="animate-float"><Star size={36} /></div>

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
          background: 'var(--accent-primary)',
          borderRadius: '9999px',
          margin: '0 auto 24px'
        }}></div>
        
        <h1 style={{
          fontSize: '36px',
          fontFamily: 'var(--font-serif)',
          textAlign: 'center',
          color: 'var(--text-main)',
          marginBottom: '8px'
        }}>
          {event.couple}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 300 }}>
          {event.date}
        </p>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', fontWeight: 300 }}>
          {event.venue}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-muted)',
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
                border: '2px solid var(--border-glow)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-main)',
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
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <User size={20} />
            </span>
          </div>

          {error && (
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
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

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px', fontWeight: 300 }}>
          Your table number will appear instantly
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { getEventData } = await import('../lib/eventData');
    const event = params?.eventId ? await getEventData(params.eventId) : null;
    return {
      props: { event: event || null }
    };
  } catch (error) {
    console.error('Error loading event:', error);
    return {
      props: { event: null }
    };
  }
}