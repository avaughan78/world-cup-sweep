'use client';

import { useCallback, useEffect, useRef } from 'react';

const G      = 0.5;   // gravity px/frame²
const BOUNCE = 0.62;  // energy kept on bounce
const AIR_F  = 0.993; // horizontal air friction per frame
const ROLL_F = 0.88;  // horizontal friction per frame when on floor
const SIZE   = 44;    // ball diameter px
const HALF   = SIZE / 2;

export default function FootballPhysics() {
  const elRef = useRef<HTMLDivElement>(null);
  const s = useRef({ x: -SIZE, y: -SIZE, vx: 0, vy: 0, rot: 0, raf: 0 });

  const startLoop = useCallback(() => {
    cancelAnimationFrame(s.current.raf);

    const tick = () => {
      const c = s.current;
      const el = elRef.current;
      if (!el) return;

      const W = window.innerWidth;
      const H = window.innerHeight;
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

      if (c.x < 0)      { c.x = 0;     c.vx =  Math.abs(c.vx) * BOUNCE; }
      if (c.x > wallR)  { c.x = wallR; c.vx = -Math.abs(c.vx) * BOUNCE; }

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
    c.x   = window.innerWidth * 0.15 + Math.random() * window.innerWidth * 0.7;
    c.y   = -SIZE;
    c.vx  = (Math.random() - 0.5) * 4;
    c.vy  = 0;
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

    window.addEventListener('football-toggle', onToggle);
    return () => {
      cancelAnimationFrame(s.current.raf);
      window.removeEventListener('football-toggle', onToggle);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLoop]);

  function kick(e: React.MouseEvent) {
    const c = s.current;
    const el = elRef.current;
    if (!el) return;
    e.stopPropagation();

    const rect = el.getBoundingClientRect();
    const cx = rect.left + HALF;
    const cy = rect.top  + HALF;
    const dx = cx - e.clientX;
    const dy = cy - e.clientY;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 16 + Math.random() * 10;

    c.vx = (dx / dist) * speed;
    c.vy = (dy / dist) * speed - speed * 0.55; // upward bias so kicks feel natural
    startLoop();
  }

  return (
    <div
      ref={elRef}
      onClick={kick}
      title="Click to kick!"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: SIZE, height: SIZE,
        fontSize: SIZE, lineHeight: 1,
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 9999,
        willChange: 'transform',
        transform: 'translate(-200px, -200px)', // off-screen until first tick
        touchAction: 'none',
      }}
    >
      ⚽
    </div>
  );
}
