'use client';

import { useState, useEffect, useRef } from 'react';
import type { Company } from '@/lib/db';
import { getFlag } from '@/lib/flags';
import { GROUPS_2026 } from '@/lib/groups';

type Step = 'accept' | 'drawing' | 'reveal' | 'done';

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

function SlotMachine({ drawnTeam }: { drawnTeam: string | null }) {
  const [display, setDisplay] = useState(ALL_TEAMS[0]);
  const [settled, setSettled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSettled(false);
    if (!drawnTeam) {
      // Spin freely while waiting for API
      let i = 0;
      const spin = () => {
        setDisplay(ALL_TEAMS[Math.floor(Math.random() * ALL_TEAMS.length)]);
        i++;
        timerRef.current = setTimeout(spin, 80 + (i % 3) * 10);
      };
      timerRef.current = setTimeout(spin, 80);
    } else {
      // Decelerate and land on the real team
      let speed = 80;
      let ticks = 0;
      const MAX_TICKS = 18;
      const decelerate = () => {
        ticks++;
        if (ticks >= MAX_TICKS) {
          setDisplay(drawnTeam);
          setSettled(true);
          return;
        }
        setDisplay(ALL_TEAMS[Math.floor(Math.random() * ALL_TEAMS.length)]);
        speed = Math.min(speed + ticks * 14, 400);
        timerRef.current = setTimeout(decelerate, speed);
      };
      timerRef.current = setTimeout(decelerate, speed);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [drawnTeam]);

  const flag = settled && drawnTeam ? getFlag(drawnTeam) : '🎫';

  return (
    <div className="text-center" style={{ minHeight: '10rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes tombola-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          65%  { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tombola-spin {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        .slot-settled { animation: tombola-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .slot-spinning { animation: tombola-spin 0.4s linear infinite; display: inline-block; }
      `}</style>
      <span
        className={settled ? 'slot-settled' : 'slot-spinning'}
        style={{ fontSize: '5rem', lineHeight: 1, display: 'inline-block' }}
      >
        {flag}
      </span>
      <p className="mt-3 font-black text-xl" style={{ color: 'var(--text-primary)', minHeight: '1.75rem', letterSpacing: '-0.01em' }}>
        {settled && drawnTeam ? drawnTeam : <span style={{ opacity: 0.35 }}>{'· · ·'}</span>}
      </p>
    </div>
  );
}

export default function DrawPageInner({ company }: { company: Company }) {
  const [step, setStep] = useState<Step>('accept');
  const [name, setName] = useState('');
  const [drawnTeam, setDrawnTeam] = useState<string | null>(null);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const storageKey = `tombola_claims_${company.code}`;
  const [localClaims, setLocalClaims] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setLocalClaims(JSON.parse(stored) as string[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  const fee = company.ticket_price != null
    ? `£${company.ticket_price % 1 === 0 ? company.ticket_price : company.ticket_price.toFixed(2)}`
    : null;

  async function handleDraw() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name first.'); return; }
    if (localClaims.length >= 2) { setError('You have already drawn 2 teams for this sweep.'); return; }

    setError('');
    setDrawnTeam(null);
    setStep('drawing');

    const MIN_ANIM_MS = 2800;
    const start = Date.now();

    let result: { ok?: boolean; team_name?: string; claim_token?: string; error?: string } = {};
    try {
      const res = await fetch('/api/tombola/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: company.code, name: trimmed }),
      });
      result = await res.json() as typeof result;
    } catch {
      result = { error: 'Could not connect — please try again.' };
    }

    const elapsed = Date.now() - start;
    if (elapsed < MIN_ANIM_MS) await new Promise(r => setTimeout(r, MIN_ANIM_MS - elapsed));

    if (result.error || !result.team_name || !result.claim_token) {
      setStep('accept');
      setError(result.error ?? 'Something went wrong.');
      return;
    }

    setDrawnTeam(result.team_name);
    setClaimToken(result.claim_token);
    // Small extra pause so the deceleration animation has time to settle
    await new Promise(r => setTimeout(r, 1800));
    setStep('reveal');
  }

  async function handleClaim() {
    if (!claimToken || !drawnTeam) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: claimToken, name: name.trim() }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (d.ok) {
        const updated = [...localClaims, drawnTeam];
        try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
        setLocalClaims(updated);
        setStep('done');
      } else {
        setError(d.error ?? 'Something went wrong.');
      }
    } catch {
      setError('Could not connect.');
    }
    setLoading(false);
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: '1.25rem', padding: '2rem',
    width: '100%', maxWidth: '22rem',
    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '0.5rem', padding: '0.75rem 1rem',
    color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', textAlign: 'center',
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%', background: 'var(--green)', color: '#fff',
    fontWeight: 700, fontSize: '1rem', padding: '0.875rem',
    borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
    opacity: loading ? 0.5 : 1,
  };

  // ── Step: accept ──────────────────────────────────────────────────────────
  if (step === 'accept') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div style={cardStyle}>
          <div className="text-center mb-6">
            <span style={{ fontSize: '3rem', lineHeight: 1 }}>🎩</span>
            <h1 className="font-black text-2xl mt-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Lucky Dip
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {company.name} · FIFA World Cup 2026
            </p>
          </div>

          {fee && (
            <div className="rounded-xl px-4 py-3 mb-5 text-center"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Entry fee</p>
              <p className="font-black text-3xl" style={{ color: 'var(--text-primary)' }}>{fee}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Collected by the organiser during the competition
              </p>
            </div>
          )}

          {localClaims.length > 0 && (
            <div className="rounded-lg px-3 py-2.5 mb-4 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              You&apos;ve already drawn: <strong style={{ color: 'var(--text-primary)' }}>{localClaims.join(', ')}</strong>
              {localClaims.length >= 2 && <span className="block mt-1 text-xs">Maximum 2 teams per person reached.</span>}
            </div>
          )}

          {localClaims.length < 2 ? (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleDraw()}
                maxLength={50}
                autoFocus
                style={{ ...inputStyle, marginBottom: '0.75rem' }}
              />
              {error && <p className="text-sm mb-3 text-center" style={{ color: '#ef4444' }}>{error}</p>}
              <button onClick={handleDraw} style={primaryBtn}>
                {fee ? `Accept £${company.ticket_price} fee & Draw →` : 'Draw my team →'}
              </button>
            </>
          ) : (
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              You&apos;ve reached the 2-team limit for this sweep.
            </p>
          )}

          <a href={`/?code=${company.code}`} className="block text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            ← Back to sweep
          </a>
        </div>
      </main>
    );
  }

  // ── Step: drawing ─────────────────────────────────────────────────────────
  if (step === 'drawing') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}>
            Drawing your team…
          </p>
          <SlotMachine drawnTeam={drawnTeam} />
        </div>
      </main>
    );
  }

  // ── Step: reveal ──────────────────────────────────────────────────────────
  if (step === 'reveal' && drawnTeam) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            You drew…
          </p>
          <span style={{ fontSize: '5rem', lineHeight: 1, display: 'block' }}>{getFlag(drawnTeam)}</span>
          <h2 className="font-black text-3xl mt-3 mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {drawnTeam}
          </h2>
          {error && <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{error}</p>}
          <button onClick={handleClaim} disabled={loading} style={primaryBtn}>
            {loading ? 'Claiming…' : `Claim ${drawnTeam} →`}
          </button>
          <a href={`/?code=${company.code}`} className="block text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            ← Back to sweep
          </a>
        </div>
      </main>
    );
  }

  // ── Step: done ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <span style={{ fontSize: '5rem', lineHeight: 1, display: 'block' }}>{drawnTeam ? getFlag(drawnTeam) : '🎉'}</span>
        <h2 className="font-black text-3xl mt-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          You&apos;ve got {drawnTeam}!
        </h2>
        <p className="text-lg mt-1 mb-6" style={{ color: 'var(--text-muted)' }}>
          Good luck, {name.trim()}.{fee && ` Remember to pay ${fee} to the organiser.`}
        </p>
        {localClaims.length < 2 && (
          <button
            onClick={() => { setStep('accept'); setDrawnTeam(null); setClaimToken(null); setError(''); }}
            className="w-full font-bold py-3 rounded-xl mb-3 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Draw a second team
          </button>
        )}
        <a href={`/?code=${company.code}`}
          className="block font-bold py-3 rounded-xl text-sm"
          style={{ background: '#4D10C8', color: '#fff', textDecoration: 'none' }}>
          View the sweep →
        </a>
      </div>
    </main>
  );
}
