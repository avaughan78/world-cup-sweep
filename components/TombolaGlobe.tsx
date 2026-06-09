'use client';

import { useEffect, useRef, useMemo, useReducer } from 'react';
import { getFlag } from '@/lib/flags';

// ─── Layout constants ──────────────────────────────────────────────────────────
const R        = 108;
const D        = R * 2;
const CX       = 150;
const CY       = 138;
const POST_OFF = Math.round(R * 1.2);
const ARM_LEN  = Math.round(R * 0.36);
const N_RINGS  = 8;
const N_SLIPS  = 11;
const TRAY_Y   = CY + R + 62;
const TOTAL_H  = TRAY_Y + 32;

// Hoop baffles — visual: horizontal rings (rotateX); physics: radial spokes (effective scatter)
const N_BARS     = 4;
const BAR_THICK  = 8;    // collision half-thickness (px)
const BAR_RESTIT = 0.55; // baffle bounciness
const BAR_FRIC   = 0.42; // tangential friction fraction

// 200 deg/s — slow enough that balls don't centrifuge to the wall
const SPIN_DEG_S = 200;

// Ping-pong balls — uniform parchment colour
const BALL_R     = 11;
const BALL_COLOR = '#F1ECDD';

// ─── Colours ───────────────────────────────────────────────────────────────────
const BRASS_HI  = '#FFFFFF';
const BRASS_MID = '#EDE7D8';
const BRASS_DK  = '#BCB3A0';
const PURPLE    = '#5A18E0';
const PURPLE_DK = '#260A66';
const RED       = '#ED1C2E';
const LIME      = '#C2EE2E';

// ─── Flag colours for confetti ─────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string[]> = {
  Argentina:   ['#74ACDF', '#FFFFFF', '#F6B40E'],
  Brazil:      ['#009C3B', '#FEDF00', '#002776'],
  Colombia:    ['#FCD116', '#003087', '#CE1126'],
  Ecuador:     ['#FFD100', '#003087', '#EF3340'],
  Uruguay:     ['#5BA4CF', '#FFFFFF'],
  Venezuela:   ['#CF142B', '#FFD700', '#003087'],
  Chile:       ['#D52B1E', '#FFFFFF', '#003087'],
  Paraguay:    ['#D52B1E', '#FFFFFF', '#0038A8'],
  Peru:        ['#D91023', '#FFFFFF'],
  Bolivia:     ['#D52B1E', '#F4E400', '#007A3D'],
  USA:         ['#B22234', '#FFFFFF', '#3C3B6E'],
  Canada:      ['#FF0000', '#FFFFFF'],
  Mexico:      ['#006847', '#FFFFFF', '#CE1126'],
  Panama:      ['#DA121A', '#FFFFFF', '#1B2D8E'],
  Honduras:    ['#0073CF', '#FFFFFF'],
  'Costa Rica':['#002B7F', '#CE1126', '#FFFFFF'],
  Jamaica:     ['#000000', '#FED100', '#007749'],
  'El Salvador':['#0F47AF', '#FFFFFF'],
  Guatemala:   ['#4997D0', '#FFFFFF'],
  'Trinidad and Tobago':['#CE1126', '#FFFFFF', '#000000'],
  'Curaçao':   ['#002B7F', '#F9E814'],
  France:      ['#0E4DA4', '#FFFFFF', '#E1213B'],
  England:     ['#CE1124', '#FFFFFF'],
  Germany:     ['#000000', '#DD0000', '#FFCE00'],
  Spain:       ['#AA151B', '#F1BF00'],
  Portugal:    ['#006600', '#FF0000', '#FFFFFF'],
  Netherlands: ['#AE1C28', '#FFFFFF', '#21468B'],
  Belgium:     ['#000000', '#FDDA24', '#EF3340'],
  Croatia:     ['#FF0000', '#FFFFFF', '#003DA5'],
  Italy:       ['#009246', '#FFFFFF', '#CE2B37'],
  Austria:     ['#ED2939', '#FFFFFF'],
  Switzerland: ['#FF0000', '#FFFFFF'],
  Scotland:    ['#003DA5', '#FFFFFF'],
  Wales:       ['#C8102E', '#00664B'],
  Denmark:     ['#C60C30', '#FFFFFF'],
  Sweden:      ['#006AA7', '#FECC02'],
  Norway:      ['#EF2B2D', '#FFFFFF', '#003087'],
  Czechia:     ['#D7141A', '#FFFFFF', '#11457E'],
  Slovakia:    ['#FFFFFF', '#0B4EA2', '#EE1C25'],
  Poland:      ['#FFFFFF', '#DC143C'],
  Hungary:     ['#CE2939', '#FFFFFF', '#477050'],
  Serbia:      ['#C6363C', '#0C4076', '#FFFFFF'],
  Turkey:      ['#E30A17', '#FFFFFF'],
  Ukraine:     ['#005BBB', '#FFD500'],
  Romania:     ['#002B7F', '#FCD116', '#CE1126'],
  Slovenia:    ['#003DA5', '#FFFFFF', '#DD0000'],
  Albania:     ['#E41E20', '#000000'],
  Greece:      ['#0D5EAF', '#FFFFFF'],
  Kosovo:      ['#244AA5', '#FFD700'],
  'Bosnia and Herzegovina':['#002395', '#FFCA00'],
  'North Macedonia':['#CE2028', '#FFE000'],
  Georgia:     ['#FF0000', '#FFFFFF'],
  Finland:     ['#FFFFFF', '#003580'],
  Israel:      ['#FFFFFF', '#0038B8'],
  Morocco:     ['#C1272D', '#006233', '#FFFFFF'],
  Nigeria:     ['#008751', '#FFFFFF'],
  Egypt:       ['#CE1126', '#FFFFFF', '#000000'],
  Senegal:     ['#00853F', '#FDEF42', '#E31B23'],
  Cameroon:    ['#007A5E', '#CE1126', '#FCD116'],
  'Ivory Coast':['#F77F00', '#FFFFFF', '#009A44'],
  'South Africa':['#007A4D', '#FFB81C', '#DE3831', '#FFFFFF'],
  Ghana:       ['#006B3F', '#FCD116', '#EF3340', '#000000'],
  Algeria:     ['#006233', '#FFFFFF', '#D21034'],
  Tunisia:     ['#E70013', '#FFFFFF'],
  'DR Congo':  ['#007FFF', '#EF3340', '#EFBE25'],
  'Cape Verde':['#003893', '#CF2027', '#F7D116'],
  Japan:       ['#BC002D', '#FFFFFF'],
  'South Korea':['#CD2E3A', '#FFFFFF', '#003478'],
  'Saudi Arabia':['#006C35', '#FFFFFF'],
  Iran:        ['#239F40', '#FFFFFF', '#DA0000'],
  Australia:   ['#012169', '#E8112D', '#FFFFFF'],
  Qatar:       ['#8D1B3D', '#FFFFFF'],
  China:       ['#DE2910', '#FFDE00'],
  Indonesia:   ['#CE1126', '#FFFFFF'],
  Iraq:        ['#CE1126', '#FFFFFF', '#000000'],
  Jordan:      ['#007A3D', '#FFFFFF', '#CE1126'],
  Uzbekistan:  ['#1EB53A', '#FFFFFF', '#CE1126'],
  'New Zealand':['#00247D', '#CC142B', '#FFFFFF'],
};

function teamColors(team: string): string[] {
  return TEAM_COLORS[team] ?? [RED, LIME, '#FFFFFF', PURPLE];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const clamp        = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// ─── Slip rigid-body state ─────────────────────────────────────────────────────
interface SlipPhys { x: number; y: number; vx: number; vy: number }

function initSlipPhys(n: number): SlipPhys[] {
  const r = rng73();
  const INNER = R - BALL_R;
  return Array.from({ length: n }, () => ({
    x:  (r() - 0.5) * INNER * 0.8,
    y:  INNER * (0.50 + r() * 0.34),
    vx: (r() - 0.5) * 18,
    vy: (r() - 0.5) * 18,
  }));
}

// separate rng so useMemo(rng(42)) results are unaffected
function rng73() {
  let s = 73 % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

function rng(seed: number) {
  let s = ((seed % 2147483647) + 2147483647) % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// ─── Confetti ──────────────────────────────────────────────────────────────────
interface Confetti {
  vx: number; vy: number;
  w: number; h: number;
  color: string;
  rot0: number; rotSpd: number;
  sway: number; swayPh: number;
  delay: number;
}

function buildConfetti(colors: string[], seed: number): Confetti[] {
  const r = rng(seed);
  return Array.from({ length: 72 }, () => {
    // fan: primarily upward, ±65° spread
    const ang = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.3;
    const speed = 110 + r() * 190;
    return {
      vx:     Math.cos(ang) * speed + (r() - 0.5) * 60,
      vy:     Math.sin(ang) * speed,
      w:      5 + Math.round(r() * 8),
      h:      8 + Math.round(r() * 14),
      color:  colors[Math.floor(r() * colors.length)],
      rot0:   r() * 360,
      rotSpd: (r() - 0.5) * 720,
      sway:   0.4 + r() * 1.2,
      swayPh: r() * 6.28,
      delay:  r() * 0.20,
    };
  });
}

// ─── Ball in drum ──────────────────────────────────────────────────────────────
function Ball({ seamAngle, dimAlpha }: { seamAngle: number; dimAlpha: number }) {
  return (
    <div style={{
      width: BALL_R * 2, height: BALL_R * 2, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 38% 30%, rgba(255,255,255,0.90) 0%, ${BALL_COLOR} 48%, rgba(0,0,0,0.18) 100%)`,
      boxShadow: '0 3px 10px rgba(0,0,0,0.40)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Seam line */}
      <div style={{
        position: 'absolute', left: '8%', right: '8%',
        top: '50%', height: 1.5, marginTop: -0.75,
        background: 'rgba(150,136,112,0.42)',
        transform: `rotate(${seamAngle}deg)`, transformOrigin: 'center',
      }} />
      {/* Depth shadow for back-facing balls */}
      {dimAlpha > 0.02 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(8,4,24,${dimAlpha.toFixed(3)})`,
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ─── Dropping / revealing ball ─────────────────────────────────────────────────
function DroppingBall({ x, y, unfold, reveal, team }: {
  x: number; y: number;
  unfold: number; reveal: number;
  team: string | null;
}) {
  const eu    = easeOutCubic(unfold);
  const ballR = BALL_R + (55 - BALL_R) * eu;
  const adjY  = y - eu * 36;
  const showContent = reveal > 0.08 && !!team;
  return (
    <div style={{
      position: 'absolute', left: x, top: adjY,
      transform: 'translate(-50%, -50%)',
      width: ballR * 2, height: ballR * 2,
      borderRadius: '50%',
      background: `radial-gradient(circle at 38% 30%, rgba(255,255,255,0.90) 0%, ${BALL_COLOR} 48%, rgba(0,0,0,0.18) 100%)`,
      boxShadow: `0 ${Math.round(ballR * 0.18)}px ${Math.round(ballR * 0.65)}px rgba(0,0,0,0.42)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Seam — fades out as content is revealed */}
      <div style={{
        position: 'absolute', left: '8%', right: '8%',
        top: '50%', height: Math.max(1, Math.round(ballR * 0.025)), marginTop: -Math.round(ballR * 0.013),
        background: 'rgba(150,136,112,0.38)',
        transform: 'rotate(15deg)', transformOrigin: 'center',
        opacity: Math.max(0, 1 - reveal * 1.8),
        pointerEvents: 'none',
      }} />
      {showContent && (
        <div style={{ opacity: reveal, textAlign: 'center', padding: `0 ${Math.round(ballR * 0.1)}px` }}>
          <div style={{ fontSize: Math.round(ballR * 0.82), lineHeight: 1 }}>{getFlag(team!)}</div>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 800, fontSize: Math.max(7, Math.round(ballR * 0.21)),
            color: PURPLE_DK, letterSpacing: '-0.01em',
            textAlign: 'center', lineHeight: 1.1,
          }}>{team}</div>
        </div>
      )}
    </div>
  );
}

// ─── Animation state ───────────────────────────────────────────────────────────
type Phase = 'idle' | 'spinning' | 'stopping' | 'dropping' | 'unfolding' | 'overlay' | 'done';

interface AS {
  t: number; drumRot: number; drumAngVelRad: number; agitation: number; doorOpen: number;
  slipPhys: SlipPhys[];
  phase: Phase; phaseT: number;
  dropX: number; dropY: number; dropVx: number; dropVy: number;
  dropActive: boolean; unfold: number; reveal: number;
  overlayAlpha: number;
  confetti: Confetti[];
  doneSignaled: boolean;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TombolaGlobe({ spinning, drawnTeam, onDone, nSlips }: {
  spinning:  boolean;
  drawnTeam: string | null;
  onDone:    () => void;
  nSlips?:   number;
}) {
  const nBalls = Math.max(1, nSlips ?? N_SLIPS);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const as = useRef<AS>({
    t: 0, drumRot: 0, drumAngVelRad: 0, agitation: 0, doorOpen: 0,
    slipPhys: initSlipPhys(nBalls),
    phase: 'idle', phaseT: 0,
    dropX: CX, dropY: CY + R + BALL_R, dropVx: 0, dropVy: 0,
    dropActive: false, unfold: 0, reveal: 0,
    overlayAlpha: 0, confetti: [], doneSignaled: false,
  });

  const spinR = useRef(spinning);
  const teamR = useRef(drawnTeam);
  const doneR = useRef(onDone);
  useEffect(() => { spinR.current = spinning; },  [spinning]);
  useEffect(() => { teamR.current = drawnTeam; }, [drawnTeam]);
  useEffect(() => { doneR.current = onDone; },    [onDone]);

  useEffect(() => {
    let raf: number;
    let lastTs: number | null = null;

    function tick(ts: number) {
      if (lastTs === null) { lastTs = ts; raf = requestAnimationFrame(tick); return; }
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      const s = as.current;
      const sp = spinR.current;
      const tm = teamR.current;
      s.t += dt;
      const elapsed = s.t - s.phaseT;

      // ── Phase transitions ─────────────────────────────────────────────────
      if (s.phase === 'idle' && sp) {
        s.phase = 'spinning'; s.phaseT = s.t;
      }
      if (s.phase === 'spinning' && tm && !s.doneSignaled) {
        s.phase = 'stopping'; s.phaseT = s.t;
      }
      if (s.phase === 'stopping' && elapsed > 1.5) {
        s.phase = 'dropping'; s.phaseT = s.t;
        s.dropActive = true;
        s.dropX = CX;
        s.dropY = CY + R + BALL_R;
        s.dropVx = (Math.random() - 0.5) * 50;
        s.dropVy = 80;
      }
      if (s.phase === 'dropping') {
        // Gravity-based physics with chute walls + bouncy floor
        s.dropVy += 280 * dt;
        s.dropVx *= Math.exp(-2.5 * dt);
        s.dropX += s.dropVx * dt;
        s.dropY += s.dropVy * dt;
        const CHUTE_HALF = BALL_R + 3;
        if (Math.abs(s.dropX - CX) > CHUTE_HALF) {
          s.dropX = CX + Math.sign(s.dropX - CX) * CHUTE_HALF;
          s.dropVx = -s.dropVx * 0.45;
        }
        if (s.dropY >= TRAY_Y) {
          s.dropY = TRAY_Y;
          s.dropVy = -Math.abs(s.dropVy) * (Math.abs(s.dropVy) > 60 ? 0.50 : 0.22);
          s.dropVx *= 0.75;
          if (Math.abs(s.dropVy) < 22) {
            s.dropVy = 0; s.dropVx = 0;
            s.phase = 'unfolding'; s.phaseT = s.t;
          }
        }
      }
      if (s.phase === 'unfolding') {
        const UNFOLD = 1.55;
        s.unfold = clamp(elapsed / UNFOLD, 0, 1);
        s.reveal = clamp((elapsed - UNFOLD * 0.48) / (UNFOLD * 0.46), 0, 1);
        if (elapsed > UNFOLD + 0.4) { s.phase = 'overlay'; s.phaseT = s.t; }
      }
      if (s.phase === 'overlay') {
        // Initialise confetti once on first frame of this phase
        if (s.confetti.length === 0 && tm) {
          s.confetti = buildConfetti(teamColors(tm), Math.round(s.t * 1000));
        }
        s.overlayAlpha = clamp(elapsed / 0.5, 0, 1);
        if (elapsed > 2.8 && !s.doneSignaled) {
          s.doneSignaled = true;
          doneR.current();
        }
      }

      // ── Drum rotation & agitation ─────────────────────────────────────────
      let drumSpeedDeg = 0;
      switch (s.phase) {
        case 'idle':
          drumSpeedDeg = 30;
          s.drumRot  += dt * drumSpeedDeg;
          s.agitation = 0.28 + 0.06 * Math.sin(s.t * 0.65);
          s.doorOpen  = 0;
          break;
        case 'spinning':
          drumSpeedDeg = SPIN_DEG_S;
          s.drumRot  += dt * drumSpeedDeg;
          s.agitation = Math.min(1, s.agitation + dt * 2.8);
          s.doorOpen  = 0;
          break;
        case 'stopping': {
          // Exponential decay = constant rotational friction = natural flywheel feel
          drumSpeedDeg = SPIN_DEG_S * Math.exp(-3.2 * elapsed) + 8;
          s.drumRot  += dt * drumSpeedDeg;
          s.agitation = Math.max(0, 1 - elapsed / 1.5 * 1.3);
          // Door opens after drum has mostly slowed (elapsed 0.6 → 1.3s)
          s.doorOpen  = clamp((elapsed - 0.6) / 0.7, 0, 1);
          break;
        }
        case 'dropping':
        case 'unfolding':
          drumSpeedDeg = 10;
          s.drumRot  += dt * drumSpeedDeg;
          s.agitation = 0;
          s.doorOpen  = 1;
          break;
        case 'overlay':
          drumSpeedDeg = 7;
          s.drumRot  += dt * drumSpeedDeg;
          s.doorOpen  = Math.max(0, 1 - elapsed * 1.4);
          break;
      }
      s.drumAngVelRad = drumSpeedDeg * Math.PI / 180;
      s.drumRot = s.drumRot % 360;

      // ── Ball physics ──────────────────────────────────────────────────────
      {
        const INNER  = R - BALL_R;
        const G      = 420;
        const RESTIT = 0.50;
        const WFRICT = 0.10;
        const DAMP   = Math.exp(-0.55 * dt);
        // Cap angular velocity used in wall friction — keeps centrifuge force well below gravity
        const ω      = Math.min(s.drumAngVelRad, 0.45);
        // Gravity stays strong even at full spin so balls settle in lower half
        const gEff = G * Math.max(0.55, 1 - s.agitation * 0.45);
        // Mild turbulence — enough to break symmetry, not enough to look chaotic
        const turb = 28 * s.agitation * Math.sqrt(dt);

        for (const sp of s.slipPhys) {
          sp.vy += gEff * dt;
          sp.vx += (Math.random() - 0.5) * turb;
          sp.vy += (Math.random() - 0.5) * turb;
          sp.vx *= DAMP;
          sp.vy *= DAMP;
          sp.x  += sp.vx * dt;
          sp.y  += sp.vy * dt;

          // Outer wall collision
          const d = Math.sqrt(sp.x * sp.x + sp.y * sp.y);
          if (d < 0.01) { sp.y = INNER * 0.75; continue; }
          if (d > INNER) {
            const nx = sp.x / d, ny = sp.y / d;
            sp.x = nx * INNER; sp.y = ny * INNER;

            // Door gap: as the door opens, the bottom of the drum is no longer solid.
            // ny > 0 = ball facing downward (positive Y = down in our coords).
            // gapEffect ramps to 1 when door is fully open and ball squarely faces the opening.
            const gapEffect = s.doorOpen * Math.max(0, ny) * Math.max(0, ny);
            const effectiveRestit = RESTIT * (1 - gapEffect * 0.92);

            const wvx = -ω * sp.y, wvy = ω * sp.x;
            const vn = sp.vx * nx + sp.vy * ny;
            if (vn > 0) {
              sp.vx -= (1 + effectiveRestit) * vn * nx;
              sp.vy -= (1 + effectiveRestit) * vn * ny;
            }
            const vn2   = sp.vx * nx + sp.vy * ny;
            const spTx  = sp.vx - vn2 * nx, spTy = sp.vy - vn2 * ny;
            const wnorm = wvx * nx + wvy * ny;
            const wTx   = wvx - wnorm * nx, wTy = wvy - wnorm * ny;
            const frictionScale = 1 - gapEffect * 0.75;
            sp.vx += Math.min(1, WFRICT * dt * 60) * (wTx - spTx) * frictionScale;
            sp.vy += Math.min(1, WFRICT * dt * 60) * (wTy - spTy) * frictionScale;
          }

          // Baffle physics: radial-spoke model — sweeps the full drum diameter so it
          // reaches slips at any position, including the bottom where they settle.
          // Visual uses horizontal rings (rotateX) — geometry is intentionally decoupled.
          for (let b = 0; b < N_BARS; b++) {
            const barAng = s.drumRot * Math.PI / 180 + b * (Math.PI / 2);
            const bc = Math.cos(barAng), bs = Math.sin(barAng);
            const tAlong = clamp(sp.x * bc + sp.y * bs, -INNER, INNER);
            const bpx = tAlong * bc, bpy = tAlong * bs;
            const dx = sp.x - bpx, dy = sp.y - bpy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist >= BAR_THICK || dist < 0.01) continue;
            const nx = dx / dist, ny = dy / dist;
            const bvx = -s.drumAngVelRad * bpy, bvy = s.drumAngVelRad * bpx;
            const vrn = (sp.vx - bvx) * nx + (sp.vy - bvy) * ny;
            if (vrn < 0) {
              sp.vx -= (1 + BAR_RESTIT) * vrn * nx;
              sp.vy -= (1 + BAR_RESTIT) * vrn * ny;
            }
            const vrx2 = sp.vx - bvx, vry2 = sp.vy - bvy;
            const vrn2 = vrx2 * nx + vry2 * ny;
            sp.vx -= BAR_FRIC * (vrx2 - vrn2 * nx);
            sp.vy -= BAR_FRIC * (vry2 - vrn2 * ny);
            sp.x = bpx + nx * (BAR_THICK + 0.5);
            sp.y = bpy + ny * (BAR_THICK + 0.5);
          }
        }

        // Elastic ball-ball collisions: hard separation + velocity impulse exchange.
        // This replaces the old soft-repulsion force, giving crisp billiard-like bouncing.
        const BALL_RESTIT = 0.72;
        const MIN_DIST    = BALL_R * 2;
        for (let i = 0; i < s.slipPhys.length - 1; i++) {
          for (let j = i + 1; j < s.slipPhys.length; j++) {
            const a = s.slipPhys[i], b = s.slipPhys[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 >= MIN_DIST * MIN_DIST || dist2 < 0.001) continue;
            const dist = Math.sqrt(dist2);
            const nx = dx / dist, ny = dy / dist;
            // Push overlapping balls apart (equal share)
            const overlap = (MIN_DIST - dist) * 0.5;
            a.x += nx * overlap; a.y += ny * overlap;
            b.x -= nx * overlap; b.y -= ny * overlap;
            // Impulse along contact normal (equal-mass, partially inelastic)
            const vRel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (vRel < 0) { // only when approaching
              const J = (1 + BALL_RESTIT) * 0.5 * vRel;
              a.vx -= J * nx; a.vy -= J * ny;
              b.vx += J * nx; b.vy += J * ny;
            }
          }
        }
      }

      bump();
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-ball visual constants (position & velocity live in as.current.slipPhys)
  const slips = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: nBalls }, () => ({
      zPhase:    r() * Math.PI * 2,          // phase offset for depth oscillation
      seamAngle: Math.round(r() * 160 - 80), // seam rotation -80..+80°
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  const s    = as.current;
  const rad  = (s.drumRot * Math.PI) / 180;

  // Pseudo-3D depth: oscillate each ball's z using drum angle + per-ball phase.
  // Sort back-to-front so front balls render on top.
  const ballsWithDepth = slips.map((sd, i) => {
    const sp = s.slipPhys[i];
    const posAng = sp ? Math.atan2(sp.x, sp.y) : 0;
    const z = (Math.sin(rad * 0.65 + posAng + sd.zPhase) + 1) / 2; // 0=back 1=front
    return { i, sp, z, sd };
  }).sort((a, b) => a.z - b.z);

  const pivX = CX + POST_OFF + Math.round(R * 0.06);
  const gy   = -ARM_LEN * Math.cos(rad);
  const gDepth = 1 + 0.18 * Math.sin(rad);
  const postH  = Math.round(R + R * 0.22);

  // Confetti positions for current frame (computed from overlay elapsed time)
  const confettiEls = s.phase === 'overlay' && s.confetti.length > 0
    ? s.confetti.map((p, i) => {
        const ct = s.t - s.phaseT;
        const tt = Math.max(0, ct - p.delay);
        if (tt <= 0) return null;
        // Gravity: 370 px/s²
        const x = CX + p.vx * tt + Math.sin(tt * p.sway * 5 + p.swayPh) * 14;
        const y = (CY - 10) + p.vy * tt + 0.5 * 370 * tt * tt;
        const op = Math.max(0, 1 - Math.max(0, tt - 1.4) / 1.1);
        if (op <= 0) return null;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y,
            width: p.w, height: p.h,
            background: p.color,
            borderRadius: 1,
            transform: `rotate(${p.rot0 + p.rotSpd * tt}deg)`,
            opacity: op,
            pointerEvents: 'none',
          }} />
        );
      })
    : null;

  return (
    <div style={{ position: 'relative', width: 300, height: TOTAL_H, margin: '0 auto' }}>

      {/* Base */}
      <div style={{
        position: 'absolute', left: CX, top: CY + R + 6,
        width: R * 1.88, height: Math.round(R * 0.28), marginLeft: -(R * 0.94),
        borderRadius: '50%',
        background: `linear-gradient(180deg, ${BRASS_HI}, ${BRASS_MID} 45%, ${BRASS_DK})`,
        boxShadow: '0 14px 32px rgba(20,6,60,0.48)',
      }} />

      {/* Axle */}
      <div style={{
        position: 'absolute', left: CX, top: CY,
        width: (POST_OFF + R * 0.08) * 2, height: Math.round(R * 0.05),
        marginLeft: -(POST_OFF + R * 0.04), marginTop: -Math.round(R * 0.025),
        borderRadius: R * 0.025,
        background: `linear-gradient(180deg, ${BRASS_HI}, ${BRASS_MID} 50%, ${BRASS_DK})`,
        boxShadow: '0 3px 8px rgba(20,6,60,0.32)',
      }} />

      {/* Posts */}
      {([-1, 1] as const).map(side => (
        <div key={side} style={{
          position: 'absolute',
          left: CX + side * POST_OFF, top: CY,
          width: Math.round(R * 0.11), height: postH,
          marginLeft: -Math.round(R * 0.055),
          borderRadius: Math.round(R * 0.04),
          background: `linear-gradient(90deg, ${BRASS_DK}, ${BRASS_MID} 44%, ${BRASS_HI} 52%, ${BRASS_MID} 60%, ${BRASS_DK})`,
          boxShadow: '0 6px 16px rgba(20,6,60,0.38)',
        }} />
      ))}

      {/* Globe glass body (clips slips) */}
      <div style={{
        position: 'absolute', left: CX - R, top: CY - R, width: D, height: D,
        borderRadius: '50%', overflow: 'hidden',
        background: 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.14) 0%, rgba(135,95,215,0.07) 42%, rgba(38,10,102,0.26) 100%)',
        boxShadow: 'inset 0 -20px 44px rgba(38,10,102,0.40), inset 0 12px 36px rgba(255,255,255,0.07)',
      }}>
        {ballsWithDepth.map(({ i, sp, z, sd }) => {
          if (!sp) return null;
          const scale    = 0.86 + z * 0.28;           // 0.86 (back) → 1.14 (front)
          const dimAlpha = Math.max(0, (0.5 - z) * 0.80); // darken back-facing balls
          return (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${sp.x}px), calc(-50% + ${sp.y}px)) scale(${scale.toFixed(3)})`,
              willChange: 'transform',
            }}>
              <Ball seamAngle={sd.seamAngle} dimAlpha={dimAlpha} />
            </div>
          );
        })}

        {/* Hoop baffles — same rotateX style as outer wireframe rings, inside the globe */}
        {Array.from({ length: N_BARS }, (_, b) => {
          const bAngDeg = s.drumRot + b * 90;
          return (
            <div key={b} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: D, height: D,
              marginLeft: -R, marginTop: -R,
              borderRadius: '50%',
              border: `4px solid rgba(220,213,198,0.70)`,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
              transform: `perspective(${Math.round(R * 7)}px) rotateX(${bAngDeg}deg)`,
              pointerEvents: 'none',
            }} />
          );
        })}
      </div>

      {/* 3D wireframe rings */}
      {Array.from({ length: N_RINGS }, (_, i) => {
        const ang = s.drumRot + (i * 180) / N_RINGS;
        const isLime = i === 0;
        return (
          <div key={i} style={{
            position: 'absolute', left: CX, top: CY, width: D, height: D,
            marginLeft: -R, marginTop: -R, borderRadius: '50%',
            border: isLime
              ? `2.5px solid rgba(194,238,46,0.60)`
              : `1.5px solid rgba(255,255,255,${0.12 + 0.10 * (i % 2)})`,
            transform: `perspective(${Math.round(R * 7)}px) rotateX(${ang}deg)`,
            pointerEvents: 'none', willChange: 'transform',
          }} />
        );
      })}

      {/* Glass rim + specular */}
      <div style={{
        position: 'absolute', left: CX - R, top: CY - R, width: D, height: D,
        borderRadius: '50%', pointerEvents: 'none',
        border: '2px solid rgba(255,255,255,0.26)',
        boxShadow: 'inset -8px -12px 36px rgba(255,255,255,0.12), inset 6px 8px 24px rgba(110,70,210,0.14), 0 22px 48px rgba(15,4,55,0.38)',
      }} />
      <div style={{
        position: 'absolute', left: CX - R * 0.44, top: CY - R * 0.57,
        width: R * 0.65, height: R * 0.48, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.62), transparent 70%)',
        filter: 'blur(2px)', pointerEvents: 'none',
      }} />

      {/* Drop hatch */}
      <div style={{
        position: 'absolute', left: CX, top: CY + R - 2,
        width: Math.round(R * 0.23), height: Math.round(R * 0.12),
        marginLeft: -Math.round(R * 0.115),
        transformOrigin: 'top center',
        transform: `rotate(${s.doorOpen * 72}deg)`,
        background: `linear-gradient(180deg, ${BRASS_MID}, ${BRASS_DK})`,
        borderRadius: `0 0 ${Math.round(R * 0.04)}px ${Math.round(R * 0.04)}px`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.28)',
      }} />

      {/* Crank handle */}
      <div style={{ position: 'absolute', left: pivX, top: CY, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', left: -Math.round(R * 0.06), top: -Math.round(R * 0.06),
          width: Math.round(R * 0.12), height: Math.round(R * 0.12), borderRadius: '50%',
          background: `radial-gradient(circle at 38% 32%, ${BRASS_HI}, ${BRASS_MID} 55%, ${BRASS_DK})`,
          boxShadow: '0 2px 6px rgba(20,6,60,0.45)',
        }} />
        <div style={{
          position: 'absolute', left: -Math.round(R * 0.032), top: Math.min(0, gy),
          width: Math.round(R * 0.064), height: Math.max(1, Math.abs(gy)),
          background: `linear-gradient(90deg, ${BRASS_DK}, ${BRASS_HI} 50%, ${BRASS_DK})`,
          borderRadius: Math.round(R * 0.032),
        }} />
        <div style={{
          position: 'absolute', left: -Math.round(R * 0.05), top: gy - Math.round(R * 0.05),
          width: Math.round(R * 0.10), height: Math.round(R * 0.10), borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${BRASS_HI}, ${BRASS_MID} 55%, ${BRASS_DK})`,
          boxShadow: '0 2px 4px rgba(20,6,60,0.40)',
        }} />
        <div style={{
          position: 'absolute', left: Math.round(R * 0.04), top: gy - Math.round(R * 0.044),
          width: Math.round(R * 0.22), height: Math.round(R * 0.088),
          transform: `scaleY(${gDepth})`, transformOrigin: 'left center',
          borderRadius: Math.round(R * 0.044),
          background: `radial-gradient(circle at 30% 28%, #ff6068, ${RED} 58%, #9A0E18)`,
          boxShadow: '0 3px 9px rgba(20,6,60,0.42)',
        }} />
      </div>

      {/* Wire chute — two guide rails flanking the drop path */}
      {s.dropActive && (s.phase === 'dropping' || s.phase === 'unfolding') && (
        <>
          <div style={{
            position: 'absolute',
            left: CX - (BALL_R + 5), top: CY + R - 2,
            width: 2, height: TRAY_Y - (CY + R) + 14,
            background: `linear-gradient(180deg, transparent, ${BRASS_MID} 18%, ${BRASS_MID} 80%, transparent)`,
            opacity: 0.72, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            left: CX + (BALL_R + 3), top: CY + R - 2,
            width: 2, height: TRAY_Y - (CY + R) + 14,
            background: `linear-gradient(180deg, transparent, ${BRASS_MID} 18%, ${BRASS_MID} 80%, transparent)`,
            opacity: 0.72, pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Dropping / growing ball */}
      {s.dropActive && s.phase !== 'overlay' && s.phase !== 'done' && (
        <DroppingBall
          x={s.dropX} y={s.dropY}
          unfold={s.unfold} reveal={s.reveal}
          team={drawnTeam}
        />
      )}

      {/* Hero overlay + confetti */}
      {s.phase === 'overlay' && drawnTeam && (
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          borderRadius: 'inherit',
          background: `radial-gradient(ellipse at 50% 42%, ${PURPLE} 0%, ${PURPLE_DK} 70%)`,
          opacity: s.overlayAlpha,
        }}>
          {/* Confetti particles */}
          {confettiEls}

          {/* Content (above confetti) */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '4.2rem', lineHeight: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))' }}>
              {getFlag(drawnTeam)}
            </span>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontWeight: 800, fontSize: 'clamp(1.4rem, 5vw, 1.85rem)',
              letterSpacing: '-0.02em', color: '#fff', textAlign: 'center',
              textShadow: '0 6px 24px rgba(10,2,40,0.5)', padding: '0 1rem',
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
        </div>
      )}

    </div>
  );
}
