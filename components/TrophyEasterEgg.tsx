'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function TrophyEasterEgg() {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startTimer() {
    timerRef.current = setTimeout(() => setShowModal(true), 5000);
  }

  function cancelTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function closeModal() {
    setShowModal(false);
    cancelTimer();
  }

  useEffect(() => () => cancelTimer(), []);

  return (
    <>
      <div
        onMouseEnter={startTimer}
        onMouseLeave={cancelTimer}
        onTouchStart={startTimer}
        onTouchEnd={cancelTimer}
        onTouchCancel={cancelTimer}
        style={{ cursor: 'default', flexShrink: 0, WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <Image
          src="/world-cup-trophy.png"
          alt="FIFA World Cup Trophy"
          width={56}
          height={72}
          style={{ objectFit: 'contain' }}
        />
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={closeModal}
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl w-full"
            style={{ maxWidth: '680px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ background: '#111' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>
                  🐐 Easter Egg
                </p>
                <p className="text-sm font-bold" style={{ color: '#fff' }}>
                  Pelé · Wonder Goals
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-xl leading-none"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                ✕
              </button>
            </div>

            {/* Video */}
            <video
              src="/pele-wonder-goals.mp4"
              autoPlay
              controls
              style={{ display: 'block', width: '100%', background: '#000' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
