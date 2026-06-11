'use client';

import { useState } from 'react';
import type { Prize } from '@/lib/prizes';
import type { GroupStanding, TeamStats } from '@/lib/db';
import GroupsGrid from './GroupsGrid';
import FixturesList from './FixturesList';
import StatsView from './StatsView';

type View = 'standings' | 'fixtures' | 'stats';


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
        <div className="flex items-center gap-3">
          <p
            className="default-section-label text-sm font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            The Groups · {teamCount} Teams
          </p>
          <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
            {(['standings', 'fixtures', 'stats'] as View[]).map((v, i) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: view === v ? 'var(--green)' : 'var(--card)',
                  color: view === v ? '#fff' : 'var(--text-muted)',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {v === 'standings' ? 'Tables' : v === 'fixtures' ? 'Fixtures' : 'Stats'}
              </button>
            ))}
          </div>
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
          teamStats={teamStats}
          participantMap={participantMap}
        />
      )}
    </section>
  );
}
