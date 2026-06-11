'use client';

import type { GroupStanding, TeamStats } from '@/lib/db';
import Flag from './Flag';

type StatEntry = {
  team: string;
  participant: string | null;
  value: number;
  badge?: string;
  played?: number;
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
  filterFn,
}: {
  title: string;
  icon: string;
  entries: StatEntry[];
  renderValue: (e: StatEntry) => React.ReactNode;
  emptyMsg: string;
  filterFn?: (e: StatEntry) => boolean;
}) {
  const visible = filterFn ? entries.filter(filterFn) : entries.filter(e => e.value !== 0);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
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
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums' }}
                >
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

export default function StatsView({
  groupStandings,
  teamStats,
  participantMap,
}: {
  groupStandings: GroupStanding[];
  teamStats: TeamStats[];
  participantMap: Record<string, string | null>;
}) {
  const goalScorers: StatEntry[] = [...groupStandings]
    .map(r => ({ team: r.team_name, participant: participantMap[r.team_name] ?? null, value: r.goals_for, played: r.played }))
    .sort((a, b) => b.value - a.value);

  const goalsConceded: StatEntry[] = [...teamStats]
    .map(t => ({ team: t.team_name, participant: participantMap[t.team_name] ?? null, value: t.goals_conceded }))
    .sort((a, b) => b.value - a.value);

  const cards: StatEntry[] = [...teamStats]
    .map(t => ({
      team: t.team_name,
      participant: participantMap[t.team_name] ?? null,
      value: t.yellow_cards + t.red_cards * 2,
      badge: t.yellow_cards > 0 || t.red_cards > 0 ? `${t.yellow_cards}Y ${t.red_cards}R` : undefined,
    }))
    .sort((a, b) => b.value - a.value);

  const goalDiff: StatEntry[] = [...groupStandings]
    .map(r => ({ team: r.team_name, participant: participantMap[r.team_name] ?? null, value: r.goal_difference, played: r.played }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Leaderboard
        title="Goals Scored"
        icon="⚽"
        entries={goalScorers}
        renderValue={e => <>{e.value}</>}
        filterFn={e => (e.played ?? 0) > 0}
        emptyMsg="No goals yet"
      />
      <Leaderboard
        title="Goals Conceded"
        icon="🪣"
        entries={goalsConceded}
        renderValue={e => <>{e.value}</>}
        emptyMsg="No goals yet"
      />
      <Leaderboard
        title="Discipline"
        icon="🟨"
        entries={cards}
        renderValue={e => <>{e.value}</>}
        emptyMsg="No cards yet"
      />
      <Leaderboard
        title="Goal Difference"
        icon="📈"
        entries={goalDiff}
        renderValue={e => <>{gdLabel(e.value)}</>}
        filterFn={e => (e.played ?? 0) > 0}
        emptyMsg="No matches played"
      />
    </div>
  );
}
