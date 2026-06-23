'use client';

import { useEffect, useRef } from 'react';

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function EnglandConfetti({ enabled }: { enabled: boolean }) {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      // Let existing particles finish falling naturally
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

        // Gradually skew origin downward as time goes on (matches canvas-confetti snow example)
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
