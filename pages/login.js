import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('admin');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <>
      <Head>
        <title>EverAfter Hub - Login</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </Head>
      <div className="login-body-wrapper">
        <div className="background-container"></div>
        
        <div className="main-container">
            <div className="right-section" style={{ margin: '0 auto' }}>
                <div className="login-card">
                    <div className="brand-header">
                        <img src="/logo.png" alt="EverAfter Hub Logo" className="brand-logo" />
                        <div className="tagline-container">
                            <span className="tagline-text">Every moment, beautifully connected</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                      <button 
                        type="button" 
                        onClick={() => setMode('admin')} 
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: mode === 'admin' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', background: mode === 'admin' ? '#fff0f3' : 'white', color: mode === 'admin' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', transition: 'all 0.2s' }}
                      >
                        Admin
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setMode('user')} 
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: mode === 'user' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)', background: mode === 'user' ? '#fff0f3' : 'white', color: mode === 'user' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '13px', transition: 'all 0.2s' }}
                      >
                        User
                      </button>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon">mail</span>
                                <input 
                                  type="email" 
                                  placeholder="Enter your email" 
                                  value={email} 
                                  onChange={(e) => setEmail(e.target.value)} 
                                  required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon">lock</span>
                                <input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="Enter your password" 
                                  value={password} 
                                  onChange={(e) => setPassword(e.target.value)} 
                                  required 
                                />
                                <span 
                                  className="material-symbols-outlined password-toggle"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </div>
                        </div>
                        
                        {error && <p style={{ color: '#d11f4d', fontSize: '13px', marginBottom: '16px', textAlign: 'center', background: '#fff0f3', padding: '10px', borderRadius: '6px', fontWeight: 500 }}>{error}</p>}

                        <div className="form-actions">
                            <label className="remember-me">
                                <input type="checkbox" defaultChecked />
                                <span className="custom-checkbox">
                                    <span className="material-symbols-outlined check-icon">check</span>
                                </span>
                                Remember me
                            </label>
                        </div>

                        <button type="submit" className="sign-in-btn">
                            Sign In
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </form>

                    <p className="brand-description" style={{ marginTop: '24px', marginBottom: '0' }}>
                        The all-in-one platform to create unforgettable<br/>
                        digital experiences for your special events.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
