'use client';

import { useState } from 'react';
import type { Prize } from '@/lib/prizes';
import type { GroupStanding, TeamStats } from '@/lib/db';
import GroupsGrid from './GroupsGrid';
import FixturesList from './FixturesList';
import StatsView from './StatsView';
import HighlightsView from './HighlightsView';

type View = 'standings' | 'fixtures' | 'stats' | 'highlights';

const TABS: { id: View; label: string; disabled?: boolean }[] = [
  { id: 'standings',  label: 'Tables' },
  { id: 'fixtures',   label: 'Fixtures / Results' },
  { id: 'stats',      label: 'Stats' },
  { id: 'highlights', label: 'Highlights' },
];

const STORAGE_KEY = 'wcsweep-tab';

function readStoredView(): View {
  if (typeof window === 'undefined') return 'standings';
  const v = localStorage.getItem(STORAGE_KEY);
  return (v === 'standings' || v === 'fixtures' || v === 'stats' || v === 'highlights') ? v : 'standings';
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
  const [view, setView] = useState<View>(readStoredView);

  function handleSetView(v: View) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  const labelText = view === 'fixtures' ? 'Fixtures' : view === 'stats' ? 'Stats' : view === 'highlights' ? 'Highlights' : 'WC26 Sweep';
  const labelNote = view === 'fixtures' ? 'all matches' : view === 'stats' ? 'tournament data' : view === 'highlights' ? 'news & clips' : 'forty-eight teams';

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
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && handleSetView(tab.id)}
                disabled={tab.disabled}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: view === tab.id ? 'var(--green)' : 'var(--card)',
                  color: tab.disabled ? 'var(--border)' : view === tab.id ? '#fff' : 'var(--text-muted)',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor: tab.disabled ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
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
      {view === 'highlights' && (
        <HighlightsView />
      )}
    </section>
  );
}
