import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || !result.user) {
      setError(result.error || 'Invalid credentials');
      return;
    }

    const role = result.user.role || (email.toLowerCase() === 'admin@everafter.com' ? 'admin' : 'user');
    if (mode === 'admin' && role !== 'admin') {
      setError('This account is not an admin account.');
      return;
    }

    if (mode === 'user' && role === 'admin') {
      setError('Use the admin login option for admin accounts.');
      return;
    }

    router.push({ pathname: '/admin', query: { role: mode } });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1f2937, #111827, #312e81)', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '36px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center', marginBottom: '8px', fontSize: '30px' }}>EverAfter Hub</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '20px' }}>Choose your access level</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button type="button" onClick={() => setMode('admin')} style={{ flex: 1, padding: '10px', borderRadius: '999px', border: mode === 'admin' ? 'none' : '1px solid #e5e7eb', background: mode === 'admin' ? 'linear-gradient(to right, #f43f5e, #ec4899)' : 'white', color: mode === 'admin' ? 'white' : '#4b5563', fontWeight: 600, cursor: 'pointer' }}>Admin</button>
          <button type="button" onClick={() => setMode('user')} style={{ flex: 1, padding: '10px', borderRadius: '999px', border: mode === 'user' ? 'none' : '1px solid #e5e7eb', background: mode === 'user' ? 'linear-gradient(to right, #f43f5e, #ec4899)' : 'white', color: mode === 'user' ? 'white' : '#4b5563', fontWeight: 600, cursor: 'pointer' }}>User</button>
        </div>

        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '12px', boxSizing: 'border-box' }} required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '14px', boxSizing: 'border-box' }} required />
          {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', background: 'linear-gradient(to right, #f43f5e, #ec4899)', color: 'white', padding: '14px', borderRadius: '999px', border: 'none', fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}
