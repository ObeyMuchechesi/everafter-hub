export default function Timeline({ timeline }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '24px' }}>⏱ Today's Journey</h2>
      <div style={{ borderLeft: '2px solid #fbcfe8', marginLeft: '16px' }}>
        {timeline.map((item, i) => (
          <div key={i} style={{ marginBottom: '32px', marginLeft: '32px', position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '-42px',
              top: '4px',
              width: '24px',
              height: '24px',
              background: 'linear-gradient(to bottom right, #f43f5e, #ec4899)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 0 0 4px white'
            }}>
              {i + 1}
            </span>
            <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontWeight: 600, color: '#1f2937', margin: '0 0 4px 0' }}>{item.event}</h3>
              <p style={{ color: '#f43f5e', fontSize: '14px', fontWeight: 500, margin: '0 0 4px 0' }}>{item.time}</p>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>📍 {item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}