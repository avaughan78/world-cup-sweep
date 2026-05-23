'use client';

import { useEffect, useState } from 'react';
import { getFlag } from '@/lib/flags';
import { getWCHistory } from '@/lib/wc-history';

interface TeamInfo {
  team: string;
  capital: string | null;
  population: number | null;
  area: number | null;
  currencies: string[];
  languages: string[];
  wikiImage: string | null;
  wikiExtract: string | null;
  squad: Array<{ name: string; position: string; shirtNumber: number | null }>;
}

function fmtPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return `${(n / 1e3).toFixed(0)}K`;
}

function fmtArea(n: number): string {
  return n.toLocaleString('en') + ' km²';
}

const POS_ORDER = ['Goalkeeper', 'Defence', 'Midfield', 'Offence'];
const POS_LABEL: Record<string, string> = {
  Goalkeeper: 'GK',
  Defence: 'DEF',
  Midfield: 'MID',
  Offence: 'FWD',
};

interface Stat { label: string; value: string }

const BLURB_LIMIT = 400;

function AboutBlurb({ title, text }: { title: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = text.length > BLURB_LIMIT;
  const displayed = !expanded && needsTrunc ? text.slice(0, BLURB_LIMIT).trimEnd() : text;

  return (
    <>
      <hr style={{ borderColor: 'var(--border)' }} />
      <div>
        <p className="font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
          About {title}
        </p>
        <p className="leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {displayed}
          {!expanded && needsTrunc && (
            <>
              {'… '}
              <button
                onClick={() => setExpanded(true)}
                className="font-semibold"
                style={{ color: 'var(--green)', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                more
              </button>
            </>
          )}
        </p>
      </div>
    </>
  );
}

export default function TeamModal({ team, participant, onClose }: {
  team: string;
  participant: string | null;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setInfo(null);
    setImgError(false);
    fetch(`/api/team-info?team=${encodeURIComponent(team)}`)
      .then(r => r.json())
      .then((d: TeamInfo) => { setInfo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [team]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const flag = getFlag(team);
  const wcHistory = getWCHistory(team);

  const stats: Stat[] = [
    info?.capital ? { label: 'Capital', value: info.capital } : null,
    info?.population ? { label: 'Population', value: fmtPop(info.population) } : null,
    info?.area ? { label: 'Area', value: fmtArea(info.area) } : null,
    info?.currencies[0] ? { label: 'Currency', value: info.currencies[0] } : null,
  ].filter((s): s is Stat => s !== null);

  const byPos: Record<string, Array<{ name: string; shirtNumber: number | null }>> = {};
  for (const p of info?.squad ?? []) {
    if (!byPos[p.position]) byPos[p.position] = [];
    byPos[p.position].push({ name: p.name, shirtNumber: p.shirtNumber });
  }
  const hasSquad = Object.keys(byPos).length > 0;

  const showImage = !imgError && !!info?.wikiImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,8,6,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
          maxHeight: '92vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm transition-opacity hover:opacity-80"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          ✕
        </button>

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{
            height: 320,
            background: 'linear-gradient(160deg, #0c1e14 0%, #1a3a28 50%, #0f2027 100%)',
          }}
        >
          {showImage && (
            <img
              src={info!.wikiImage!}
              alt={info?.capital ?? team}
              onError={() => setImgError(true)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
              }}
            />
          )}

          {/* gradient overlays */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.12) 100%)',
          }} />
          {/* subtle vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
          }} />

          {/* text over hero */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7">
            <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '0.5rem' }}>{flag}</div>
            <h2
              className="font-black leading-none tracking-tight"
              style={{ color: '#fff', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
            >
              {team}
            </h2>
            {participant && (
              <p
                className="mt-2 font-semibold"
                style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.2rem' }}
              >
                {participant}
              </p>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-4 sm:p-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-5xl animate-spin" style={{ animationDuration: '1.2s' }}>⚽</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
            </div>
          ) : (
            <div className="space-y-7">

              {/* Stat cards */}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {stats.map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    >
                      <p
                        className="font-bold uppercase tracking-widest"
                        style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}
                      >
                        {label}
                      </p>
                      <p
                        className="font-black leading-tight mt-1"
                        style={{ color: 'var(--text-primary)', fontSize: '1.5rem' }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* World Cup history */}
              {wcHistory && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <p className="font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                    World Cup History
                  </p>
                  <div className="flex items-start gap-4 flex-wrap">
                    {wcHistory.titles > 0 && (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '1.8rem' }}>🏆</span>
                        <div>
                          <p className="font-black leading-none" style={{ color: 'var(--text-primary)', fontSize: '1.8rem' }}>
                            {wcHistory.titles}×
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {wcHistory.titles === 1 ? 'Title' : 'Titles'}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {wcHistory.debut ? (
                        <p className="font-bold" style={{ color: 'var(--green)', fontSize: '0.95rem' }}>
                          ⭐ First World Cup appearance
                        </p>
                      ) : (
                        <>
                          <p className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {wcHistory.best}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                            {wcHistory.appearances} appearance{wcHistory.appearances !== 1 ? 's' : ''} (through 2022)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {(wcHistory.legends?.length || wcHistory.note) && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {wcHistory.legends && wcHistory.legends.length > 0 && (
                        <p className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ fontWeight: 700 }}>Famous for: </span>
                          {wcHistory.legends.join(' · ')}
                        </p>
                      )}
                      {wcHistory.note && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {wcHistory.note}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Languages */}
              {(info?.languages ?? []).length > 0 && (
                <div>
                  <p
                    className="font-bold uppercase tracking-widest mb-2"
                    style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}
                  >
                    Languages
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {info!.languages.slice(0, 6).map(lang => (
                      <span
                        key={String(lang)}
                        className="font-medium rounded-full px-3 py-1"
                        style={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {String(lang)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              {info?.wikiExtract && (
                <AboutBlurb title={info.capital ?? team} text={info.wikiExtract} />
              )}

              {/* Squad */}
              <>
                <hr style={{ borderColor: 'var(--border)' }} />
                <div>
                  <p
                    className="font-bold uppercase tracking-widest mb-4"
                    style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}
                  >
                    Squad
                  </p>
                  {hasSquad ? (
                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-5">
                      {POS_ORDER.filter(pos => byPos[pos]?.length).map(pos => (
                        <div key={pos}>
                          <p
                            className="font-black uppercase tracking-widest mb-2"
                            style={{ color: 'var(--green)', fontSize: '0.7rem' }}
                          >
                            {POS_LABEL[pos]}
                          </p>
                          <div className="space-y-1.5">
                            {byPos[pos].map(p => (
                              <div key={p.name} className="flex items-center gap-2">
                                {p.shirtNumber !== null && (
                                  <span
                                    className="font-mono text-right flex-shrink-0"
                                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem', width: '1.5rem' }}
                                  >
                                    {p.shirtNumber}
                                  </span>
                                )}
                                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {p.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      Squad not yet announced
                    </p>
                  )}
                </div>
              </>

              {!info && (
                <p className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Could not load country information.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
