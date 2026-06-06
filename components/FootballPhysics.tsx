'use client';

import { useCallback, useEffect, useRef } from 'react';

const G      = 0.5;
const BOUNCE = 0.62;
const AIR_F  = 0.993;
const ROLL_F = 0.88;
const SIZE   = 44;
const HALF   = SIZE / 2;
const MAX_V  = 28;       // px/frame cap so it can't escape the screen
const TRAIL  = 5;        // number of pointer samples to average for throw velocity

export default function FootballPhysics() {
  const elRef    = useRef<HTMLDivElement>(null);
  const s        = useRef({ x: -SIZE, y: -SIZE, vx: 0, vy: 0, rot: 0, raf: 0 });
  const dragging   = useRef(false);
  const trail      = useRef<{ x: number; y: number; t: number }[]>([]);
  const dragStart  = useRef({ x: 0, y: 0, t: 0 });

  const startLoop = useCallback(() => {
    cancelAnimationFrame(s.current.raf);

    const tick = () => {
      const c = s.current;
      const el = elRef.current;
      if (!el || dragging.current) return;

      const W      = window.innerWidth;
      const H      = window.innerHeight;
      const floorY = H - SIZE;
      const wallR  = W - SIZE;

      c.vy += G;
      c.x  += c.vx;
      c.y  += c.vy;
      c.rot += c.vx * 2;

      if (c.y >= floorY) {
        c.y  = floorY;
        c.vy = Math.abs(c.vy) < 1.5 ? 0 : -c.vy * BOUNCE;
        c.vx *= ROLL_F;
      } else {
        c.vx *= AIR_F;
      }

      if (c.x < 0)     { c.x = 0;     c.vx =  Math.abs(c.vx) * BOUNCE; }
      if (c.x > wallR) { c.x = wallR; c.vx = -Math.abs(c.vx) * BOUNCE; }

      if (Math.abs(c.vx) < 0.05) c.vx = 0;

      el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;

      if (c.vx !== 0 || c.vy !== 0) {
        c.raf = requestAnimationFrame(tick);
      }
    };

    s.current.raf = requestAnimationFrame(tick);
  }, []);

  function drop() {
    const c = s.current;
    const fromLeft = Math.random() < 0.5;
    c.x   = fromLeft ? -SIZE : window.innerWidth;
    c.y   = window.innerHeight * (0.05 + Math.random() * 0.2);
    c.vx  = fromLeft ? 7 + Math.random() * 5 : -(7 + Math.random() * 5);
    c.vy  = 3 + Math.random() * 3;
    c.rot = 0;
    startLoop();
  }

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const visible = localStorage.getItem('football-visible') !== 'false';
    if (!visible) {
      el.style.display = 'none';
    } else {
      drop();
    }

    const onToggle = (e: Event) => {
      const show = (e as CustomEvent<boolean>).detail;
      el.style.display = show ? '' : 'none';
      if (show) drop();
      else cancelAnimationFrame(s.current.raf);
    };

    // Safety net: if pointer capture is lost (iOS scroll cancels the gesture,
    // or setPointerCapture threw), make sure physics always restarts.
    const recover = () => {
      if (dragging.current) {
        dragging.current = false;
        s.current.vx = 0;
        s.current.vy = 0;
        startLoop();
      }
    };

    window.addEventListener('football-toggle', onToggle);
    window.addEventListener('pointerup',     recover);
    window.addEventListener('pointercancel', recover);
    return () => {
      cancelAnimationFrame(s.current.raf);
      window.removeEventListener('football-toggle', onToggle);
      window.removeEventListener('pointerup',     recover);
      window.removeEventListener('pointercancel', recover);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLoop]);

  function onPointerDown(e: React.PointerEvent) {
    const el = elRef.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();

    cancelAnimationFrame(s.current.raf);
    dragging.current = true;
    trail.current = [];

    try { el.setPointerCapture(e.pointerId); } catch { /* not supported on all iOS versions */ }

    const c = s.current;
    c.x = e.clientX - HALF;
    c.y = e.clientY - HALF;
    dragStart.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    trail.current.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });

    el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    e.preventDefault();

    const c  = s.current;
    const el = elRef.current;
    if (!el) return;

    c.x = e.clientX - HALF;
    c.y = e.clientY - HALF;

    trail.current.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (trail.current.length > TRAIL) trail.current.shift();

    el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    e.preventDefault();
    dragging.current = false;

    const c = s.current;
    const t = trail.current;
    const elapsed  = e.timeStamp - dragStart.current.t;
    const dragDist = Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    const isTap    = elapsed < 220 && dragDist < 18;

    if (!isTap && t.length >= 2) {
      // Throw: velocity from pointer trail
      const oldest = t[0];
      const newest = t[t.length - 1];
      const dt = (newest.t - oldest.t) || 1;
      let vx = ((newest.x - oldest.x) / dt) * 16;
      let vy = ((newest.y - oldest.y) / dt) * 16;
      const mag = Math.hypot(vx, vy);
      if (mag > MAX_V) { vx = vx / mag * MAX_V; vy = vy / mag * MAX_V; }
      c.vx = vx;
      c.vy = vy;
    } else {
      // Click/tap: flick away from the touch point
      const el = elRef.current;
      if (el) {
        const rect  = el.getBoundingClientRect();
        const dx    = rect.left + HALF - e.clientX;
        const dy    = rect.top  + HALF - e.clientY;
        const dist  = Math.hypot(dx, dy) || 1;
        const speed = 16 + Math.random() * 10;
        c.vx = (dx / dist) * speed;
        c.vy = (dy / dist) * speed - speed * 0.55;
      } else {
        c.vx = (Math.random() < 0.5 ? 1 : -1) * (12 + Math.random() * 8);
        c.vy = -(10 + Math.random() * 6);
      }
    }

    startLoop();
  }

  function onPointerCancel() {
    if (!dragging.current) return;
    dragging.current = false;
    s.current.vx = 0;
    s.current.vy = 0;
    startLoop();
  }

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      title="Grab and throw!"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: SIZE, height: SIZE,
        fontSize: SIZE, lineHeight: 1,
        cursor: 'grab',
        userSelect: 'none',
        zIndex: 9999,
        willChange: 'transform',
        transform: 'translate(-200px, -200px)',
        touchAction: 'none',
      }}
    >
      ⚽
    </div>
  );
}
