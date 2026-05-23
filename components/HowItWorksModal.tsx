'use client';

import { useState } from 'react';

const STEPS = [
  {
    icon: '🖨️',
    title: 'Print the tickets',
    body: 'The organiser prints the team ticket sheet. Each ticket has a team name and a unique QR code.',
  },
  {
    icon: '🎩',
    title: 'Draw from a hat',
    body: 'Tickets are folded up and everyone draws one at random. That\'s your team for the tournament.',
  },
  {
    icon: '📱',
    title: 'Claim your team',
    body: 'Scan the QR code on your ticket to register your name, or give your name to the organiser and they\'ll add it for you.',
  },
  {
    icon: '📊',
    title: 'Live stats',
    body: 'This page updates automatically as the tournament progresses — standings, cards, scorers, and novelty prize leaders are all tracked in real time.',
  },
];

export default function HowItWorksModal({ claimed = 0, total = 0 }: { claimed?: number; total?: number }) {
  const [open, setOpen] = useState(false);
  const allClaimed = total > 0 && claimed === total;

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
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Branded header */}
            <div
              className="px-6 pt-6 pb-5"
              style={{
                background: 'linear-gradient(135deg, #4D10C8 0%, #D40100 100%)',
                backgroundSize: 'auto 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
              }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                ✕
              </button>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                FIFA World Cup 2026
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: '#fff' }}>
                How it works
              </h2>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-5">
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div
                    className="flex items-center justify-center rounded-xl text-lg flex-shrink-0"
                    style={{ width: '2.5rem', height: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Money disclaimer */}
            <hr style={{ borderColor: 'var(--border)' }} />
            <div className="px-6 py-4 flex gap-3 items-center">
              <span className="text-lg flex-shrink-0">💰</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Collecting money isn&apos;t handled by this site — that&apos;s between you and your organiser.
              </p>
            </div>

            {/* Names hidden notice */}
            {!allClaimed && total > 0 && (
              <>
                <hr style={{ borderColor: 'var(--border)' }} />
                <div className="px-6 py-4 flex gap-3 items-center">
                  <span className="text-lg flex-shrink-0">🔒</span>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Names are hidden until everyone has claimed their team.{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{claimed} of {total}</strong> claimed so far.
                  </p>
                </div>
              </>
            )}

            <div style={{ paddingBottom: '0.5rem' }} />
          </div>
        </div>
      )}
    </>
  );
}
