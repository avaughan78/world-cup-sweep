'use client';

import { useEffect, useState } from 'react';
import type { Highlight } from '@/lib/db';

const BRAND_STRIPE = 'linear-gradient(to right, #4D10C8, #D40100, #9DC417)';
const LIKED_KEY = 'highlight_likes';

function getLikedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveLikedIds(ids: Set<number>) {
  try { localStorage.setItem(LIKED_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
}

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  // Convert Google Drive share/view URLs to a direct thumbnail URL
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1280`;
  return url;
}

function toYouTubeEmbed(url: string): string | null {
  const ID = '[a-zA-Z0-9_-]{11}';
  const patterns = [
    new RegExp(`[?&]v=(${ID})`),           // watch?v=
    new RegExp(`youtu\\.be\\/(${ID})`),    // youtu.be/
    new RegExp(`\\/shorts\\/(${ID})`),     // /shorts/
    new RegExp(`\\/live\\/(${ID})`),       // /live/
    new RegExp(`\\/embed\\/(${ID})`),      // already an embed URL
    new RegExp(`\\/v\\/(${ID})`),          // /v/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  }
  return null;
}

function isYouTube(url: string | null) {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const embedUrl = toYouTubeEmbed(url);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden"
        style={{ background: '#000' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Branded stripe */}
        <div style={{ height: '4px', background: BRAND_STRIPE }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center rounded-full text-white text-sm font-bold"
          style={{ width: '2rem', height: '2rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          ✕
        </button>

        {embedUrl ? (
          <div style={{ aspectRatio: '16/9' }}>
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-white text-sm">
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#9DC417' }}>
              Open video ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightCard({ h, liked, onLike, onVideoClick }: {
  h: Highlight;
  liked: boolean;
  onLike: (id: number) => void;
  onVideoClick: (h: Highlight) => void;
}) {
  const isVideo = h.type === 'video';
  const resolvedImage = resolveImageUrl(h.image_url);
  const hasThumb = !!resolvedImage;

  function handleClick(e: React.MouseEvent) {
    if (isVideo) {
      e.preventDefault();
      onVideoClick(h);
    }
  }

  const cardClass = "rounded-xl overflow-hidden flex flex-col transition-opacity hover:opacity-90";
  const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', textDecoration: 'none' };

  const contents = (
    <>
      <div style={{ height: '4px', background: BRAND_STRIPE, flexShrink: 0 }} />
      {hasThumb && (
        <div className="relative w-full" style={{ aspectRatio: '16/9', background: 'var(--bg)', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedImage!} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-center rounded-full" style={{ width: '3rem', height: '3rem', background: 'rgba(0,0,0,0.7)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M4 2l10 6-10 6V2z" /></svg>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: isVideo ? '#fef2f2' : '#eff6ff', color: isVideo ? '#b91c1c' : '#1d4ed8', border: `1px solid ${isVideo ? '#fecaca' : '#bfdbfe'}` }}>
            {isVideo ? '🎬 Video' : '📰 Article'}
          </span>
          {isYouTube(h.url) && <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>YouTube</span>}
        </div>
        <p className="font-bold leading-snug" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{h.title}</p>
        {h.description && <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>{h.description}</p>}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          {h.source ? <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h.source}</span> : <span />}
          <div className="flex items-center gap-3">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onLike(h.id); }}
              title={liked ? 'Unlike' : 'Like this'}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity"
              style={{ color: liked ? '#4D10C8' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#4D10C8' : 'none'} stroke={liked ? '#4D10C8' : 'currentColor'} strokeWidth="1.5">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              {h.likes_count > 0 && <span>{h.likes_count}</span>}
            </button>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
      </div>
    </>
  );

  if (h.url) {
    return <a href={h.url} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={cardClass} style={cardStyle}>{contents}</a>;
  }
  return <div className={cardClass} style={cardStyle}>{contents}</div>;
}

export default function HighlightsView() {
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [activeVideo, setActiveVideo] = useState<Highlight | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLikedIds(getLikedIds());
  }, []);

  useEffect(() => {
    fetch('/api/highlights')
      .then(r => r.json())
      .then((d: { highlights?: Highlight[] }) => setHighlights(d.highlights ?? []))
      .catch(() => setHighlights([]));
  }, []);

  async function handleLike(id: number) {
    const isLiked = likedIds.has(id);
    const newLiked = new Set(likedIds);
    if (isLiked) { newLiked.delete(id); } else { newLiked.add(id); }
    setLikedIds(newLiked);
    saveLikedIds(newLiked);
    setHighlights(prev => prev?.map(h => h.id === id ? { ...h, likes_count: h.likes_count + (isLiked ? -1 : 1) } : h) ?? prev);
    await fetch(`/api/highlights/${id}/like`, { method: isLiked ? 'DELETE' : 'POST' }).catch(() => {});
  }

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
    <>
      {activeVideo?.url && (
        <VideoModal
          url={activeVideo.url}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
      <p className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Highlights from the competition
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights.map(h => (
          <HighlightCard key={h.id} h={h} liked={likedIds.has(h.id)} onLike={handleLike} onVideoClick={setActiveVideo} />
        ))}
      </div>
    </>
  );
}
