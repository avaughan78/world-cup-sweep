'use client';

import { useState, useRef } from 'react';
import Flag from './Flag';
import { parseVideoUrl } from '@/lib/parse-video-url';

export default function PrizeVideoModal({
  name,
  team,
  videoUrl,
  prizeName,
}: {
  name: string;
  team: string;
  videoUrl: string;
  prizeName: string;
}) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { type, embedSrc } = parseVideoUrl(videoUrl);

  function close() {
    setOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}
        title="Watch the moment"
      >
        {name}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,6,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={close}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 pt-5 pb-5 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, #4D10C8 0%, #D40100 100%)' }}
            >
              <button
                onClick={close}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                ✕
              </button>
              <Flag team={team} height="2.5rem" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {prizeName}
                </p>
                <h2 className="text-2xl font-black tracking-tight leading-tight" style={{ color: '#fff' }}>
                  {name}
                </h2>
              </div>
            </div>

            {/* Video */}
            <div style={{ background: '#000', aspectRatio: '16/9', width: '100%' }}>
              {type === 'direct' ? (
                <video
                  ref={videoRef}
                  src={embedSrc}
                  autoPlay
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
          </div>
        </div>
      )}
    </>
  );
}
