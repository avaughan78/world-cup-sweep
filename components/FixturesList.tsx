'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import Flag from './Flag';

const STAGE_LABEL: Record<string, string> = {
  GROUP_STAGE: 'Group Stage',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  THIRD_PLACE: 'Third Place',
  FINAL: 'Final',
};

function groupLabel(group: string | null): string {
  if (!group) return '';
  return group.replace('GROUP_', 'Group ');
}

function stageLabel(stage: string, group: string | null): string {
  const grp = groupLabel(group);
  return grp || STAGE_LABEL[stage] || stage;
}

function formatDateHeader(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function formatKickoff(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

function dateKey(utcDate: string): string {
  return utcDate.slice(0, 10);
}

type ViewFilter = 'all' | 'results' | 'upcoming';

export default function FixturesList({ participantMap }: { participantMap: Record<string, string | null> }) {
  const [fixtures, setFixtures] = useState<MatchFixture[] | null>(null);
  const [filter, setFilter] = useState<ViewFilter>('all');

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch('/api/fixtures')
        .then(r => r.json())
        .then((d: { fixtures?: MatchFixture[] }) => {
          if (!cancelled) setFixtures(d.fixtures ?? []);
        })
        .catch(() => { if (!cancelled) setFixtures([]); });
    }

    load();

    const id = setInterval(() => {
      setFixtures(prev => {
        const hasLive = prev?.some(m => m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED');
        if (hasLive) load();
        return prev;
      });
    }, 60_000);

    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (fixtures === null) {
    return (
      <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
        <span className="text-3xl animate-spin" style={{ animationDuration: '1.2s' }}>⚽</span>
        <span style={{ fontSize: '0.9rem' }}>Loading fixtures…</span>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Fixtures not available yet
      </div>
    );
  }

  const filtered = fixtures.filter(m => {
    if (filter === 'results') return m.status === 'FINISHED';
    if (filter === 'upcoming') return m.status !== 'FINISHED';
    return true;
  });

  // Group by date
  const byDate = new Map<string, MatchFixture[]>();
  for (const m of filtered) {
    const k = dateKey(m.utcDate);
    const arr = byDate.get(k) ?? [];
    arr.push(m);
    byDate.set(k, arr);
  }

  const filterBtn = (v: ViewFilter, label: string) => (
    <button
      onClick={() => setFilter(v)}
      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-colors"
      style={{
        background: filter === v ? 'var(--green)' : 'var(--card)',
        color: filter === v ? '#000' : 'var(--text-muted)',
        border: '1px solid var(--border)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex gap-2">
        {filterBtn('all', 'All')}
        {filterBtn('results', 'Results')}
        {filterBtn('upcoming', 'Upcoming')}
      </div>

      {[...byDate.entries()].map(([dateK, matches]) => (
        <div key={dateK}>
          {/* Date header */}
          <p
            className="font-black uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}
          >
            {formatDateHeader(matches[0].utcDate)}
          </p>

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {matches.map((m, i) => {
              const finished = m.status === 'FINISHED';
              const live = m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED';
              const isLast = i === matches.length - 1;
              const homeParticipant = participantMap[m.homeTeam] ?? null;
              const awayParticipant = participantMap[m.awayTeam] ?? null;

              return (
                <div
                  key={m.id}
                  className="px-4 py-3"
                  style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    {/* Home team */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 justify-end">
                      {homeParticipant && (
                        <span
                          className="hidden sm:block truncate text-right"
                          style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}
                        >
                          {homeParticipant}
                        </span>
                      )}
                      <span
                        className="font-semibold truncate text-right"
                        style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      >
                        {m.homeTeam}
                      </span>
                      <Flag team={m.homeTeam} height="0.95rem" width="1.4rem" />
                    </div>

                    {/* Score / time */}
                    <div
                      className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg px-2 py-1"
                      style={{
                        minWidth: '4.5rem',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {finished ? (
                        <span className="font-black tabular-nums" style={{ color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '0.05em' }}>
                          {m.homeScore} – {m.awayScore}
                        </span>
                      ) : live ? (
                        <>
                          <span className="font-black tabular-nums" style={{ color: '#ef4444', fontSize: '1rem', letterSpacing: '0.05em' }}>
                            {m.homeScore ?? 0} – {m.awayScore ?? 0}
                          </span>
                          <span className="font-bold uppercase" style={{ color: '#ef4444', fontSize: '0.55rem', letterSpacing: '0.08em' }}>Live</span>
                        </>
                      ) : (
                        <span className="font-bold" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {formatKickoff(m.utcDate)}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.1rem' }}>
                        {stageLabel(m.stage, m.group)}
                      </span>
                    </div>

                    {/* Away team */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <Flag team={m.awayTeam} height="0.95rem" width="1.4rem" />
                      <span
                        className="font-semibold truncate"
                        style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}
                      >
                        {m.awayTeam}
                      </span>
                      {awayParticipant && (
                        <span
                          className="hidden sm:block truncate"
                          style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}
                        >
                          {awayParticipant}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
