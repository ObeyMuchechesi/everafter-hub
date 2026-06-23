import { useState } from 'react';

export default function SongRequests({ name }) {
  const [requests, setRequests] = useState([
    { song: 'Perfect - Ed Sheeran', by: 'Tendai', votes: 5 },
    { song: 'All of Me - John Legend', by: 'Rudo', votes: 3 },
  ]);
  const [song, setSong] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (song.trim()) {
      setRequests([...requests, { song: song.trim(), by: name || 'You', votes: 0 }]);
      setSong('');
    }
  };

  const handleVote = (index) => {
    const updated = [...requests];
    updated[index].votes += 1;
    setRequests(updated);
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '24px' }}>🎵 Song Requests</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={song}
          onChange={(e) => setSong(e.target.value)}
          placeholder="Song title & artist..."
          style={{
            flex: 1,
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button type="submit" style={{
          background: 'linear-gradient(to right, #f43f5e, #ec4899)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(244,63,94,0.3)'
        }}>
          Request
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.sort((a, b) => b.votes - a.votes).map((r, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🎶</span>
              <div>
                <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{r.song}</p>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>Requested by {r.by}</p>
              </div>
            </div>
            <button
              onClick={() => handleVote(i)}
              style={{
                background: '#fff1f2',
                border: 'none',
                color: '#f43f5e',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              👍 {r.votes}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}