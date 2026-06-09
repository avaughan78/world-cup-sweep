'use client';

import { useState, useEffect, useRef } from 'react';
import type { Company } from '@/lib/db';
import { getFlag } from '@/lib/flags';
import { GROUPS_2026 } from '@/lib/groups';

const W = 300, H = 380;
const CX = 150;
const TOP_Y = 82;
const BOT_Y = 248;
const RX    = 106;
const RY    = 18;
const N_BARS = 14;
const IX1 = CX - RX + 12;
const IX2 = CX + RX - 12;
const IY1 = TOP_Y + RY + 2;
const IY2 = BOT_Y - RY - 2;
const CW = 24, CH = 15;
const N_CARDS = 14;

const CARD_COLS = [
  '#fff6a0','#b0efc8','#b0d4ff','#ffc0c0',
  '#ddc0ff','#b0f4e0','#ffe0a0','#c0eeff',
  '#ffd8c8','#c8ffdc','#eecaff','#fff4a8',
  '#c8f0c8','#ffd0b0',
];

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

interface Card {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; vrot: number;
  col: string; team: string;
}

interface DropCard {
  x: number; y: number;
  vy: number; rot: number;
  scale: number; reveal: number;
  team: string; col: string;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function TombolaDrum({ spinning, drawnTeam, onDone }: {
  spinning:  boolean;
  drawnTeam: string | null;
  onDone:    () => void;
}) {
  const cvs      = useRef<HTMLCanvasElement>(null);
  const cards    = useRef<Card[]>([]);
  const drop     = useRef<DropCard | null>(null);
  const raf      = useRef(0);
  const drumRot  = useRef(0);
  const frame    = useRef(0);
  const launched = useRef(false);

  const spinR  = useRef(spinning);
  const doneR  = useRef(onDone);
  useEffect(() => { spinR.current = spinning; }, [spinning]);
  useEffect(() => { doneR.current = onDone;   }, [onDone]);

  useEffect(() => {
    if (!drawnTeam) { launched.current = false; return; }
    if (launched.current) return;
    launched.current = true;

    const src = cards.current.reduce((best, c) =>
      Math.abs(c.x - CX) + (IY2 - c.y) * 0.5 < Math.abs(best.x - CX) + (IY2 - best.y) * 0.5 ? c : best,
      cards.current[0],
    );
    if (!src) return;

    src.team = drawnTeam;
    drop.current = { x: src.x, y: src.y, vy: 1.5, rot: src.rot, scale: 1, reveal: 0, team: drawnTeam, col: src.col };
    cards.current = cards.current.filter(c => c !== src);
  }, [drawnTeam]);

  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const teams = [...ALL_TEAMS].sort(() => Math.random() - 0.5).slice(0, N_CARDS);
    cards.current = teams.map((team, i) => ({
      x:    IX1 + (IX2 - IX1) * ((i + 0.5) / N_CARDS) + (Math.random() - 0.5) * 24,
      y:    IY1 + (IY2 - IY1) * Math.random(),
      vx:   (Math.random() - 0.5) * 3,
      vy:   (Math.random() - 0.5) * 3,
      rot:  Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.09,
      col:  CARD_COLS[i % CARD_COLS.length],
      team,
    }));

    function update() {
      frame.current++;
      const sp = spinR.current;
      const g  = sp ? 0.20 : 0.07;
      const dm = sp ? 0.994 : 0.991;

      for (const c of cards.current) {
        c.vx *= dm; c.vy *= dm; c.vrot *= 0.975;
        c.vy += g;
        if (sp && frame.current % 9 === 0) {
          c.vx += (Math.random() - 0.5) * 2.8;
          c.vy += (Math.random() - 0.5) * 2.8;
          c.vrot += (Math.random() - 0.5) * 0.12;
        }
        c.x += c.vx; c.y += c.vy; c.rot += c.vrot;

        const hw = CW / 2, hh = CH / 2;
        if (c.x - hw < IX1) { c.x = IX1 + hw; c.vx =  Math.abs(c.vx) * 0.55; c.vrot += 0.04; }
        if (c.x + hw > IX2) { c.x = IX2 - hw; c.vx = -Math.abs(c.vx) * 0.55; c.vrot -= 0.04; }
        if (c.y - hh < IY1) { c.y = IY1 + hh; c.vy =  Math.abs(c.vy) * 0.55; }
        if (c.y + hh > IY2) { c.y = IY2 - hh; c.vy = -Math.abs(c.vy) * 0.55; }
      }

      if (drop.current) {
        const d = drop.current;
        d.vy   += 0.5;
        d.y    += d.vy;
        d.x    += (CX - d.x) * 0.08;
        d.rot  += (0 - d.rot) * 0.14;
        d.scale = Math.min(d.scale + 0.045, 3.8);
        d.reveal = Math.min(d.reveal + (d.scale > 1.8 ? 0.045 : 0), 1);
        if (d.scale >= 3.8) { drop.current = null; doneR.current(); }
      }

      drumRot.current += sp ? 0.022 : 0.006;
    }

    function drawCard(
      x: number, y: number, rot: number, col: string,
      scale = 1, reveal = 0, team = '',
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(scale, scale);

      const hw = CW / 2, hh = CH / 2;

      ctx.shadowColor = 'rgba(0,0,0,0.30)';
      ctx.shadowBlur  = 4 * scale;
      ctx.shadowOffsetX = 0.8; ctx.shadowOffsetY = 1.8;

      rr(ctx, -hw, -hh, CW, CH, 2.5);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

      rr(ctx, -hw, -hh, CW, CH, 2.5);
      ctx.strokeStyle = 'rgba(0,0,0,0.13)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-hw + 2.5, 0); ctx.lineTo(hw - 2.5, 0);
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(-hw + 3, -hh + 3,  CW * 0.55, 1.3);
      ctx.fillRect(-hw + 3, -hh + 6,  CW * 0.35, 1.3);
      ctx.fillRect(-hw + 3,  hh - 7,  CW * 0.50, 1.3);
      ctx.fillRect(-hw + 3,  hh - 4,  CW * 0.30, 1.3);

      ctx.save();
      ctx.globalAlpha = 0.18;
      rr(ctx, -hw + 1, -hh + 1, CW * 0.45, CH - 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      if (reveal > 0 && team) {
        ctx.globalAlpha = reveal;
        const flag = getFlag(team);
        if (flag) {
          ctx.font = `${Math.floor(CH * 0.72)}px serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(flag, 0, 0);
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      const ang = drumRot.current;

      for (let i = 0; i < N_BARS; i++) {
        const a = (i / N_BARS) * Math.PI * 2 + ang;
        if (Math.sin(a) >= 0) continue;
        const bx = CX + RX * Math.cos(a);
        const ty = TOP_Y + RY * Math.sin(a);
        const by = BOT_Y + RY * Math.sin(a);
        const dep = (Math.sin(a) + 1) / 2;
        ctx.beginPath();
        ctx.moveTo(bx, ty); ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(80,50,180,${0.08 + 0.10 * dep})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      const intGrad = ctx.createLinearGradient(IX1, 0, IX2, 0);
      intGrad.addColorStop(0,   'rgba(18,10,55,0.70)');
      intGrad.addColorStop(0.5, 'rgba(12,6,38,0.45)');
      intGrad.addColorStop(1,   'rgba(18,10,55,0.70)');
      ctx.fillStyle = intGrad;
      ctx.fillRect(IX1, IY1, IX2 - IX1, IY2 - IY1);

      ctx.save();
      ctx.beginPath();
      ctx.rect(IX1, IY1, IX2 - IX1, IY2 - IY1);
      ctx.clip();
      for (const c of cards.current) drawCard(c.x, c.y, c.rot, c.col);
      ctx.restore();

      ctx.beginPath();
      ctx.ellipse(CX, TOP_Y, RX, RY, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(35,20,90,0.88)';
      ctx.fill();
      ctx.strokeStyle = '#6040c0';
      ctx.lineWidth = 3;
      ctx.stroke();

      for (let i = 0; i < N_BARS; i++) {
        const a = (i / N_BARS) * Math.PI * 2 + ang;
        if (Math.sin(a) < 0) continue;
        const bx = CX + RX * Math.cos(a);
        const ty = TOP_Y + RY * Math.sin(a);
        const by = BOT_Y + RY * Math.sin(a);
        const dep = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(bx, ty); ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(160,120,255,${0.22 + 0.52 * dep})`;
        ctx.lineWidth = 1.2 + 1.4 * dep;
        ctx.stroke();
      }

      const hasGap = !!drop.current || launched.current;
      ctx.beginPath();
      if (hasGap) {
        const gapHalf = 0.42;
        ctx.ellipse(CX, BOT_Y, RX, RY, 0, Math.PI / 2 + gapHalf, Math.PI / 2 - gapHalf + Math.PI * 2);
      } else {
        ctx.ellipse(CX, BOT_Y, RX, RY, 0, 0, Math.PI * 2);
      }
      ctx.fillStyle = 'rgba(35,20,90,0.88)';
      ctx.fill();
      ctx.strokeStyle = '#6040c0';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(CX - 26, TOP_Y - 4, 66, 0.85, 2.25);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 18;
      ctx.stroke();

      if (drop.current) {
        const d = drop.current;
        drawCard(d.x, d.y, d.rot, d.col, d.scale, d.reveal, d.team);
      }
    }

    function tick() { update(); render(); raf.current = requestAnimationFrame(tick); }
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

type Phase = 'accept' | 'drawing' | 'done';

export default function TombolaContent({ company, onClose }: {
  company: Company;
  onClose?: () => void;
}) {
  const [phase, setPhase]             = useState<Phase>('accept');
  const [spinning, setSpinning]       = useState(false);
  const [name, setName]               = useState('');
  const [drawnTeam, setDrawnTeam]     = useState<string | null>(null);
  const [error, setError]             = useState('');
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

    setError(''); setPhase('drawing'); setSpinning(true);

    const MIN_MS = 2800, t0 = Date.now();
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

  if (phase === 'done' && drawnTeam) {
    return (
      <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div className="px-6 pt-6 pb-5" style={{ backgroundImage: 'url(/wc2026-header-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
            FIFA World Cup · 2026 · {company.name}
          </p>
          <h1 className="font-black text-4xl mt-1 tracking-tight" style={{ color: '#fff', lineHeight: 1 }}>Lucky Dip</h1>
        </div>
        <div className="px-6 py-6 text-center" style={{ background: 'var(--card)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>You drew…</p>
          <span style={{ fontSize: '5rem', lineHeight: 1, display: 'block' }}>{getFlag(drawnTeam)}</span>
          <h2 className="font-black text-3xl mt-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>{drawnTeam}</h2>
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
          {viewSweepButton}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

      <div className="px-6 pt-6 pb-5" style={{ backgroundImage: 'url(/wc2026-header-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
          FIFA World Cup · 2026 · {company.name}
        </p>
        <h1 className="font-black text-4xl mt-1 tracking-tight" style={{ color: '#fff', lineHeight: 1 }}>Lucky Dip</h1>
      </div>

      <div style={{ background: '#080518', paddingTop: '0.75rem', paddingBottom: '0.25rem' }}>
        <TombolaDrum spinning={spinning} drawnTeam={drawnTeam} onDone={handleExitDone} />
      </div>

      <div className="px-6 py-5 space-y-3" style={{ background: 'var(--card)' }}>
        {fee && (
          <div className="rounded-xl px-4 py-2.5 text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Entry fee </span>
            <span className="font-black text-2xl ml-2" style={{ color: 'var(--text-primary)' }}>{fee}</span>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pay the organiser directly</p>
          </div>
        )}

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
            {error && <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>}
            <button onClick={handleDraw}
              style={{ width: '100%', background: '#4D10C8', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>
              {fee ? `Accept ${fee} fee & Draw →` : 'Draw my team →'}
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
