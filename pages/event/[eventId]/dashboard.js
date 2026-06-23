import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getEventData } from '../../../lib/eventData';
import DashboardTabs from '../../../components/DashboardTabs';

export default function GuestDashboard() {
  const router = useRouter();
  const { eventId, name, table, diet } = router.query;
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('table');

  useEffect(() => {
    if (eventId) {
      const data = getEventData(eventId);
      setEvent(data);
    }
  }, [eventId]);

  if (!event || !name) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)'
      }}>
        <div className="animate-fadeIn" style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ fontSize: '36px', marginBottom: '16px' }}>🌸</div>
          <p style={{ color: '#6b7280', fontWeight: 300 }}>Preparing your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)',
      padding: '16px'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <header className="animate-fadeIn" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '4px',
            background: 'linear-gradient(to right, #fb7185, #fbbf24)',
            borderRadius: '9999px',
            margin: '0 auto 16px'
          }}></div>
          <h1 style={{ fontSize: '36px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '8px' }}>
            {event.couple}
          </h1>
          <p style={{ color: '#6b7280', fontWeight: 300 }}>
            Welcome, <span style={{ color: '#f43f5e', fontWeight: 500 }}>{name}</span>! ✨
          </p>
        </header>

        <div className="glass-card animate-fadeIn" style={{
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-24px', right: '-24px', fontSize: '60px', opacity: 0.1 }}>🌸</div>
          <p style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: 500 }}>
            Your Table
          </p>
          <p style={{
            fontSize: '80px',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            background: 'linear-gradient(to bottom right, #f43f5e, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            {table}
          </p>
          {diet && (
            <p style={{ color: '#6b7280', marginTop: '12px', fontSize: '14px' }}>
              🥗 <span style={{ fontWeight: 500 }}>{diet}</span> preference noted
            </p>
          )}
          <div style={{ position: 'absolute', bottom: '-16px', left: '-16px', fontSize: '50px', opacity: 0.1 }}>💫</div>
        </div>

        <div className="animate-fadeIn" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          {[
            { key: 'photos', icon: '📸', label: 'Photos' },
            { key: 'timeline', icon: '⏱', label: 'Timeline' },
            { key: 'menu', icon: '🍽', label: 'Menu' },
            { key: 'guestbook', icon: '💬', label: 'Guestbook' },
            { key: 'requests', icon: '🎵', label: 'Requests' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'tab-active' : 'tab-inactive'}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="glass-card animate-fadeIn" style={{ borderRadius: '24px', padding: '24px', minHeight: '300px' }}>
          <DashboardTabs event={event} activeTab={activeTab} name={name} />
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '32px', fontWeight: 300 }}>
          ✨ With love, {event.couple} ✨
        </p>
      </div>
    </div>
  );
}