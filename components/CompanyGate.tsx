'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const HOW_IT_WORKS = [
  {
    icon: '🖨️',
    title: 'Print tickets',
    body: 'Your organiser generates QR-coded tickets — one for each of the 48 teams — and prints them out.',
  },
  {
    icon: '🎲',
    title: 'The draw',
    body: 'Tickets are folded and then drawn from the hat. The organiser collects the entry fee.',
  },
  {
    icon: '📱',
    title: 'Claim your team',
    body: 'Scan the QR code on your ticket to put your name against your nation. Works on any phone, no app needed.',
  },
  {
    icon: '🏆',
    title: 'Follow & win',
    body: 'Track your team from the group stage to the final. Prizes for the winner, runner-up, and novelty awards along the way.',
  },
];

const STAT_ITEMS = [
  { num: '48', label: 'Nations' },
  { num: '12', label: 'Groups' },
  { num: '104', label: 'Matches' },
  { num: '3', label: 'Host Countries' },
];

export default function CompanyGate({
  invalidCode = false,
  redirectPath = '/',
  marketing = false,
  logout = false,
}: {
  invalidCode?: boolean;
  redirectPath?: string;
  marketing?: boolean;
  logout?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (logout) {
      localStorage.removeItem('company_code');
      setChecking(false);
      return;
    }
    if (invalidCode) {
      localStorage.removeItem('company_code');
      setError('Company code not recognised');
      setChecking(false);
      return;
    }
    const stored = localStorage.getItem('company_code');
    if (stored) {
      router.replace(`${redirectPath}?code=${stored}`);
    } else {
      setChecking(false);
    }
  }, [router, invalidCode, redirectPath, logout]);

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        localStorage.setItem('company_code', trimmed);
        router.replace(`${redirectPath}?code=${trimmed}`);
      } else {
        setError('Company code not recognised');
      }
    } catch {
      setError('Could not connect');
    }
    setLoading(false);
  }

  if (checking) return null;

  const formCard = (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}
    >
      <div
        className="px-7 pt-6 pb-5"
        style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
          FIFA World Cup · 2026
        </p>
        <h2 className="album-title text-4xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
          The Draw
        </h2>
        <p className="text-sm mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Office Sweepstake
        </p>
      </div>

      <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Enter your company code to view the draw.
        </p>
        <input
          type="text"
          placeholder="e.g. ACME26"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus={!marketing}
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.12em',
            fontWeight: 700,
          }}
        />
        {error && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full font-bold py-3 rounded-xl mt-3 transition-opacity"
          style={{ background: '#4D10C8', color: '#fff', opacity: loading ? 0.6 : 1, fontSize: '1rem' }}
        >
          {loading ? 'Checking…' : 'View the Draw →'}
        </button>
        {!marketing && (
          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            No code yet?{' '}
            <a href="/setup" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
              Set up your own draw
            </a>
          </p>
        )}
      </div>
    </div>
  );

  // Simple gate used on /manage
  if (!marketing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm">{formCard}</div>
      </main>
    );
  }

  // Full marketing landing page
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Hero */}
      <div
        style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(105deg, rgba(15,0,80,0.88) 0%, rgba(15,0,60,0.65) 55%, rgba(0,0,0,0.25) 100%)',
          }}
        >
          <div className="max-w-5xl mx-auto px-6 py-12 sm:py-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">

              {/* Left: title + tagline */}
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  FIFA World Cup · USA · Canada · Mexico · 2026
                </p>
                <h1
                  className="album-title font-black tracking-tight"
                  style={{ color: '#fff', fontSize: 'clamp(3.5rem, 8vw, 5.5rem)', lineHeight: 0.9 }}
                >
                  The Draw
                </h1>
                <p className="text-lg sm:text-xl font-bold mt-5 mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  The office sweepstake, done right.
                </p>
                <p
                  className="text-sm leading-relaxed mb-7 max-w-sm"
                  style={{ color: 'rgba(255,255,255,0.58)' }}
                >
                  48 teams. QR codes, live stats, and automatic prize tracking — from the group stage to the final on 19 July 2026.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: '999px',
                    padding: '0.4rem 1rem',
                    color: 'rgba(255,255,255,0.78)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full font-black"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      width: '1rem',
                      height: '1rem',
                      fontSize: '0.6rem',
                      flexShrink: 0,
                    }}
                  >
                    ?
                  </span>
                  How it works
                </button>
              </div>

              {/* Right: stacked cards */}
              <div className="space-y-4">
                {formCard}
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <p className="font-black text-base mb-1" style={{ color: '#fff' }}>
                    Running your own sweepstake?
                  </p>
                  <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Set up The Draw for your office or group in under two minutes. Free, no account needed.
                  </p>
                  <a
                    href="/setup"
                    className="inline-block font-bold px-6 py-2.5 rounded-xl transition-opacity hover:opacity-90"
                    style={{ background: '#fff', color: '#4D10C8', fontSize: '0.95rem' }}
                  >
                    Set up your draw →
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#4D10C8' }}>
        <div className="max-w-2xl mx-auto px-4 grid grid-cols-4">
          {STAT_ITEMS.map((s, i) => (
            <div
              key={s.label}
              className="py-4 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.15)' : undefined }}
            >
              <p className="text-2xl sm:text-3xl font-black" style={{ color: '#fff' }}>{s.num}</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,6,0.82)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm"
              style={{
                background: 'rgba(0,0,0,0.12)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              ✕
            </button>

            <div
              className="px-6 pt-6 pb-5"
              style={{
                backgroundImage: 'url(/wc2026-header-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                FIFA World Cup 2026
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: '#fff' }}>
                How it works
              </h2>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HOW_IT_WORKS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="font-black flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        background: '#4D10C8',
                        color: '#fff',
                        width: '1.1rem',
                        height: '1.1rem',
                        fontSize: '0.6rem',
                      }}
                    >
                      {i + 1}
                    </span>
                    <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
