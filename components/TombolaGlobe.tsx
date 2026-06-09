'use client';

import { useState, useEffect, useRef, useMemo, useReducer } from 'react';
import { getFlag } from '@/lib/flags';

// ─── Layout constants ──────────────────────────────────────────────────────────
const R        = 108;          // globe radius
const D        = R * 2;
const CX       = 150;          // globe centre x
const CY       = 138;          // globe centre y
const POST_OFF = Math.round(R * 1.2);   // post x-offset from CX
const ARM_LEN  = Math.round(R * 0.36);  // crank arm length
const N_RINGS  = 8;
const N_SLIPS  = 10;
const TRAY_Y   = CY + R + 88;  // where the dropped slip lands
const TOTAL_H  = TRAY_Y + 50;  // component total height

// ─── Colours ───────────────────────────────────────────────────────────────────
const BRASS_HI  = '#FFFFFF';
const BRASS_MID = '#EDE7D8';
const BRASS_DK  = '#BCB3A0';
const CREAM     = '#F1ECDD';
const CREAM_DK  = '#E2D8BF';
const LIME      = '#C2EE2E';
const RED       = '#ED1C2E';
const PURPLE    = '#5A18E0';
const PURPLE_DK = '#260A66';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const clamp        = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInQuad   = (t: number) => t * t;

function rng(seed: number) {
  let s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// ─── FoldedSlip ────────────────────────────────────────────────────────────────
function FoldedSlip({ w, tone }: { w: number; tone: number }) {
  const h = Math.round(w * 0.52);
  const face = tone > 0.5 ? CREAM_DK : CREAM;
  return (
    <div style={{
      width: w, height: h, borderRadius: 3, flexShrink: 0,
      background: `linear-gradient(155deg, #f5eddb 0%, ${face} 55%, #cfc09e 100%)`,
      boxShadow: '0 3px 9px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.4)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 3, right: 3, top: '50%', height: 1.5, marginTop: -0.75, background: 'rgba(100,80,40,0.20)' }} />
    </div>
  );
}

// ─── DroppingSlip ──────────────────────────────────────────────────────────────
function DroppingSlip({ x, y, rot, unfold, reveal, team }: {
  x: number; y: number; rot: number;
  unfold: number; reveal: number;
  team: string | null;
}) {
  const eu    = easeOutCubic(unfold);
  const foldW = 36, foldH = Math.round(36 * 0.52);
  const openW = 170, openH = 102;
  const w = foldW + (openW - foldW) * eu;
  const h = foldH + (openH - foldH) * eu;
  const fontSize = Math.max(10, h * 0.38);

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
      width: w, height: h,
      borderRadius: 6,
      background: 'linear-gradient(150deg, #ffffff, #f4efe2 70%, #e6dcc4)',
      boxShadow: `0 ${Math.round(h * 0.16)}px ${Math.round(h * 0.38)}px rgba(20,8,60,0.40), inset 0 1px 0 rgba(255,255,255,0.85)`,
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3,
    }}>
      {/* fold crease lines that fade out */}
      <div style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, background: 'rgba(90,24,224,0.16)', opacity: 1 - unfold }} />
      <div style={{ position: 'absolute', left: '67%', top: 0, bottom: 0, width: 1, background: 'rgba(90,24,224,0.16)', opacity: 1 - unfold }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(90,24,224,0.10)', opacity: 1 - reveal }} />

      {reveal > 0.08 && team && (
        <div style={{ opacity: reveal, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: `0 ${Math.round(w * 0.07)}px` }}>
          <span style={{ fontSize, lineHeight: 1 }}>{getFlag(team)}</span>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 800, fontSize: Math.max(8, h * 0.135),
            color: '#1C1B1A', letterSpacing: '-0.01em', textAlign: 'center', lineHeight: 1.1,
          }}>{team}</span>
        </div>
      )}
    </div>
  );
}

// ─── Animation state shape ─────────────────────────────────────────────────────
type Phase = 'idle' | 'spinning' | 'stopping' | 'dropping' | 'unfolding' | 'overlay' | 'done';

interface AS {
  t: number;
  drumRot: number;
  agitation: number;
  doorOpen: number;
  phase: Phase;
  phaseT: number;  // time when current phase started

  dropX: number; dropY: number; dropRot: number;
  dropActive: boolean;
  dropT: number;   // seconds into drop phase
  unfold: number;
  reveal: number;

  overlayAlpha: number;
  doneSignaled: boolean;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TombolaGlobe({ spinning, drawnTeam, onDone }: {
  spinning:  boolean;
  drawnTeam: string | null;
  onDone:    () => void;
}) {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const as = useRef<AS>({
    t: 0, drumRot: 0, agitation: 0, doorOpen: 0,
    phase: 'idle', phaseT: 0,
    dropX: CX, dropY: CY + R + 6, dropRot: 0,
    dropActive: false, dropT: 0,
    unfold: 0, reveal: 0,
    overlayAlpha: 0, doneSignaled: false,
  });

  const spinR  = useRef(spinning);
  const teamR  = useRef(drawnTeam);
  const doneR  = useRef(onDone);
  useEffect(() => { spinR.current = spinning; },   [spinning]);
  useEffect(() => { teamR.current = drawnTeam; },  [drawnTeam]);
  useEffect(() => { doneR.current = onDone; },     [onDone]);

  useEffect(() => {
    let raf: number;
    let lastTs: number | null = null;

    function tick(ts: number) {
      if (lastTs === null) { lastTs = ts; raf = requestAnimationFrame(tick); return; }
      const dt  = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const s   = as.current;
      const sp  = spinR.current;
      const tm  = teamR.current;
      s.t += dt;
      const elapsed = s.t - s.phaseT;

      // ── Phase transitions ───────────────────────────────────────────────────
      if (s.phase === 'idle' && sp) {
        s.phase = 'spinning'; s.phaseT = s.t;
      }

      if (s.phase === 'spinning' && tm && !s.doneSignaled) {
        s.phase = 'stopping'; s.phaseT = s.t;
      }

      if (s.phase === 'stopping' && elapsed > 0.85) {
        s.phase = 'dropping'; s.phaseT = s.t;
        s.dropActive = true; s.dropT = 0;
        s.dropX = CX; s.dropY = CY + R + 6; s.dropRot = -12;
      }

      if (s.phase === 'dropping') {
        s.dropT += dt;
        const DROP = 1.1;
        const p = clamp(s.dropT / DROP, 0, 1);
        const fall = easeInQuad(p);
        const startY = CY + R + 6;
        let y = startY + (TRAY_Y - startY) * fall;
        const bounce = p > 0.72 ? Math.abs(Math.sin((p - 0.72) / 0.28 * Math.PI * 1.75)) * (1 - p) * 26 : 0;
        y -= bounce;
        s.dropY = y;
        s.dropRot = -12 + 24 * p + Math.sin(p * Math.PI) * 8;

        if (s.dropT > DROP) {
          s.phase = 'unfolding'; s.phaseT = s.t;
          s.dropY = TRAY_Y; s.dropRot = 0;
        }
      }

      if (s.phase === 'unfolding') {
        const UNFOLD = 1.55;
        s.unfold  = clamp(elapsed / UNFOLD, 0, 1);
        s.reveal  = clamp((elapsed - UNFOLD * 0.48) / (UNFOLD * 0.46), 0, 1);
        if (elapsed > UNFOLD + 0.4) { s.phase = 'overlay'; s.phaseT = s.t; }
      }

      if (s.phase === 'overlay') {
        s.overlayAlpha = clamp(elapsed / 0.5, 0, 1);
        if (elapsed > 2.8 && !s.doneSignaled) {
          s.doneSignaled = true;
          doneR.current();
        }
      }

      // ── Drum rotation & agitation ───────────────────────────────────────────
      switch (s.phase) {
        case 'idle':
          s.drumRot   += dt * 22;
          s.agitation  = Math.max(0, s.agitation - dt * 1.5);
          s.doorOpen   = 0;
          break;
        case 'spinning':
          s.drumRot   += dt * 195;
          s.agitation  = Math.min(1, s.agitation + dt * 2.8);
          s.doorOpen   = 0;
          break;
        case 'stopping': {
          const p = clamp(elapsed / 0.85, 0, 1);
          s.drumRot   += dt * (195 * (1 - easeInQuad(p)) + 14);
          s.agitation  = Math.max(0, 1 - p * 1.6);
          s.doorOpen   = clamp((elapsed - 0.38) / 0.47, 0, 1);
          break;
        }
        case 'dropping':
        case 'unfolding':
          s.drumRot   += dt * 10;
          s.agitation  = 0;
          s.doorOpen   = 1;
          break;
        case 'overlay':
          s.drumRot   += dt * 7;
          s.doorOpen   = Math.max(0, 1 - elapsed * 1.4);
          break;
      }

      s.drumRot = s.drumRot % 360;
      bump();
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slip layout (static, generated once)
  const slips = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: N_SLIPS }, () => ({
      restX:   (r() - 0.5) * R * 0.88,
      restY:   R * 0.44 + (r() - 0.5) * R * 0.26,
      ph:      r() * Math.PI * 2,
      spdX:    1.1 + r() * 1.5,
      spdY:    0.9 + r() * 1.3,
      ampX:    44 + r() * 46,
      ampY:    48 + r() * 58,
      rotSpd:  (r() - 0.5) * 490,
      baseRot: r() * 360,
      w:       Math.round(28 + r() * 13),
      tone:    r(),
    }));
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  const s     = as.current;
  const rad   = (s.drumRot * Math.PI) / 180;
  // Crank: hub on the right post, arm swings vertically
  const pivX  = CX + POST_OFF + Math.round(R * 0.06);
  const gy    = -ARM_LEN * Math.cos(rad);
  const gDepth = 1 + 0.18 * Math.sin(rad);

  const postH = Math.round(R + (R * 0.22));  // post height (globe centre to base top)

  return (
    <div style={{ position: 'relative', width: 300, height: TOTAL_H, margin: '0 auto' }}>

      {/* ── Base ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: CX, top: CY + R + 6,
        width: R * 1.88, height: Math.round(R * 0.28),
        marginLeft: -(R * 0.94),
        borderRadius: '50%',
        background: `linear-gradient(180deg, ${BRASS_HI}, ${BRASS_MID} 45%, ${BRASS_DK})`,
        boxShadow: '0 14px 32px rgba(20,6,60,0.48)',
      }} />

      {/* ── Axle ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: CX, top: CY,
        width: (POST_OFF + R * 0.08) * 2, height: Math.round(R * 0.05),
        marginLeft: -(POST_OFF + R * 0.04), marginTop: -Math.round(R * 0.025),
        borderRadius: R * 0.025,
        background: `linear-gradient(180deg, ${BRASS_HI}, ${BRASS_MID} 50%, ${BRASS_DK})`,
        boxShadow: '0 3px 8px rgba(20,6,60,0.32)',
      }} />

      {/* ── Posts ─────────────────────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <div key={side} style={{
          position: 'absolute',
          left: CX + side * POST_OFF,
          top: CY,
          width: Math.round(R * 0.11), height: postH,
          marginLeft: -Math.round(R * 0.055),
          borderRadius: Math.round(R * 0.04),
          background: `linear-gradient(90deg, ${BRASS_DK}, ${BRASS_MID} 44%, ${BRASS_HI} 52%, ${BRASS_MID} 60%, ${BRASS_DK})`,
          boxShadow: '0 6px 16px rgba(20,6,60,0.38)',
        }} />
      ))}

      {/* ── Globe glass body (clips the tumbling slips) ────────────────────── */}
      <div style={{
        position: 'absolute',
        left: CX - R, top: CY - R,
        width: D, height: D,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.14) 0%, rgba(135,95,215,0.07) 42%, rgba(38,10,102,0.26) 100%)',
        boxShadow: 'inset 0 -20px 44px rgba(38,10,102,0.40), inset 0 12px 36px rgba(255,255,255,0.07)',
      }}>
        {slips.map((sd, i) => {
          const ax  = sd.restX + Math.sin(s.t * sd.spdX + sd.ph) * sd.ampX * s.agitation;
          const ay  = sd.restY - (0.5 + 0.5 * Math.sin(s.t * sd.spdY + sd.ph * 1.7)) * sd.ampY * s.agitation;
          const rot = sd.baseRot + s.t * sd.rotSpd * s.agitation;
          return (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${ax}px), calc(-50% + ${ay}px)) rotate(${rot}deg)`,
              willChange: 'transform',
            }}>
              <FoldedSlip w={sd.w} tone={sd.tone} />
            </div>
          );
        })}
      </div>

      {/* ── 3D wireframe rings (span globe, animate via perspective+rotateX) ── */}
      {Array.from({ length: N_RINGS }, (_, i) => {
        const ang  = s.drumRot + (i * 180) / N_RINGS;
        const isLime = i === 0;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: CX, top: CY,
            width: D, height: D,
            marginLeft: -R, marginTop: -R,
            borderRadius: '50%',
            border: isLime
              ? `2.5px solid rgba(194,238,46,0.58)`
              : `1.5px solid rgba(255,255,255,${0.12 + 0.10 * (i % 2)})`,
            transform: `perspective(${Math.round(R * 7)}px) rotateX(${ang}deg)`,
            pointerEvents: 'none',
            willChange: 'transform',
          }} />
        );
      })}

      {/* ── Glass rim + specular ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: CX - R, top: CY - R, width: D, height: D,
        borderRadius: '50%', pointerEvents: 'none',
        border: '2px solid rgba(255,255,255,0.26)',
        boxShadow: 'inset -8px -12px 36px rgba(255,255,255,0.12), inset 6px 8px 24px rgba(110,70,210,0.14), 0 22px 48px rgba(15,4,55,0.38)',
      }} />
      <div style={{
        position: 'absolute',
        left: CX - R * 0.44, top: CY - R * 0.57,
        width: R * 0.65, height: R * 0.48,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.62), transparent 70%)',
        filter: 'blur(2px)', pointerEvents: 'none',
      }} />

      {/* ── Drop hatch ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: CX, top: CY + R - 2,
        width: Math.round(R * 0.23), height: Math.round(R * 0.12),
        marginLeft: -Math.round(R * 0.115),
        transformOrigin: 'top center',
        transform: `rotate(${s.doorOpen * 72}deg)`,
        background: `linear-gradient(180deg, ${BRASS_MID}, ${BRASS_DK})`,
        borderRadius: `0 0 ${Math.round(R * 0.04)}px ${Math.round(R * 0.04)}px`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.28)',
      }} />

      {/* ── Crank handle ───────────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', left: pivX, top: CY, pointerEvents: 'none' }}>
        {/* hub disc */}
        <div style={{
          position: 'absolute',
          left: -Math.round(R * 0.06), top: -Math.round(R * 0.06),
          width: Math.round(R * 0.12), height: Math.round(R * 0.12),
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 32%, ${BRASS_HI}, ${BRASS_MID} 55%, ${BRASS_DK})`,
          boxShadow: '0 2px 6px rgba(20,6,60,0.45)',
        }} />
        {/* arm from hub to crank pin */}
        <div style={{
          position: 'absolute',
          left: -Math.round(R * 0.032), top: Math.min(0, gy),
          width: Math.round(R * 0.064), height: Math.max(1, Math.abs(gy)),
          background: `linear-gradient(90deg, ${BRASS_DK}, ${BRASS_HI} 50%, ${BRASS_DK})`,
          borderRadius: Math.round(R * 0.032),
        }} />
        {/* crank pin */}
        <div style={{
          position: 'absolute',
          left: -Math.round(R * 0.05), top: gy - Math.round(R * 0.05),
          width: Math.round(R * 0.10), height: Math.round(R * 0.10),
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${BRASS_HI}, ${BRASS_MID} 55%, ${BRASS_DK})`,
          boxShadow: '0 2px 4px rgba(20,6,60,0.40)',
        }} />
        {/* grip — extends outward (to the right), scales with depth */}
        <div style={{
          position: 'absolute',
          left: Math.round(R * 0.04), top: gy - Math.round(R * 0.044),
          width: Math.round(R * 0.22), height: Math.round(R * 0.088),
          transform: `scaleY(${gDepth})`,
          transformOrigin: 'left center',
          borderRadius: Math.round(R * 0.044),
          background: `radial-gradient(circle at 30% 28%, #ff6068, ${RED} 58%, #9A0E18)`,
          boxShadow: '0 3px 9px rgba(20,6,60,0.42)',
        }} />
      </div>

      {/* ── Dropped slip (falls below hatch, then unfolds) ──────────────────── */}
      {s.dropActive && s.phase !== 'overlay' && s.phase !== 'done' && (
        <DroppingSlip
          x={s.dropX} y={s.dropY} rot={s.dropRot}
          unfold={s.unfold} reveal={s.reveal}
          team={drawnTeam}
        />
      )}

      {/* ── Hero reveal overlay ─────────────────────────────────────────────── */}
      {s.phase === 'overlay' && drawnTeam && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 42%, ${PURPLE} 0%, ${PURPLE_DK} 70%)`,
          opacity: s.overlayAlpha,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '4.2rem', lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}>
            {getFlag(drawnTeam)}
          </span>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 800, fontSize: 'clamp(1.4rem, 5vw, 1.85rem)',
            letterSpacing: '-0.02em', color: '#fff', textAlign: 'center',
            textShadow: '0 6px 24px rgba(10,2,40,0.5)',
            padding: '0 1rem',
          }}>{drawnTeam}</span>
          <span style={{
            background: '#F1ECDD', color: PURPLE,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.16em',
            padding: '0.3rem 1rem', borderRadius: 999, textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(10,2,40,0.35)',
            opacity: clamp((s.overlayAlpha - 0.5) / 0.4, 0, 1),
          }}>Your team</span>
        </div>
      )}

    </div>
  );
}
