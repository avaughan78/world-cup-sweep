'use client';

import { useState, useEffect } from 'react';
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
  const [showStarPrize, setShowStarPrize] = useState(true);

  const storageKey = `tombola_claims_${company.code}`;

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey);
      if (s) setLocalClaims(JSON.parse(s) as string[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => { setShowStarPrize(true); }, [drawnTeam]);

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
    return (
      <div style={{ position: 'relative' }}>
        <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
          {header}
          <div className="px-6 py-6 text-center" style={{ background: 'var(--card)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>You drew…</p>
            <span style={{ fontSize: '5rem', lineHeight: 1, display: 'block' }}>{getFlag(drawnTeam)}</span>
            <h2 className="font-black text-3xl mt-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>{drawnTeam}</h2>
            {isCuracao && (
              <p className="text-sm font-bold mt-2" style={{ color: '#b36a00' }}>
                Congratulations! You won a bottle of Blue Curaçao for drawing the ultimate underdogs!
              </p>
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

        {/* Curaçao starburst badge — top-right of card, closable */}
        {isCuracao && showStarPrize && (
          <div style={{
            position: 'absolute',
            right: -10,
            top: 14,
            width: 150,
            height: 150,
            zIndex: 20,
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              animation: 'curacao-entrance 0.8s cubic-bezier(0.34,1.56,0.64,1) both 0.4s, curacao-badge-wobble 5s ease-in-out 1.2s infinite',
              transformOrigin: 'center center',
            }}>
              {/* Gold starburst — near-white centre so multiply blend makes bottle bg transparent */}
              <div
                className="curacao-starburst-bg"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 50% 50%, #fffde7 0%, #fef9c3 38%, #fcd34d 65%, #f59e0b 82%, #d97706 100%)',
                  animation: 'curacao-starburst-glow 2.4s ease-in-out 1.2s infinite',
                }}
              />
              {/* Content */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                zIndex: 2,
              }}>
                <p style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', color: '#92400e', textTransform: 'uppercase', margin: 0, lineHeight: 1 }}>
                  ⭐ Star Prize ⭐
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/blue_curacao.webp"
                  alt="Blue Curaçao"
                  loading="eager"
                  style={{
                    height: '72px',
                    width: 'auto',
                    mixBlendMode: 'multiply',
                    animation: 'curacao-bottle-float 3s ease-in-out infinite',
                  }}
                />
                <p style={{ fontSize: '6.5px', fontWeight: 700, color: '#92400e', margin: 0, lineHeight: 1.3, textAlign: 'center' }}>
                  De Kuyper<br/>Blue Curaçao
                </p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setShowStarPrize(false)}
                aria-label="Dismiss star prize"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(146,64,14,0.2)',
                  color: '#92400e',
                  border: '1px solid rgba(146,64,14,0.5)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  zIndex: 10,
                  lineHeight: 1,
                }}
              >×</button>
            </div>
          </div>
        )}
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
