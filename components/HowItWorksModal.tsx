'use client';

import { useState } from 'react';

export default function HowItWorksModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="How it works"
        className="flex items-center justify-center rounded-full font-black text-sm transition-opacity hover:opacity-80"
        style={{
          width: '1.75rem',
          height: '1.75rem',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          flexShrink: 0,
        }}
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,6,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm"
              style={{ background: 'rgba(0,0,0,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ✕
            </button>

            <div className="px-6 pt-6 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                Office Sweepstake
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                How it works
              </h2>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            <div className="px-6 py-5 space-y-4" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              <div className="flex gap-3">
                <span className="text-xl" style={{ flexShrink: 0 }}>🎟️</span>
                <p><strong style={{ color: 'var(--text-primary)' }}>You've been drawn a team</strong> — one of the 48 competing nations in the 2026 FIFA World Cup. Check below to find your name and team.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl" style={{ flexShrink: 0 }}>🏆</span>
                <p><strong style={{ color: 'var(--text-primary)' }}>Win the big prizes</strong> — if your team wins the tournament you take 1st place prize money, runner-up takes 2nd.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl" style={{ flexShrink: 0 }}>🎲</span>
                <p><strong style={{ color: 'var(--text-primary)' }}>Novelty prizes</strong> — there are bonus prizes for things like the most cards, the first team out, and the longest-range goal of the tournament.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl" style={{ flexShrink: 0 }}>📊</span>
                <p><strong style={{ color: 'var(--text-primary)' }}>Live standings</strong> — the draw updates automatically as the tournament progresses. Eliminated teams are crossed out.</p>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            <div className="px-6 py-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full font-bold py-2.5 rounded-xl"
                style={{ background: 'var(--green)', color: '#fff', fontSize: '0.95rem' }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
