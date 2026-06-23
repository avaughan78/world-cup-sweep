'use client';

import { useEffect, useRef, useState } from 'react';

const STYLE = `
  @keyframes engFall {
    from { transform: translateY(0);      opacity: 1; }
    90%  {                                opacity: 1; }
    to   { transform: translateY(110vh); opacity: 0; }
  }
  @keyframes engSway {
    0%   { transform: translateX(0)          rotate(calc(-1 * var(--tilt))); }
    50%  { transform: translateX(var(--sw))  rotate(var(--tilt)); }
    100% { transform: translateX(0)          rotate(calc(-1 * var(--tilt))); }
  }
`;

function makeFlagSVG(size: number) {
  const h = Math.round(size * 0.667);
  return `<svg viewBox="0 0 60 40" width="${size}" height="${h}" style="display:block;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.2)"><rect width="60" height="40" fill="#fff"/><rect x="24" y="0" width="12" height="40" fill="#CC0000"/><rect x="0" y="14" width="60" height="12" fill="#CC0000"/></svg>`;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

export default function EnglandConfetti() {
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll /api/confetti every 5 s
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const r = await fetch('/api/confetti', { cache: 'no-store' });
        const d = await r.json() as { enabled?: boolean };
        if (!cancelled) setEnabled(d.enabled ?? false);
      } catch { /* ignore */ }
    }
    check();
    const t = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Spawn flags while enabled
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!enabled) {
      if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null; }
      // clear any remaining flags immediately
      container.innerHTML = '';
      return;
    }

    function spawn() {
      if (!container) return;
      const size  = Math.round(rand(14, 26));
      const left  = rand(0, 95);
      const fall  = rand(4, 8);
      const sw    = Math.round(rand(20, 50));
      const tilt  = Math.round(rand(10, 20));
      const swDur = rand(fall * 0.25, fall * 0.4);

      const outer = document.createElement('div');
      outer.style.cssText = `position:absolute;left:${left}%;top:-50px;animation:engFall ${fall}s linear forwards`;

      const inner = document.createElement('div');
      inner.style.cssText = `animation:engSway ${swDur}s ease-in-out infinite;--sw:${sw}px;--tilt:${tilt}deg`;
      inner.innerHTML = makeFlagSVG(size);

      outer.appendChild(inner);
      container.appendChild(outer);
      setTimeout(() => outer.remove(), (fall + 0.5) * 1000);
    }

    // Seed a burst so screen isn't empty for the first few seconds
    for (let i = 0; i < 10; i++) setTimeout(spawn, i * 80);

    spawnRef.current = setInterval(spawn, 180);
    return () => {
      if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null; }
    };
  }, [enabled]);

  return (
    <>
      <style>{STYLE}</style>
      <div
        ref={containerRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}
      />
    </>
  );
}
