'use client';

import { useEffect, useCallback } from 'react';
import type { Company } from '@/lib/db';
import TombolaContent from './TombolaContent';

export default function TombolaModal({ company, onClose }: {
  company: Company;
  onClose: () => void;
}) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.75)',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '22rem', margin: 'auto' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '-0.75rem', right: '-0.75rem', zIndex: 10,
            width: '2rem', height: '2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            fontSize: '1.25rem', fontWeight: 700, lineHeight: 1,
            color: '#333',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          ×
        </button>
        <TombolaContent company={company} onClose={onClose} />
      </div>
    </div>
  );
}
