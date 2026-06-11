'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Company } from '@/lib/db';
import { getFlag } from '@/lib/flags';
import TombolaGlobe from './TombolaGlobe';

type Phase = 'fee' | 'accept' | 'drawing' | 'done';

// Number of balls in the drum fetched once on mount, then decremented as teams are drawn
function useUnclaimedCount(code: string) {
  const [unclaimed, setUnclaimed] = useState<number | null>(null);
  useEffect(() => {
    fetch(`/api/tombola/count?code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then((d: { unclaimed?: number }) => { if (typeof d.unclaimed === 'number') setUnclaimed(d.unclaimed); })
      .catch(() => {});
  }, [code]);
  return [unclaimed, setUnclaimed] as const;
}

function feeLabel(price: number | null | undefined): string | null {
  if (price == null) return null;
  return `£${price % 1 === 0 ? price : price.toFixed(2)}`;
}

export default function TombolaContent({ company, onClose }: {
  company: Company;
  onClose?: () => void;
}) {
  const fee = feeLabel(company.ticket_price);

  const [phase, setPhase]             = useState<Phase>(fee ? 'fee' : 'accept');
  const [spinning, setSpinning]       = useState(false);
  const [name, setName]               = useState('');
  const [drawnTeam, setDrawnTeam]     = useState<string | null>(null);
  const [error, setError]             = useState('');
  const [localClaims, setLocalClaims] = useState<string[]>([]);
  const [drawCount, setDrawCount]     = useState(0);
  const [unclaimed, setUnclaimed]     = useUnclaimedCount(company.code);

  const storageKey = `tombola_claims_${company.code}`;

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey);
      if (s) setLocalClaims(JSON.parse(s) as string[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  async function handleDraw() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name first.'); return; }
    if (localClaims.length >= 2) { setError("You've already drawn 2 teams."); return; }

    setError(''); setPhase('drawing'); setSpinning(true);

    const MIN_MS = 8000, t0 = Date.now();
    let result: { ok?: boolean; team_name?: string; error?: string } = {};
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

    const wait = MIN_MS - (Date.now() - t0);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));

    if (result.error || !result.team_name) {
      setSpinning(false); setPhase('accept');
      setError(result.error ?? 'Something went wrong.');
      return;
    }

    setDrawnTeam(result.team_name);
  }

  function handleExitDone() {
    if (drawnTeam) {
      const updated = [...localClaims, drawnTeam];
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
      setLocalClaims(updated);
      setUnclaimed(u => u !== null ? Math.max(0, u - 1) : null);
      setDrawCount(c => c + 1);
    }
    setSpinning(false);
    setPhase('done');
  }

  const backLink = onClose ? (
    <button
      onClick={onClose}
      className="block text-center text-xs pt-1 w-full"
      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      ← Back to sweep
    </button>
  ) : (
    <a href={`/?code=${company.code}`} className="block text-center text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
      ← Back to sweep
    </a>
  );

  const viewSweepButton = onClose ? (
    <button
      onClick={onClose}
      className="block w-full font-bold py-3 rounded-xl text-sm"
      style={{ background: '#4D10C8', color: '#fff', border: 'none', cursor: 'pointer' }}
    >
      View the sweep →
    </button>
  ) : (
    <a href={`/?code=${company.code}`} className="block font-bold py-3 rounded-xl text-sm"
      style={{ background: '#4D10C8', color: '#fff', textDecoration: 'none' }}>
      View the sweep →
    </a>
  );

  const header = (
    <div className="px-6 pt-6 pb-5" style={{ backgroundImage: 'url(/wc2026-header-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
        FIFA World Cup · 2026 · {company.name}
      </p>
      <h1 className="font-black text-4xl mt-1 tracking-tight" style={{ color: '#fff', lineHeight: 1 }}>Lucky Dip</h1>
    </div>
  );

  const isCuracao = drawnTeam === 'Curaçao';

  // ── Done state ────────────────────────────────────────────────────────────────
  if (phase === 'done' && drawnTeam) {
    const sparkles: { top: string; left: string; size: string; ch: string; delay: string }[] = [
      { top: '8%',  left: '5%',  size: '1.1rem', ch: '✦', delay: '0s'    },
      { top: '10%', left: '88%', size: '0.8rem', ch: '★', delay: '0.35s' },
      { top: '48%', left: '3%',  size: '0.9rem', ch: '✸', delay: '0.65s' },
      { top: '82%', left: '8%',  size: '0.7rem', ch: '✦', delay: '0.95s' },
      { top: '88%', left: '82%', size: '1.0rem', ch: '★', delay: '0.45s' },
      { top: '55%', left: '93%', size: '0.75rem',ch: '✸', delay: '0.75s' },
      { top: '28%', left: '14%', size: '1.2rem', ch: '✦', delay: '1.1s'  },
      { top: '22%', left: '84%', size: '0.9rem', ch: '★', delay: '0.2s'  },
    ];

    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        {header}
        <div className="px-6 py-6 text-center" style={{ background: 'var(--card)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>You drew…</p>
          <span style={{ fontSize: '5rem', lineHeight: 1, display: 'block' }}>{getFlag(drawnTeam)}</span>
          <h2 className="font-black text-3xl mt-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>{drawnTeam}</h2>

          {isCuracao && (
            <div style={{
              position: 'relative',
              margin: '1.25rem 0 0.5rem',
              padding: '1.25rem 1rem 1rem',
              borderRadius: '1rem',
              background: 'linear-gradient(160deg, #fffdf0 0%, #fff8d6 55%, #fffaeb 100%)',
              border: '1.5px solid rgba(212,160,10,0.45)',
              animation: 'curacao-glow-pulse 2.4s ease-in-out infinite, curacao-entrance 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
              overflow: 'hidden',
            }}>
              {sparkles.map((s, i) => (
                <span key={i} style={{
                  position: 'absolute',
                  top: s.top, left: s.left,
                  fontSize: s.size,
                  color: '#c9860a',
                  animation: `curacao-star-twinkle 1.4s ease-in-out infinite`,
                  animationDelay: s.delay,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  lineHeight: 1,
                }}>{s.ch}</span>
              ))}
              <p style={{
                fontSize: '0.6rem',
                fontWeight: 900,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                margin: '0 0 0.75rem',
                animation: 'curacao-text-shimmer 2.2s ease-in-out infinite',
                position: 'relative',
                zIndex: 1,
              }}>⭐ Star Prize ⭐</p>
              <Image
                src="/blue_curacao.webp"
                alt="Star Prize: Blue Curaçao"
                unoptimized
                width={46}
                height={130}
                style={{
                  height: '130px',
                  width: 'auto',
                  animation: 'curacao-bottle-float 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 6px 16px rgba(0,43,127,0.25)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              <p style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#9a6308',
                margin: '0.6rem 0 0',
                letterSpacing: '0.04em',
                position: 'relative',
                zIndex: 1,
              }}>De Kuyper Blue Curaçao</p>
            </div>
          )}

          <p className="text-base mt-2 mb-6" style={{ color: 'var(--text-muted)' }}>
            Good luck, {name.trim()}.{fee && ` Remember to pay ${fee} to the organiser.`}
          </p>
          {localClaims.length < 2 && (
            <button
              onClick={() => { setPhase(fee ? 'fee' : 'accept'); setDrawnTeam(null); setSpinning(false); setError(''); }}
              className="w-full font-bold py-3 rounded-xl mb-3 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Draw a second team
            </button>
          )}
          {viewSweepButton}
        </div>
      </div>
    );
  }

  // ── Fee acceptance state ──────────────────────────────────────────────────────
  if (phase === 'fee' && fee) {
    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        {header}
        <div className="px-6 py-6 space-y-4" style={{ background: 'var(--card)' }}>
          <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Entry fee</p>
            <span className="font-black text-4xl" style={{ color: 'var(--text-primary)' }}>{fee}</span>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pay the organiser directly</p>
          </div>
          <button
            onClick={() => setPhase('accept')}
            style={{ width: '100%', background: '#4D10C8', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}
          >
            Accept {fee}{' '}fee &amp; continue →
          </button>
          {backLink}
        </div>
      </div>
    );
  }

  // ── Accept / Drawing state ────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

      {header}

      {/* Globe animation */}
      <div style={{ background: '#080518', paddingTop: '0.5rem', paddingBottom: '0.5rem', overflow: 'hidden' }}>
        <TombolaGlobe
          key={drawCount}
          spinning={spinning}
          drawnTeam={drawnTeam}
          onDone={handleExitDone}
          nSlips={unclaimed ?? undefined}
        />
      </div>

      {/* Form */}
      <div className="px-6 py-5 space-y-3" style={{ background: 'var(--card)' }}>
        {localClaims.length > 0 && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Already drawn: <strong style={{ color: 'var(--text-primary)' }}>{localClaims.join(', ')}</strong>
            {localClaims.length >= 2 && <span className="block text-xs mt-0.5">Maximum 2 teams per person reached.</span>}
          </div>
        )}

        {phase === 'accept' && localClaims.length < 2 ? (
          <>
            <input
              type="text" placeholder="Your name"
              value={name} onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleDraw()}
              maxLength={50} autoFocus
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', textAlign: 'center' }}
            />
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)', marginTop: '-4px' }}>
              Use a unique name if there&apos;s more than one {name.trim() || 'person'} in the sweep
            </p>
            {error && <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>}
            <button onClick={handleDraw}
              style={{ width: '100%', background: '#4D10C8', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>
              Draw my team →
            </button>
          </>
        ) : phase === 'drawing' ? (
          <div className="text-center py-2">
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Drawing your ticket…</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Hold tight!</p>
          </div>
        ) : (
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>You&apos;ve reached the 2-team limit.</p>
        )}

        {backLink}
      </div>
    </div>
  );
}
