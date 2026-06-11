'use client';

import { useState } from 'react';
import type { Prize } from '@/lib/prizes';
import type { GroupStanding, TeamStats } from '@/lib/db';
import GroupsGrid from './GroupsGrid';
import FixturesList from './FixturesList';
import StatsView from './StatsView';

type View = 'standings' | 'fixtures' | 'stats';

function TableIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}

export default function GroupsSection({
  participantMap,
  eliminatedTeams,
  prizes,
  groupStandings,
  teamStats,
  teamCount,
  inRunning,
}: {
  participantMap: Record<string, string | null>;
  eliminatedTeams: string[];
  prizes: Prize[];
  groupStandings: GroupStanding[];
  teamStats: TeamStats[];
  teamCount: number;
  inRunning: number;
}) {
  const [view, setView] = useState<View>('standings');

  const labelText = view === 'fixtures' ? 'Fixtures' : view === 'stats' ? 'Stats' : 'WC26 Sweep';
  const labelNote = view === 'fixtures' ? 'all matches' : view === 'stats' ? 'tournament data' : 'forty-eight teams';

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-3">
        <div className="flex items-center gap-2">
          <p
            className="default-section-label text-sm font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            The Groups · {teamCount} Teams
          </p>
          {/* Fixtures toggle */}
          <button
            onClick={() => setView(v => v === 'fixtures' ? 'standings' : 'fixtures')}
            title={view === 'fixtures' ? 'Show group standings' : 'Show fixtures & results'}
            className="flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{
              width: '1.6rem',
              height: '1.6rem',
              background: view === 'fixtures' ? 'var(--green)' : 'var(--card)',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ⚽
          </button>
          {/* Stats toggle */}
          <button
            onClick={() => setView(v => v === 'stats' ? 'standings' : 'stats')}
            title={view === 'stats' ? 'Show group standings' : 'Show tournament stats'}
            className="flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{
              width: '1.6rem',
              height: '1.6rem',
              background: view === 'stats' ? 'var(--green)' : 'var(--card)',
              border: '1px solid var(--border)',
              color: view === 'stats' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <TableIcon />
          </button>
        </div>

        <div className="album-section-label" style={{ marginBottom: 0 }}>
          <span className="label-text">{labelText}</span>
          <span className="label-line" />
          <span className="label-note">{labelNote}</span>
        </div>

        {inRunning > 0 && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {inRunning} still in the running
          </span>
        )}
      </div>

      {view === 'standings' && (
        <GroupsGrid
          participantMap={participantMap}
          eliminatedTeams={eliminatedTeams}
          prizes={prizes}
          groupStandings={groupStandings}
        />
      )}
      {view === 'fixtures' && (
        <FixturesList participantMap={participantMap} />
      )}
      {view === 'stats' && (
        <StatsView
          groupStandings={groupStandings}
          teamStats={teamStats}
          participantMap={participantMap}
        />
      )}
    </section>
  );
}
