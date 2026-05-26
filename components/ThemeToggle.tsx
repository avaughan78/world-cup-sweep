'use client';

import { useEffect, useState } from 'react';

type Theme = 'default' | 'dark' | 'album';

const THEMES: Theme[] = ['default', 'dark', 'album'];

const ICONS: Record<Theme, string> = {
  default: '☀️',
  dark:    '🌙',
  album:   '🎴',
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && THEMES.includes(saved)) apply(saved);
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

  return (
    <button
      onClick={cycle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '99px',
        padding: '0.3rem 0.75rem',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
    >
      <span>{ICONS[theme]}</span>
    </button>
  );
}
