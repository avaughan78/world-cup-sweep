'use client';

import { useEffect, useState } from 'react';

type Theme = 'default' | 'dark' | 'album';

const THEMES: Theme[] = ['default', 'dark', 'album'];

const ICONS: Record<Theme, string> = {
  default: '☀️',
  dark:    '🌙',
  album:   '🎴',
};

const pillStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  fontSize: '0.8rem', fontWeight: 700,
  color: 'var(--text-muted)',
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: '99px', padding: '0.3rem 0.75rem',
  cursor: 'pointer', transition: 'opacity 0.15s',
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('default');
  const [football, setFootball] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && THEMES.includes(saved)) apply(saved);
    setFootball(localStorage.getItem('football-visible') === 'true');
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t === 'default' ? 'default' : t);
    localStorage.setItem('theme', t);
  }

  function cycle() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    apply(next);
  }

  function toggleFootball() {
    const next = !football;
    setFootball(next);
    localStorage.setItem('football-visible', String(next));
    window.dispatchEvent(new CustomEvent('football-toggle', { detail: next }));
  }

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <button
        onClick={toggleFootball}
        title={football ? 'Hide football' : 'Show football'}
        style={{ ...pillStyle, opacity: football ? 1 : 0.35 }}
      >
        ⚽
      </button>
      <button onClick={cycle} style={pillStyle}>
        <span>{ICONS[theme]}</span>
      </button>
    </div>
  );
}
