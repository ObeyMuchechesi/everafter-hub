import { useState } from 'react';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, QrCode, Users, Calendar, MessageCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok || !result.user) {
      setError(result.error || 'Invalid credentials');
      return;
    }

    const role = result.user.role || (email.toLowerCase() === 'admin@everafter.com' ? 'admin' : 'user');
    
    // Auto route based on role
    router.push({ pathname: '/admin', query: { role } });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'url(/login-bg.png) center/cover no-repeat fixed', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Left Column (Branding & Features) */}
      <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', display: 'none', '@media (min-width: 1024px)': { display: 'flex' } }} className="hidden lg:flex flex-col justify-center items-center p-10 flex-[1.2]">
        
        {/* Logo Graphic */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '80px', color: '#be123c', lineHeight: 1, letterSpacing: '-5px', fontWeight: 600 }}>EH</div>
          <div style={{ position: 'absolute', top: '10px', right: '-15px', color: '#d97706' }}>✦</div>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', color: '#be123c', marginBottom: '12px', fontWeight: 600 }}>EverAfter Hub</h1>
        
        {/* Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ height: '1px', width: '40px', background: '#d97706' }}></div>
          <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: '#d97706', fontSize: '18px', fontWeight: 500 }}>Every moment, beautifully connected</p>
          <div style={{ height: '1px', width: '40px', background: '#d97706' }}></div>
        </div>

        {/* Description */}
        <p style={{ color: '#4b5563', fontSize: '16px', textAlign: 'center', maxWidth: '380px', lineHeight: 1.6, marginBottom: '60px' }}>
          The all-in-one platform to create unforgettable digital experiences for your special events.
        </p>

        {/* Feature Icons Row */}
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center' }}>
          {[
            { icon: <QrCode size={24} strokeWidth={2.5} color="#be123c" />, label: 'QR Management' },
            { icon: <Users size={24} strokeWidth={2.5} color="#be123c" />, label: 'Guest Management' },
            { icon: <Calendar size={24} strokeWidth={2.5} color="#be123c" />, label: 'Event Timeline' },
            { icon: <MessageCircle size={24} strokeWidth={2.5} color="#be123c" />, label: 'Messages & More' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '56px', height: '56px', background: '#ffe4e6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600, textAlign: 'center', maxWidth: '80px', lineHeight: 1.3 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (Login Form) */}
      <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <ShieldCheck size={24} color="#e11d48" strokeWidth={2.5} />
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#1f2937', marginBottom: '8px', fontWeight: 600 }}>Welcome Back</h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Sign in to your EverAfter Hub account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Email Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter your email" 
                  style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} 
                  required 
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  style={{ width: '100%', padding: '14px 40px 14px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
                <input type="checkbox" style={{ accentColor: '#e11d48', width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }} defaultChecked />
                Remember me
              </label>
              <a href="#" style={{ color: '#e11d48', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', background: '#fef2f2', padding: '10px', borderRadius: '8px', fontWeight: 500 }}>{error}</p>}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ width: '100%', background: '#e11d48', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '15px', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s', marginTop: '8px' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          </div>

          {/* SSO Buttons */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '14px', transition: 'background-color 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '14px', transition: 'background-color 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
              </svg>
              Microsoft
            </button>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#6b7280' }}>
            Don't have an account? <a href="#" style={{ color: '#e11d48', fontWeight: 600, textDecoration: 'none' }}>Sign up</a>
          </p>
        </div>
      </div>
      
      {/* Mobile background layout styles (if left side hides, right side still needs background) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .lg\\:flex { display: none !important; }
        }
      `}} />
    </div>
  );
}
