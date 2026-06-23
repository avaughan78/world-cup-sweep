'use client';

import { useEffect, useRef, useState } from 'react';

// St George's Cross path on a 60×40 viewBox
const CROSS_PATH =
  'M24 0 L36 0 L36 14 L60 14 L60 26 L36 26 L36 40 L24 40 L24 26 L0 26 L0 14 L24 14 Z';

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function EnglandSnow({ enabled }: { enabled: boolean }) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }

    let active = true;

    import('canvas-confetti').then((mod) => {
      if (!active) return;

      const confetti = mod.default;

      // Use main-thread rendering so shapeFromPath custom shapes work
      // (the default export uses useWorker:true, which can't serialise Path2D)
      const fire = confetti.create(null as unknown as HTMLCanvasElement, { resize: true, useWorker: false });

      // Red St George's Cross — same shape as the England flag cross
      const cross = confetti.shapeFromPath({ path: CROSS_PATH });

      let skew = 1;

      function frame() {
        if (!active) return;

        skew = Math.max(0.8, skew - 0.001);

        fire({
          particleCount: 1,
          startVelocity: 0,
          ticks: 400,
          origin: {
            x: Math.random(),
            y: (Math.random() * skew) - 0.2,
          },
          colors: ['#CC0000', '#ffffff'],
          shapes: [cross, 'square'],
          gravity: rand(0.4, 0.6),
          scalar: rand(1.5, 2.5),
          drift: rand(-0.4, 0.4),
          zIndex: 9999,
        });

        rafRef.current = requestAnimationFrame(frame);
      }

      rafRef.current = requestAnimationFrame(frame);
    });

    return () => {
      active = false;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [enabled]);

  return null;
}

export default function EnglandConfetti() {
  const [enabled, setEnabled] = useState(false);

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

  return <EnglandSnow enabled={enabled} />;
}
