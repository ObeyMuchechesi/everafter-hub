import Spinner from './Spinner';

export default function FullPageLoader({ text = 'Loading...' }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'rgba(253, 242, 248, 0.9)', 
      position: 'fixed', 
      inset: 0, 
      zIndex: 9999,
      backdropFilter: 'blur(5px)'
    }}>
      <Spinner size="48px" color="#f43f5e" />
      <p style={{ marginTop: '20px', color: '#4b5563', fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 600 }}>{text}</p>
    </div>
  );
}
