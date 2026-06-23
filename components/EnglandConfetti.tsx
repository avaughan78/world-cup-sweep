'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  sway: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function EnglandConfetti({ enabled }: { enabled: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!enabled) { setParticles([]); return; }
    setParticles(Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: rand(0, 96),
      delay: rand(0, 15),
      duration: rand(3, 6),
      size: Math.round(rand(12, 22)),
      sway: Math.round(rand(18, 45)),
    })));
  }, [enabled]);

  if (!enabled || particles.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        @keyframes englandFall {
          0%   { transform: translateY(-80px); opacity: 0; }
          5%   { opacity: 1; }
          93%  { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes englandFlutter {
          0%   { transform: translateX(0px)                            rotate(-14deg); }
          12%  { transform: translateX(calc(0.8 * var(--sway)))        rotate(11deg); }
          25%  { transform: translateX(var(--sway))                    rotate(-9deg); }
          37%  { transform: translateX(calc(0.3 * var(--sway)))        rotate(17deg); }
          50%  { transform: translateX(calc(-0.5 * var(--sway)))       rotate(-13deg); }
          62%  { transform: translateX(calc(-1 * var(--sway)))         rotate(9deg); }
          75%  { transform: translateX(calc(-0.4 * var(--sway)))       rotate(-17deg); }
          87%  { transform: translateX(calc(0.6 * var(--sway)))        rotate(7deg); }
          100% { transform: translateX(0px)                            rotate(-14deg); }
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
            animation: `englandFlutter ${p.duration * 0.28}s ${p.delay}s infinite ease-in-out`,
            ['--sway' as string]: `${p.sway}px`,
          }}>
            <svg
              viewBox="0 0 60 40"
              width={p.size}
              height={Math.round(p.size * 0.667)}
              style={{ display: 'block', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
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
