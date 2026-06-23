import { useState } from 'react';

export default function PhotoGallery({ event }) {
  const [images] = useState(event.photos || []);
  const [uploaded, setUploaded] = useState([]);
  const [viewing, setViewing] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploaded([{ url, caption: 'Your moment' }, ...uploaded]);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#1f2937' }}>📸 Gallery</h2>
        <label style={{
          background: 'linear-gradient(to right, #f43f5e, #ec4899)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          border: 'none',
          boxShadow: '0 4px 12px rgba(244,63,94,0.3)'
        }}>
          + Add Photo
          <input type="file" style={{ display: 'none' }} onChange={handleUpload} accept="image/*" />
        </label>
      </div>

      {[...uploaded, ...images].length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <p style={{ fontSize: '40px', marginBottom: '8px' }}>📷</p>
          <p>No photos yet. Be the first to share!</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {[...uploaded, ...images].map((pic, i) => (
          <div
            key={i}
            onClick={() => setViewing(pic)}
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              aspectRatio: '1/1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <img src={pic.url} alt={pic.caption || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      {viewing && (
        <div
          onClick={() => setViewing(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={viewing.url} alt={viewing.caption} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px' }} />
            {viewing.caption && (
              <p style={{ color: 'white', textAlign: 'center', marginTop: '12px', fontWeight: 300 }}>{viewing.caption}</p>
            )}
            <button
              onClick={() => setViewing(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}