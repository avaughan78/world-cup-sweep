'use client';

import { useEffect, useState } from 'react';
import type { TeamStats } from '@/lib/db';
import type { MatchFixture } from '@/app/api/fixtures/route';
import Flag from './Flag';

type StatEntry = {
  team: string;
  participant: string | null;
  value: number;
  badge?: string;
};

function gdLabel(gd: number): string {
  if (gd > 0) return `+${gd}`;
  return String(gd);
}

function Leaderboard({
  title,
  icon,
  entries,
  renderValue,
  emptyMsg,
  showZero,
}: {
  title: string;
  icon: string;
  entries: StatEntry[];
  renderValue: (e: StatEntry) => React.ReactNode;
  emptyMsg: string;
  showZero?: boolean;
}) {
  const visible = showZero ? entries : entries.filter(e => e.value !== 0);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</span>
        <span className="font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
          {title}
        </span>
      </div>
      {visible.length === 0 ? (
        <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{emptyMsg}</p>
      ) : (
        visible.slice(0, 8).map((entry, i, arr) => (
          <div
            key={entry.team}
            className="flex items-center gap-1.5 px-4 py-2"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', width: '1rem', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {i + 1}
            </span>
            <Flag team={entry.team} height="0.95rem" width="1.4rem" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold truncate block" style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {entry.team}
              </span>
              {entry.participant && (
                <span className="truncate block" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {entry.participant}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {entry.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}>
                  {entry.badge}
                </span>
              )}
              <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {renderValue(entry)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Compute goals scored/conceded per team from fixture scores (live-accurate)
function computeGoalsFromFixtures(fixtures: MatchFixture[]): {
  scored: Map<string, number>;
  conceded: Map<string, number>;
} {
  const scored = new Map<string, number>();
  const conceded = new Map<string, number>();
  for (const f of fixtures) {
    if (f.homeScore == null || f.awayScore == null) continue;
    const statuses = ['FINISHED', 'IN_PLAY', 'PAUSED'];
    if (!statuses.includes(f.status)) continue;
    scored.set(f.homeTeam, (scored.get(f.homeTeam) ?? 0) + f.homeScore);
    scored.set(f.awayTeam, (scored.get(f.awayTeam) ?? 0) + f.awayScore);
    conceded.set(f.homeTeam, (conceded.get(f.homeTeam) ?? 0) + f.awayScore);
    conceded.set(f.awayTeam, (conceded.get(f.awayTeam) ?? 0) + f.homeScore);
  }
  return { scored, conceded };
}

export default function StatsView({
  teamStats,
  participantMap,
}: {
  teamStats: TeamStats[];
  participantMap: Record<string, string | null>;
}) {
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
        const hasLive = prev?.some(f => f.status === 'IN_PLAY' || f.status === 'PAUSED');
        if (hasLive) load();
        return prev;
      });
    }, 60_000);

    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Goals scored + conceded: computed live from fixture scores
  const { scored, conceded } = fixtures
    ? computeGoalsFromFixtures(fixtures)
    : { scored: new Map<string, number>(), conceded: new Map<string, number>() };

  // All teams that have played at least one match
  const teamsWithMatches = fixtures
    ? new Set(
        fixtures
          .filter(f => f.status === 'FINISHED' || f.status === 'IN_PLAY' || f.status === 'PAUSED')
          .flatMap(f => [f.homeTeam, f.awayTeam])
      )
    : new Set<string>();

  const allTeams = fixtures
    ? [...teamsWithMatches]
    : teamStats.map(t => t.team_name);

  const goalScorers: StatEntry[] = allTeams
    .map(team => ({ team, participant: participantMap[team] ?? null, value: scored.get(team) ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const goalsConcededEntries: StatEntry[] = allTeams
    .map(team => ({ team, participant: participantMap[team] ?? null, value: conceded.get(team) ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const goalDiff: StatEntry[] = allTeams
    .map(team => ({
      team,
      participant: participantMap[team] ?? null,
      value: (scored.get(team) ?? 0) - (conceded.get(team) ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  // Cards: still from DB (sync-backed), accurate after each match
  const cards: StatEntry[] = [...teamStats]
    .map(t => ({
      team: t.team_name,
      participant: participantMap[t.team_name] ?? null,
      value: t.yellow_cards + t.red_cards * 2,
      badge: t.yellow_cards > 0 || t.red_cards > 0 ? `${t.yellow_cards}Y ${t.red_cards}R` : undefined,
    }))
    .sort((a, b) => b.value - a.value);

  const loading = fixtures === null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Leaderboard
        title="Goals Scored"
        icon="⚽"
        entries={goalScorers}
        renderValue={e => <>{e.value}</>}
        emptyMsg={loading ? 'Loading…' : 'No goals yet'}
      />
      <Leaderboard
        title="Goals Conceded"
        icon="🪣"
        entries={goalsConcededEntries}
        renderValue={e => <>{e.value}</>}
        emptyMsg={loading ? 'Loading…' : 'No goals yet'}
      />
      <Leaderboard
        title="Discipline"
        icon="🟨"
        entries={cards}
        renderValue={e => <>{e.value}</>}
        emptyMsg={loading ? 'Loading…' : 'No cards yet'}
      />
      <Leaderboard
        title="Goal Difference"
        icon="📈"
        entries={goalDiff}
        renderValue={e => <>{gdLabel(e.value)}</>}
        emptyMsg={loading ? 'Loading…' : 'No matches played'}
      />
    </div>
  );
}
