import { useState } from 'react';

export default function Guestbook({ name }) {
  const [messages, setMessages] = useState([
    { author: 'Rudo', text: 'So happy for you two! What a beautiful day ❤️', time: '2 min ago' },
    { author: 'Tendai', text: 'The ceremony was absolutely stunning! ✨', time: '15 min ago' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([{ author: name || 'You', text: newMessage, time: 'Just now' }, ...messages]);
      setNewMessage('');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#1f2937', marginBottom: '24px' }}>💬 Guestbook</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Leave a heartfelt message..."
          style={{
            flex: 1,
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '14px',
            outline: 'none'
          }}
          maxLength={200}
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
          Send
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(to bottom right, #f43f5e, #ec4899)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600
              }}>
                {msg.author[0]}
              </div>
              <span style={{ fontWeight: 600, color: '#1f2937' }}>{msg.author}</span>
              <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: 'auto' }}>{msg.time}</span>
            </div>
            <p style={{ color: '#4b5563', margin: '0 0 0 40px' }}>{msg.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}