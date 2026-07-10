import { useState } from 'react';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, QrCode, Users, Calendar, MessageCircle, ArrowRight } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaWindows } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    
    router.push({ pathname: '/admin', query: { role: role } });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      backgroundImage: 'url(/login-bg.png)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center' 
    }}>
      {/* Left Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Logo / Monogram */}
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: '10px' }}>
             <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', color: '#e11d48', margin: 0, lineHeight: 1 }}>
               EH
             </h1>
             <span style={{ position: 'absolute', top: 0, right: '-20px', color: '#d97706', fontSize: '24px' }}>✨</span>
          </div>

          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '42px', color: '#e11d48', marginBottom: '8px', fontWeight: 600 }}>
            EverAfter Hub
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ height: '1px', width: '40px', background: '#d97706' }}></div>
            <p style={{ color: '#d97706', fontStyle: 'italic', fontSize: '16px', margin: 0 }}>Every moment, beautifully connected</p>
            <div style={{ height: '1px', width: '40px', background: '#d97706' }}></div>
          </div>

          <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '40px' }}>
            The all-in-one platform to create unforgettable digital experiences for your special events.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
            {[
              { icon: QrCode, label: 'QR Management' },
              { icon: Users, label: 'Guest Management' },
              { icon: Calendar, label: 'Event Timeline' },
              { icon: MessageCircle, label: 'Messages & More' }
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#fce7f3', padding: '16px', borderRadius: '16px', color: '#e11d48' }}>
                  <feature.icon size={24} />
                </div>
                <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 500, textAlign: 'center' }}>
                  {feature.label.split(' ').map((line, j) => <div key={j}>{line}</div>)}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          padding: '48px', 
          width: '100%', 
          maxWidth: '440px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)' 
        }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: '#fce7f3', padding: '12px', borderRadius: '50%', color: '#e11d48' }}>
              <ShieldCheck size={28} />
            </div>
          </div>

          <h3 style={{ fontFamily: 'Playfair Display, serif', textAlign: 'center', fontSize: '32px', color: '#1f2937', marginBottom: '8px' }}>
            Welcome Back
          </h3>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>
            Sign in to your EverAfter Hub account
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter your email" 
                  style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                  required 
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4b5563', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  style={{ width: '100%', padding: '14px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
                  required 
                />
                <div 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#e11d48', width: '16px', height: '16px' }} />
                Remember me
              </label>
              <span style={{ fontSize: '13px', color: '#e11d48', cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', textAlign: 'center', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>{error}</p>}
            
            <button type="submit" style={{ width: '100%', background: '#e11d48', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              Sign In
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
            <button type="button" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              <FcGoogle size={20} />
              Google
            </button>
            <button type="button" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              <FaWindows size={18} color="#00a4ef" />
              Microsoft
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Don't have an account? <span style={{ color: '#e11d48', cursor: 'pointer' }}>Sign up</span>
          </p>

        </div>
      </div>
    </div>
  );
}
