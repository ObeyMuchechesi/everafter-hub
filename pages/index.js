import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function Home() {
  const [eventId, setEventId] = useState('sarah-james-2026');
  const [eventName, setEventName] = useState("Sarah & James' Wedding");
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const eventUrl = `${baseUrl}/event/${eventId}`;

  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.download = `everafter-qr-${eventId}.png`;
      link.href = pngUrl;
      link.click();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff1f2, #fdf2f8, #fffbeb)', padding: '24px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fadeIn">
          <h1 style={{ fontSize: '48px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '12px' }}>EverAfter Hub ✨</h1>
          <p style={{ color: '#6b7280', fontWeight: 300 }}>Generate beautiful QR codes for your wedding or event</p>
        </div>

        <div className="glass-card animate-fadeIn" style={{ borderRadius: '24px', padding: '40px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Event Name</label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '12px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} placeholder="e.g., Sarah & James' Wedding" />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#4b5563', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Event ID</label>
            <input type="text" value={eventId} onChange={(e) => setEventId(e.target.value.toLowerCase().replace(/\s+/g, '-'))} style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} placeholder="event-name-2026" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '24px', background: 'white', borderRadius: '16px' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
              <QRCodeCanvas id="qr-code-canvas" value={eventUrl} size={200} level="H" includeMargin={true} fgColor="#e11d48" bgColor="#ffffff" />
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'center' }}>{eventUrl}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleDownload} className="btn-primary">📥 Download QR Code</button>
            <button onClick={() => { navigator.clipboard.writeText(eventUrl); alert('Link copied!'); }} style={{ background: 'white', border: '2px solid #fecdd3', color: '#f43f5e', padding: '12px 24px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>📋 Copy Link</button>
          </div>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', color: '#6b7280', fontWeight: 300, fontSize: '14px' }} className="animate-fadeIn">
          <p>1. Generate QR code → 2. Print & display at venue → 3. Guests scan & find their table</p>
        </div>
      </div>
    </div>
  );
}