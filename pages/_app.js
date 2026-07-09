import "@/styles/globals.css";
import "@/styles/dashboard.css";
import { createContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const ThemeContext = createContext();

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('everafter-theme');
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('everafter-theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {mounted && (
        <button 
          onClick={toggleTheme}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            background: 'var(--surface-color)', backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-glow)', padding: '14px', borderRadius: '50%',
            color: 'var(--accent-primary)', boxShadow: '0 4px 15px var(--accent-glow)',
            cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
        </button>
      )}
      <Component {...pageProps} />
    </ThemeContext.Provider>
  );
}
