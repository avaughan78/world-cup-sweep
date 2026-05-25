'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const COUNTDOWN_START = 3;

export default function TrophyEasterEgg() {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(COUNTDOWN_START);
  const lastClosedRef = useRef(0);

  function startTimer() {
    if (Date.now() - lastClosedRef.current < 1000) return;
    countRef.current = COUNTDOWN_START;
    setCountdown(COUNTDOWN_START);
    intervalRef.current = setInterval(() => {
      countRef.current -= 1;
      if (countRef.current <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setCountdown(null);
        setShowModal(true);
      } else {
        setCountdown(countRef.current);
      }
    }, 1000);
  }

  function cancelTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCountdown(null);
  }

  function closeModal() {
    lastClosedRef.current = Date.now();
    setShowModal(false);
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
        style={{ cursor: 'default', flexShrink: 0, WebkitUserSelect: 'none', userSelect: 'none', position: 'relative' }}
      >
        <Image
          src="/world-cup-trophy.png"
          alt="FIFA World Cup Trophy"
          width={56}
          height={72}
          style={{ objectFit: 'contain' }}
        />
        {countdown !== null && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: '1.5rem',
              lineHeight: 1,
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}>
              {countdown}
            </span>
          </div>
        )}
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
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src="https://drive.google.com/file/d/1_QXaiu8Uac8g2S_c8FxALsp96zxVbPF8/preview?autoplay=1"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
