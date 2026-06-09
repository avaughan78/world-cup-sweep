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
    // Outer: scrollable backdrop. Clicking the backdrop closes.
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.75)',
      }}
      onClick={onClose}
    >
      {/* Inner: centers the card when viewport is tall enough; scrolls when not */}
      <div
        style={{
          display: 'flex', minHeight: '100%',
          alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <div
          style={{ position: 'relative', width: '100%', maxWidth: '28rem' }}
          onClick={(e) => e.stopPropagation()}
        >
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
    </div>
  );
}
