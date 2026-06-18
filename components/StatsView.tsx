'use client';

import { useEffect, useState } from 'react';
import type { TeamStats } from '@/lib/db';
import type { MatchFixture } from '@/app/api/fixtures/route';
import type { TopScorerEntry } from '@/app/api/topscorers/route';
import Flag from './Flag';

type StatEntry = {
  team: string;
  participant: string | null;
  value: number;
  badge?: string;
};

type TiebreakerDef = { title: string; icon: string; criteria: string[] };

function TiebreakerModal({ def, onClose }: { def: TiebreakerDef; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(8,8,6,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{def.icon}</span>
            <span className="font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '0.78rem' }}>
              {def.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-xs"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
            Tie-break order
          </p>
          <ol className="space-y-2.5">
            {def.criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="font-black tabular-nums shrink-0" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', width: '1rem', paddingTop: '0.15rem' }}>
                  {i + 1}.
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4 }}>{c}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({
  title,
  icon,
  entries,
  renderValue,
  emptyMsg,
  showZero,
  tiebreaker,
}: {
  title: string;
  icon: string;
  entries: StatEntry[];
  renderValue: (e: StatEntry) => React.ReactNode;
  emptyMsg: string;
  showZero?: boolean;
  tiebreaker?: TiebreakerDef;
}) {
  const [showTiebreaker, setShowTiebreaker] = useState(false);
  const visible = showZero ? entries : entries.filter(e => e.value !== 0);
  return (
    <>
      {showTiebreaker && tiebreaker && (
        <TiebreakerModal def={tiebreaker} onClose={() => setShowTiebreaker(false)} />
      )}
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => tiebreaker && setShowTiebreaker(true)}
          style={{
            fontSize: '0.95rem', lineHeight: 1, background: 'none', border: 'none', padding: 0,
            cursor: tiebreaker ? 'pointer' : 'default',
            opacity: tiebreaker ? 1 : 1,
          }}
          aria-label={tiebreaker ? `${title} tie-break rules` : undefined}
          title={tiebreaker ? 'View tie-break rules' : undefined}
        >
          {icon}
        </button>
        <span className="font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
          {title}
        </span>
      </div>
      {visible.length === 0 ? (
        <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{emptyMsg}</p>
      ) : (
        visible.slice(0, 10).map((entry, i, arr) => (
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
    </>
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

const GOLDEN_BOOT_TIEBREAKER: TiebreakerDef = {
  icon: '👟',
  title: 'Golden Boot',
  criteria: [
    'Most goals scored',
    'Prize shared if tied',
  ],
};

function GoldenBootLeaderboard({
  scorers,
  participantMap,
  loading,
}: {
  scorers: TopScorerEntry[] | null;
  participantMap: Record<string, string | null>;
  loading: boolean;
}) {
  const [showTiebreaker, setShowTiebreaker] = useState(false);
  const entries = scorers?.slice(0, 10) ?? [];
  return (
    <>
      {showTiebreaker && (
        <TiebreakerModal def={GOLDEN_BOOT_TIEBREAKER} onClose={() => setShowTiebreaker(false)} />
      )}
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowTiebreaker(true)}
          style={{ fontSize: '0.95rem', lineHeight: 1, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-label="Golden Boot tie-break rules"
          title="View tie-break rules"
        >
          👟
        </button>
        <span className="font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
          Golden Boot
        </span>
      </div>
      {scorers === null || loading ? (
        <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : entries.length === 0 ? (
        <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No goals yet</p>
      ) : (
        entries.map((s, i, arr) => {
          const participant = participantMap[s.teamName] ?? null;
          return (
            <div
              key={`${s.playerName}-${s.teamName}`}
              className="flex items-center gap-1.5 px-4 py-2"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', width: '1rem', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {i + 1}
              </span>
              <Flag team={s.teamName} height="0.95rem" width="1.4rem" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate block" style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {s.playerName}
                </span>
                <span className="truncate block" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {s.teamName}{participant ? ` · ${participant}` : ''}
                </span>
              </div>
              <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {s.goals}
              </span>
            </div>
          );
        })
      )}
    </div>
    </>
  );
}

export default function StatsView({
  teamStats: initialTeamStats,
  participantMap,
}: {
  teamStats: TeamStats[];
  participantMap: Record<string, string | null>;
}) {
  const [fixtures, setFixtures] = useState<MatchFixture[] | null>(null);
  const [scorers, setScorers] = useState<TopScorerEntry[] | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats[]>(initialTeamStats);

  useEffect(() => {
    let cancelled = false;

    function loadFixtures() {
      fetch('/api/fixtures')
        .then(r => r.json())
        .then((d: { fixtures?: MatchFixture[] }) => {
          if (!cancelled) setFixtures(d.fixtures ?? []);
        })
        .catch(() => { if (!cancelled) setFixtures([]); });
    }

    function loadScorers() {
      fetch('/api/topscorers')
        .then(r => r.json())
        .then((d: { scorers?: TopScorerEntry[] }) => {
          if (!cancelled) setScorers(d.scorers ?? []);
        })
        .catch(() => { if (!cancelled) setScorers([]); });
    }

    function loadTeamStats() {
      fetch('/api/teamstats')
        .then(r => r.json())
        .then((d: { teamStats?: TeamStats[] }) => {
          if (!cancelled) setTeamStats(d.teamStats ?? []);
        })
        .catch(() => {});
    }

    loadFixtures();
    loadScorers();
    loadTeamStats();

    const id = setInterval(() => {
      setFixtures(prev => {
        const hasLive = prev?.some(f => f.status === 'IN_PLAY' || f.status === 'PAUSED');
        if (hasLive) { loadFixtures(); loadScorers(); loadTeamStats(); }
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
      <GoldenBootLeaderboard
        scorers={scorers}
        participantMap={participantMap}
        loading={loading}
      />
      <Leaderboard
        title="Goals Conceded"
        icon="🪣"
        entries={goalsConcededEntries}
        renderValue={e => <>{e.value}</>}
        emptyMsg={loading ? 'Loading…' : 'No goals yet'}
        tiebreaker={{
          icon: '🪣',
          title: 'Derby County',
          criteria: [
            'Most goals conceded',
            'Worst goal difference',
            'Fewest goals scored',
          ],
        }}
      />
      <Leaderboard
        title="Discipline"
        icon="🟨"
        entries={cards}
        renderValue={e => <>{e.value}</>}
        emptyMsg={loading ? 'Loading…' : 'No cards yet'}
        tiebreaker={{
          icon: '🟨',
          title: 'Josip Simunic Award',
          criteria: [
            'Most weighted cards (yellow = 1, red = 2)',
            'Most red cards',
            'Most yellow cards',
          ],
        }}
      />
    </div>
  );
}
