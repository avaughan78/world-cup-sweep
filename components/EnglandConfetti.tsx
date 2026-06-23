'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  sway: number;
  tilt: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function EnglandConfetti({ enabled }: { enabled: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!enabled) { setParticles([]); return; }
    setParticles(Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: rand(0, 96),
      delay: rand(0, 12),
      duration: rand(6, 10),
      size: Math.round(rand(14, 26)),
      sway: Math.round(rand(20, 50)),
      tilt: Math.round(rand(8, 18)),
    })));
  }, [enabled]);

  if (!enabled || particles.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        @keyframes englandFall {
          0%   { transform: translateY(-60px); opacity: 0; }
          8%   { opacity: 0.95; }
          92%  { opacity: 0.95; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes englandDrift {
          0%   { transform: translateX(0px)              rotate(calc(-1 * var(--eng-tilt))); }
          25%  { transform: translateX(var(--eng-sway))  rotate(var(--eng-tilt)); }
          50%  { transform: translateX(0px)              rotate(calc(-0.5 * var(--eng-tilt))); }
          75%  { transform: translateX(calc(-1 * var(--eng-sway))) rotate(var(--eng-tilt)); }
          100% { transform: translateX(0px)              rotate(calc(-1 * var(--eng-tilt))); }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            animation: `englandFall ${p.duration}s ${p.delay}s infinite linear`,
          }}
        >
          <div style={{
            animation: `englandDrift ${p.duration * 0.5}s ${p.delay}s infinite ease-in-out`,
            ['--eng-sway' as string]: `${p.sway}px`,
            ['--eng-tilt' as string]: `${p.tilt}deg`,
          }}>
            <svg
              viewBox="0 0 60 40"
              width={p.size}
              height={Math.round(p.size * 0.667)}
              style={{ display: 'block', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
            >
              <rect width="60" height="40" fill="#fff" />
              <rect x="24" y="0" width="12" height="40" fill="#CC0000" />
              <rect x="0" y="14" width="60" height="12" fill="#CC0000" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
