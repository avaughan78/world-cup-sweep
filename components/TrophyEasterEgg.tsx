'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function TrophyEasterEgg() {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    if (showModal) videoRef.current?.play().catch(() => {});
  }, [showModal]);

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
          style={{ background: 'rgba(8,8,6,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              maxHeight: '92vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              ✕
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>
                🐐 Easter Egg
              </p>
              <p className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                100 World Cup Goals
              </p>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            {/* Video */}
            <video
              ref={videoRef}
              src="/world-cup-goals.mp4"
              controls
              style={{ display: 'block', width: '100%', background: '#000' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
