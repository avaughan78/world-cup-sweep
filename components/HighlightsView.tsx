'use client';

import { useEffect, useState } from 'react';
import type { Highlight } from '@/lib/db';

function isYouTube(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function HighlightCard({ h }: { h: Highlight }) {
  const isVideo = h.type === 'video';
  const hasThumb = !!h.image_url;

  return (
    <a
      href={h.url}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl overflow-hidden flex flex-col transition-opacity hover:opacity-90"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none' }}
    >
      {/* Thumbnail */}
      {hasThumb && (
        <div className="relative w-full" style={{ aspectRatio: '16/9', background: 'var(--bg)', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={h.image_url!}
            alt={h.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {isVideo && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: '3rem', height: '3rem', background: 'rgba(0,0,0,0.7)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
            style={{
              background: isVideo ? '#fef2f2' : '#eff6ff',
              color: isVideo ? '#b91c1c' : '#1d4ed8',
              border: `1px solid ${isVideo ? '#fecaca' : '#bfdbfe'}`,
            }}
          >
            {isVideo ? '🎬 Video' : '📰 Article'}
          </span>
          {isYouTube(h.url) && (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>YouTube</span>
          )}
        </div>

        {/* Title */}
        <p className="font-bold leading-snug" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          {h.title}
        </p>

        {/* Description */}
        {h.description && (
          <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
            {h.description}
          </p>
        )}

        {/* Source + date footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {h.source ? (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h.source}</span>
          ) : (
            <span />
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date(h.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </a>
  );
}

export default function HighlightsView() {
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);

  useEffect(() => {
    fetch('/api/highlights')
      .then(r => r.json())
      .then((d: { highlights?: Highlight[] }) => setHighlights(d.highlights ?? []))
      .catch(() => setHighlights([]));
  }, []);

  if (highlights === null) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        No highlights yet — check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {highlights.map(h => <HighlightCard key={h.id} h={h} />)}
    </div>
  );
}
