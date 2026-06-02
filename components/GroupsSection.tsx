'use client';

import { useState } from 'react';
import type { Prize } from '@/lib/prizes';
import type { GroupStanding } from '@/lib/db';
import GroupsGrid from './GroupsGrid';
import FixturesList from './FixturesList';

type View = 'standings' | 'fixtures';

export default function GroupsSection({
  participantMap,
  eliminatedTeams,
  prizes,
  groupStandings,
  teamCount,
  inRunning,
}: {
  participantMap: Record<string, string | null>;
  eliminatedTeams: string[];
  prizes: Prize[];
  groupStandings: GroupStanding[];
  teamCount: number;
  inRunning: number;
}) {
  const [view, setView] = useState<View>('standings');

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
          {/* View toggle */}
          <button
            onClick={() => setView(v => v === 'standings' ? 'fixtures' : 'standings')}
            title={view === 'standings' ? 'Show fixtures & results' : 'Show group standings'}
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
        </div>

        <div className="album-section-label" style={{ marginBottom: 0 }}>
          <span className="label-text">{view === 'standings' ? 'The Draw' : 'Fixtures'}</span>
          <span className="label-line" />
          <span className="label-note">{view === 'standings' ? 'forty-eight teams' : 'all matches'}</span>
        </div>

        {inRunning > 0 && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {inRunning} still in the running
          </span>
        )}
      </div>

      {view === 'standings' ? (
        <GroupsGrid
          participantMap={participantMap}
          eliminatedTeams={eliminatedTeams}
          prizes={prizes}
          groupStandings={groupStandings}
        />
      ) : (
        <FixturesList participantMap={participantMap} />
      )}
    </section>
  );
}
