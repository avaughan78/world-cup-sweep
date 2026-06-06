'use client';

import { useState, useRef, useEffect } from 'react';
import { parseVideoUrl } from '@/lib/parse-video-url';

const COUNTDOWN_START = 3;

export default function VideoEasterEgg({
  icon,
  label,
  modalTitle,
  videoSrc,
  fontSize = '0.85rem',
}: {
  icon: string;
  label: string;
  modalTitle?: string;
  videoSrc: string;
  fontSize?: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(COUNTDOWN_START);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastClosedRef = useRef(0);

  function startTimer() {
    if (intervalRef.current) return;
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
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  useEffect(() => () => cancelTimer(), []);

  return (
    <>
      <span
        onMouseEnter={startTimer}
        onMouseLeave={cancelTimer}
        onTouchStart={startTimer}
        onTouchEnd={cancelTimer}
        onTouchCancel={cancelTimer}
        style={{ position: 'relative', display: 'inline-block', fontSize, lineHeight: 1, flexShrink: 0, cursor: 'default', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {icon}
        {countdown !== null && (
          <span style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: '0.75rem',
            lineHeight: 1,
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
          }}>
            {countdown}
          </span>
        )}
      </span>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,6,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              ✕
            </button>

            <div className="px-4 pt-3 pb-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#f59e0b' }}>
                {icon} Easter Egg
              </p>
              <p className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {modalTitle ?? label}
              </p>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            {(() => {
              const { type, embedSrc } = parseVideoUrl(videoSrc, { muted: true });
              return (
                <div style={{ background: '#000', aspectRatio: '16/9', width: '100%' }}>
                  {type === 'direct' ? (
                    <video
                      ref={videoRef}
                      src={embedSrc}
                      autoPlay
                      muted
                      controls
                      playsInline
                      style={{ width: '100%', height: '100%', display: 'block' }}
                    />
                  ) : (
                    <iframe
                      src={embedSrc}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
