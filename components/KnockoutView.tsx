'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import Flag from './Flag';

const STAGE_ORDER = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];

const STAGE_LABEL: Record<string, string> = {
  ROUND_OF_32:    'Round of 32',
  ROUND_OF_16:    'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS:    'Semi-finals',
  THIRD_PLACE:    'Third Place',
  FINAL:          'Final',
};

function formatKickoff(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

function formatMatchDate(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function KnockoutView({ participantMap }: { participantMap: Record<string, string | null> }) {
  const [fixtures, setFixtures] = useState<MatchFixture[] | null>(null);

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
        <span style={{ fontSize: '0.9rem' }}>Loading…</span>
      </div>
    );
  }

  const knockoutFixtures = fixtures.filter(m => m.stage !== 'GROUP_STAGE');

  if (knockoutFixtures.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Knockout fixtures not available yet — check back soon.
      </div>
    );
  }

  // Group by stage in defined order
  const byStage = new Map<string, MatchFixture[]>();
  for (const m of knockoutFixtures) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }

  const stages = STAGE_ORDER.filter(s => byStage.has(s));

  return (
    <div className="space-y-6">
      {stages.map(stage => {
        const matches = byStage.get(stage)!;
        return (
          <div key={stage}>
            <p
              className="font-black uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}
            >
              {STAGE_LABEL[stage] ?? stage}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matches.map(m => {
                const finished = m.status === 'FINISHED';
                const live = m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED';
                const homeParticipant = participantMap[m.homeTeam] ?? null;
                const awayParticipant = participantMap[m.awayTeam] ?? null;

                return (
                  <div
                    key={m.id}
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    {/* Date */}
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                      {formatMatchDate(m.utcDate)}
                    </p>

                    <div className="flex items-center gap-2">
                      {/* Home */}
                      <div className="flex-1 min-w-0 flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate" style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {m.homeTeam}
                          </span>
                          <Flag team={m.homeTeam} height="0.95rem" width="1.4rem" />
                        </div>
                        {homeParticipant && (
                          <span className="truncate" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {homeParticipant}
                          </span>
                        )}
                      </div>

                      {/* Score / time */}
                      <div
                        className="flex-shrink-0 flex flex-col items-center justify-center rounded-lg px-2 py-1"
                        style={{ minWidth: '4.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}
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
                            <span className="font-bold uppercase" style={{ color: '#ef4444', fontSize: '0.55rem', letterSpacing: '0.08em' }}>
                              {m.status === 'PAUSED' ? 'HT' : m.elapsed ? `${m.elapsed}'` : 'Live'}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {formatKickoff(m.utcDate)}
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Flag team={m.awayTeam} height="0.95rem" width="1.4rem" />
                          <span className="font-semibold truncate" style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {m.awayTeam}
                          </span>
                        </div>
                        {awayParticipant && (
                          <span className="truncate" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
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
        );
      })}
    </div>
  );
}
