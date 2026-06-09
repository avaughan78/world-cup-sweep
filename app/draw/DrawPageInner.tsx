'use client';

import { useState, useEffect, useRef } from 'react';
import type { Company } from '@/lib/db';
import { getFlag } from '@/lib/flags';
import { GROUPS_2026 } from '@/lib/groups';

// ─── Canvas config ─────────────────────────────────────────────────────────────
const W  = 300;
const H  = 300;
const CX = W / 2;
const CY = H / 2 + 6;
const DR = 118;   // drum radius
const BR = 15;    // ball radius
const N  = 18;    // number of balls

const BALL_COLORS = [
  '#f5d78e','#a8d8a8','#a8c8e8','#f5a8c0',
  '#d4a8e8','#f5f092','#a8e0d8','#f5c8a8',
  '#c8e0a8','#e8c8a8','#a8d0f0','#f0b0c0',
  '#b0d8b0','#e8d0a0','#b8c8f0','#f0d0b8',
];

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

interface Ball { x:number; y:number; vx:number; vy:number; team:string; col:string; }
interface ExitBall { x:number; y:number; vx:number; vy:number; team:string; col:string; opacity:number; r:number; }
interface Spark  { x:number; y:number; vx:number; vy:number; opacity:number; col:string; r:number; }

// ─── Canvas tombola ─────────────────────────────────────────────────────────────

function TombolaDrum({ spinning, drawnTeam, onDone }: {
  spinning:   boolean;
  drawnTeam:  string | null;
  onDone:     () => void;
}) {
  const cvs      = useRef<HTMLCanvasElement>(null);
  const balls    = useRef<Ball[]>([]);
  const exitBall = useRef<ExitBall | null>(null);
  const sparks   = useRef<Spark[]>([]);
  const raf      = useRef(0);
  const drum     = useRef(0);
  const frame    = useRef(0);
  const launched = useRef(false);
  const sparkSrc = useRef(false);

  // Keep latest prop values accessible from the animation loop without stale closures
  const spinR   = useRef(spinning);
  const drawnR  = useRef(drawnTeam);
  const doneR   = useRef(onDone);
  useEffect(() => { spinR.current  = spinning;  }, [spinning]);
  useEffect(() => { doneR.current  = onDone;    }, [onDone]);

  // Launch exit ball when drawnTeam arrives, or reset when cleared
  useEffect(() => {
    drawnR.current = drawnTeam;
    if (!drawnTeam) { launched.current = false; sparkSrc.current = false; return; }
    if (launched.current) return;
    launched.current = true;
    sparkSrc.current = false;

    // Pick the ball nearest the top of the drum
    const src = [...balls.current].sort((a, b) => a.y - b.y)[0] ?? balls.current[0];
    if (!src) return;
    src.team = drawnTeam;
    exitBall.current = { x: src.x, y: src.y, vx: (Math.random() - 0.5) * 1.5, vy: -17, team: drawnTeam, col: src.col, opacity: 1, r: BR };
    balls.current = balls.current.filter(b => b !== src);
  }, [drawnTeam]);

  // One-time setup: init balls + start animation loop
  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const teams = [...ALL_TEAMS].sort(() => Math.random() - 0.5).slice(0, N);
    balls.current = teams.map((team, i) => {
      const a = (i / N) * Math.PI * 2;
      const r = DR * (0.25 + 0.45 * Math.random());
      return {
        x: CX + Math.cos(a) * r,
        y: CY + Math.sin(a) * r,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        team,
        col: BALL_COLORS[i % BALL_COLORS.length],
      };
    });

    function update() {
      frame.current++;
      const sp = spinR.current;
      const g  = sp ? 0.32 : 0.10;
      const dm = sp ? 0.995 : 0.992;

      for (const b of balls.current) {
        b.vx *= dm; b.vy *= dm;
        b.vy += g;
        if (sp && frame.current % 10 === 0) {
          b.vx += (Math.random() - 0.5) * 2.5;
          b.vy += (Math.random() - 0.5) * 2.5;
        }
        b.x += b.vx; b.y += b.vy;

        const dx = b.x - CX, dy = b.y - CY, d = Math.hypot(dx, dy);
        const max = DR - BR;
        if (d > max) {
          const nx = dx / d, ny = dy / d;
          b.x = CX + nx * max; b.y = CY + ny * max;
          const dot = b.vx * nx + b.vy * ny;
          b.vx -= 2 * dot * nx * 0.65;
          b.vy -= 2 * dot * ny * 0.65;
        }
      }

      if (exitBall.current) {
        const e = exitBall.current;
        e.vx *= 0.97; e.vy *= 0.97;
        e.x += e.vx; e.y += e.vy;
        e.r   = Math.min(e.r + 0.55, BR * 2.6);
        e.opacity -= 0.014;

        // Burst of sparkles when ball first clears the drum
        if (!sparkSrc.current && e.y < CY - DR + BR) {
          sparkSrc.current = true;
          const cols = ['#ffcc00', '#ff8800', '#ffffff', '#ff4488'];
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            const sp2 = 2.5 + Math.random() * 3;
            sparks.current.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp2, vy: Math.sin(a) * sp2, opacity: 1, col: cols[k % cols.length], r: 2 + Math.random() * 2 });
          }
        }

        if (e.opacity <= 0) { exitBall.current = null; doneR.current(); }
      }

      sparks.current = sparks.current.filter(s => {
        s.x += s.vx; s.y += s.vy;
        s.vy += 0.12; s.vx *= 0.96; s.vy *= 0.96;
        s.opacity -= 0.04;
        return s.opacity > 0;
      });

      drum.current += sp ? 0.018 : 0.005;
    }

    function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, team: string, col: string, r: number) {
      ctx.save();
      ctx.translate(x, y);

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur  = 6;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur  = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Crease lines (folded paper texture)
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-r * 0.68, -r * 0.08);
      ctx.quadraticCurveTo(r * 0.05, r * 0.25, r * 0.62, r * 0.02);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(r * 0.08, -r * 0.68);
      ctx.quadraticCurveTo(-r * 0.22, r * 0.04, r * 0.06, r * 0.65);
      ctx.stroke();
      ctx.restore();

      // Highlight (sphere sheen)
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.32, r * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.fill();

      // Flag emoji
      const flag = getFlag(team);
      if (flag && r > 9) {
        ctx.font = `${Math.floor(r * 0.88)}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(flag, 0, 1.5);
      }

      ctx.restore();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      const ang = drum.current;

      // ── Back cage bars (behind balls) ──────────────────────────────────
      ctx.save();
      ctx.translate(CX, CY);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(ang + i * Math.PI / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, DR - 3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100,60,220,0.20)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // ── Drum fill ───────────────────────────────────────────────────────
      ctx.save();
      ctx.translate(CX, CY);
      const bg = ctx.createRadialGradient(-22, -28, 12, 0, 0, DR);
      bg.addColorStop(0, '#231955');
      bg.addColorStop(1, '#0c0820');
      ctx.beginPath();
      ctx.arc(0, 0, DR, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();

      // ── Balls (clipped inside drum) ─────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, DR - 1, 0, Math.PI * 2);
      ctx.clip();
      for (const b of balls.current) drawBall(ctx, b.x, b.y, b.team, b.col, BR);
      ctx.restore();

      // ── Front cage bars (in front of balls, give depth) ─────────────────
      ctx.save();
      ctx.translate(CX, CY);
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(ang + Math.PI / 6 + i * Math.PI / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, DR - 3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(170,130,255,0.40)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      // Equator ring
      ctx.beginPath();
      ctx.ellipse(0, 0, DR - 1, 16, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(170,130,255,0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Outer rim
      ctx.beginPath();
      ctx.arc(0, 0, DR, 0, Math.PI * 2);
      ctx.strokeStyle = '#5030aa';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      // Specular shine
      ctx.beginPath();
      ctx.arc(-28, -42, 70, 0.88, 2.22);
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 20;
      ctx.stroke();
      ctx.restore();

      // ── Sparkles ────────────────────────────────────────────────────────
      for (const s of sparks.current) {
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.col;
        ctx.fill();
        ctx.restore();
      }

      // ── Exit ball (floats above drum) ───────────────────────────────────
      if (exitBall.current) {
        const e = exitBall.current;
        ctx.save();
        ctx.globalAlpha = e.opacity;
        // Radial glow
        const grd = ctx.createRadialGradient(e.x, e.y, e.r * 0.5, e.x, e.y, e.r * 2.5);
        grd.addColorStop(0, 'rgba(255,210,0,0.55)');
        grd.addColorStop(1, 'rgba(255,210,0,0)');
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        drawBall(ctx, e.x, e.y, e.team, e.col, e.r);
        ctx.restore();
      }
    }

    function tick() {
      update();
      render();
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={cvs}
      width={W}
      height={H}
      style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
    />
  );
}

// ─── Main draw page ─────────────────────────────────────────────────────────────

type Phase = 'accept' | 'drawing' | 'done';

export default function DrawPageInner({ company }: { company: Company }) {
  const [phase, setPhase]           = useState<Phase>('accept');
  const [spinning, setSpinning]     = useState(false);
  const [name, setName]             = useState('');
  const [drawnTeam, setDrawnTeam]   = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [localClaims, setLocalClaims] = useState<string[]>([]);

  const storageKey = `tombola_claims_${company.code}`;

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey);
      if (s) setLocalClaims(JSON.parse(s) as string[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  const fee = company.ticket_price != null
    ? `£${company.ticket_price % 1 === 0 ? company.ticket_price : company.ticket_price.toFixed(2)}`
    : null;

  async function handleDraw() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter your name first.'); return; }
    if (localClaims.length >= 2) { setError('You\'ve already drawn 2 teams.'); return; }

    setError('');
    setPhase('drawing');
    setSpinning(true);

    const MIN_MS = 2800;
    const t0 = Date.now();

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
      setSpinning(false);
      setPhase('accept');
      setError(result.error ?? 'Something went wrong.');
      return;
    }

    // Team is already claimed server-side. Set drawnTeam to trigger exit animation.
    setDrawnTeam(result.team_name);
  }

  function handleExitDone() {
    if (drawnTeam) {
      const updated = [...localClaims, drawnTeam];
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
      setLocalClaims(updated);
    }
    setSpinning(false);
    setPhase('done');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '0.5rem', padding: '0.75rem 1rem',
    color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', textAlign: 'center',
  };

  // ── Done state ──────────────────────────────────────────────────────────────
  if (phase === 'done' && drawnTeam) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: '22rem', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
          {/* Branded header */}
          <div className="px-6 pt-6 pb-5" style={{
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
              FIFA World Cup · 2026 · {company.name}
            </p>
            <h1 className="font-black text-4xl mt-1 tracking-tight" style={{ color: '#fff', lineHeight: 1 }}>
              Lucky Dip
            </h1>
          </div>

          {/* Result */}
          <div className="px-6 py-6 text-center" style={{ background: 'var(--card)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              You drew…
            </p>
            <span style={{ fontSize: '5rem', lineHeight: 1, display: 'block' }}>{getFlag(drawnTeam)}</span>
            <h2 className="font-black text-3xl mt-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {drawnTeam}
            </h2>
            <p className="text-base mt-2 mb-6" style={{ color: 'var(--text-muted)' }}>
              Good luck, {name.trim()}.{fee && ` Remember to pay ${fee} to the organiser.`}
            </p>
            {localClaims.length < 2 && (
              <button
                onClick={() => { setPhase('accept'); setDrawnTeam(null); setSpinning(false); setError(''); }}
                className="w-full font-bold py-3 rounded-xl mb-3 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Draw a second team
              </button>
            )}
            <a
              href={`/?code=${company.code}`}
              className="block font-bold py-3 rounded-xl text-sm"
              style={{ background: '#4D10C8', color: '#fff', textDecoration: 'none' }}
            >
              View the sweep →
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ── Accept / Drawing state ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: '22rem', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

        {/* Branded header */}
        <div className="px-6 pt-6 pb-5" style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
            FIFA World Cup · 2026 · {company.name}
          </p>
          <h1 className="font-black text-4xl mt-1 tracking-tight" style={{ color: '#fff', lineHeight: 1 }}>
            Lucky Dip
          </h1>
        </div>

        {/* Tombola drum */}
        <div style={{ background: '#0c0820', padding: '1rem 0 0.5rem' }}>
          <TombolaDrum spinning={spinning} drawnTeam={drawnTeam} onDone={handleExitDone} />
        </div>

        {/* Form area */}
        <div className="px-6 py-5 space-y-3" style={{ background: 'var(--card)' }}>

          {/* Entry fee */}
          {fee && (
            <div className="rounded-xl px-4 py-2.5 text-center"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Entry fee </span>
              <span className="font-black text-2xl ml-2" style={{ color: 'var(--text-primary)' }}>{fee}</span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pay the organiser directly</p>
            </div>
          )}

          {/* Already claimed */}
          {localClaims.length > 0 && (
            <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Already drawn: <strong style={{ color: 'var(--text-primary)' }}>{localClaims.join(', ')}</strong>
              {localClaims.length >= 2 && <span className="block text-xs mt-0.5">Maximum 2 teams per person reached.</span>}
            </div>
          )}

          {/* Name + button */}
          {phase === 'accept' && localClaims.length < 2 ? (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleDraw()}
                maxLength={50}
                autoFocus
                style={inputStyle}
              />
              {error && <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>}
              <button
                onClick={handleDraw}
                style={{ width: '100%', background: '#4D10C8', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}
              >
                {fee ? `Accept ${fee} fee & Draw →` : 'Draw my team →'}
              </button>
            </>
          ) : phase === 'drawing' ? (
            <div className="text-center py-2">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Drawing your team…</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Hold tight!</p>
            </div>
          ) : (
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              You&apos;ve reached the 2-team limit for this sweep.
            </p>
          )}

          <a href={`/?code=${company.code}`} className="block text-center text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
            ← Back to sweep
          </a>
        </div>
      </div>
    </main>
  );
}
