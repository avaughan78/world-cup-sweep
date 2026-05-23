'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [album, setAlbum] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'album') apply(true);
  }, []);

  function apply(on: boolean) {
    setAlbum(on);
    document.documentElement.setAttribute('data-theme', on ? 'album' : 'default');
    localStorage.setItem('theme', on ? 'album' : 'default');
  }

  return (
    <button
      onClick={() => apply(!album)}
      title={album ? 'Switch to editorial view' : 'Switch to sticker album view'}
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
      <span>{album ? '📰' : '🎴'}</span>
      <span className="hidden sm:inline">{album ? 'Editorial' : 'Sticker Album'}</span>
    </button>
  );
}
