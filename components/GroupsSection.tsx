'use client';

import { useState } from 'react';
import type { Prize } from '@/lib/prizes';
import type { GroupStanding, TeamStats } from '@/lib/db';
import { KNOCKOUT_START } from '@/lib/groups';
import GroupsGrid from './GroupsGrid';
import FixturesList from './FixturesList';
import KnockoutView from './KnockoutView';
import StatsView from './StatsView';
import HighlightsView from './HighlightsView';

type View = 'standings' | 'fixtures' | 'knockout' | 'stats' | 'highlights';

const STORAGE_KEY = 'wcsweep-tab';

function readStoredView(isKnockout: boolean): View {
  if (typeof window === 'undefined') return 'standings';
  const v = localStorage.getItem(STORAGE_KEY);
  const valid: View[] = ['standings', 'fixtures', 'knockout', 'stats', 'highlights'];
  if (valid.includes(v as View)) {
    // If they had 'knockout' saved but we're not in knockout phase yet, fall back
    if (v === 'knockout' && !isKnockout) return 'standings';
    return v as View;
  }
  return 'standings';
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
  const isKnockout = Date.now() >= KNOCKOUT_START.getTime();
  const [view, setView] = useState<View>(() => readStoredView(isKnockout));

  function handleSetView(v: View) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  const tabs: { id: View; label: string }[] = [
    { id: 'standings', label: isKnockout ? 'Group Stage' : 'Tables' },
    { id: 'fixtures',  label: 'Fixtures' },
    ...(isKnockout ? [{ id: 'knockout' as View, label: 'Knockout' }] : []),
    { id: 'stats',      label: 'Stats' },
    { id: 'highlights', label: 'Highlights' },
  ];

  const labelText = view === 'fixtures' ? 'Fixtures' : view === 'stats' ? 'Stats' : view === 'highlights' ? 'Highlights' : view === 'knockout' ? 'Knockout' : 'WC26 Sweep';
  const labelNote = view === 'fixtures' ? 'all matches' : view === 'stats' ? 'tournament data' : view === 'highlights' ? 'news & clips' : view === 'knockout' ? 'round by round' : isKnockout ? 'final group standings' : 'forty-eight teams';

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-3">
        <div className="flex items-center gap-3">
          <p
            className="default-section-label text-sm font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {isKnockout ? 'Knockout Phase' : `The Groups · ${teamCount} Teams`}
          </p>
          <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => handleSetView(tab.id)}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: view === tab.id ? 'var(--green)' : 'var(--card)',
                  color: view === tab.id ? '#fff' : 'var(--text-muted)',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
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
      {view === 'knockout' && (
        <KnockoutView participantMap={participantMap} />
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
