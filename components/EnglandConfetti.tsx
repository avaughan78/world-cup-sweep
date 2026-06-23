'use client';

import { useEffect, useRef, useState } from 'react';

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function EnglandConfettiCanvas({ enabled }: { enabled: boolean }) {
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
      const scalar = 3;
      const flag = confetti.shapeFromText({ text: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', scalar });

      let skew = 1;

      function frame() {
        if (!active) return;
        skew = Math.max(0.8, skew - 0.001);

        confetti({
          particleCount: 1,
          startVelocity: 0,
          ticks: 400,
          origin: {
            x: Math.random(),
            y: (Math.random() * skew) - 0.2,
          },
          gravity: rand(0.4, 0.6),
          scalar,
          drift: rand(-0.4, 0.4),
          shapes: [flag],
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

export default function EnglandConfetti({ initialEnabled }: { initialEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled ?? false);

  // Poll every 5 seconds so toggling in admin is reflected without page reload
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/api/confetti', { cache: 'no-store' });
        if (!cancelled) {
          const data = await res.json() as { enabled?: boolean };
          setEnabled(data.enabled ?? false);
        }
      } catch { /* ignore */ }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return <EnglandConfettiCanvas enabled={enabled} />;
}
