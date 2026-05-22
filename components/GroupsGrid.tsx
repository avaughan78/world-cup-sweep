'use client';

import { useState } from 'react';
import { GROUPS_2026 } from '@/lib/groups';
import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import TeamModal from './TeamModal';

const BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  most_cards:       { label: 'CARD', style: { background: '#f59e0b', color: '#fff' } },
  first_eliminated: { label: 'OUT',  style: { background: '#ef4444', color: '#fff' } },
  longest_shot:     { label: 'KM',   style: { background: 'var(--green)', color: '#fff' } },
  most_own_goals:   { label: 'OG',   style: { background: 'var(--green)', color: '#fff' } },
  top_scorer_team:  { label: 'BOOT', style: { background: 'var(--green)', color: '#fff' } },
};

export default function GroupsGrid({
  participantMap,
  eliminatedTeams,
  prizes,
}: {
  participantMap: Record<string, string | null>;
  eliminatedTeams: string[];
  prizes: Prize[];
}) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const eliminatedSet = new Set(eliminatedTeams);

  const teamPrizes = new Map<string, Prize[]>();
  for (const prize of prizes) {
    if (!prize.current_team) continue;
    const existing = teamPrizes.get(prize.current_team) ?? [];
    existing.push(prize);
    teamPrizes.set(prize.current_team, existing);
  }

  return (
    <>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {Object.entries(GROUPS_2026).map(([letter, teams]) => (
          <div
            key={letter}
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {/* Group header */}
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <span
                className="font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}
              >
                Group {letter}
              </span>
            </div>

            {/* Teams */}
            {teams.map((team, i) => {
              const participant = participantMap[team] ?? null;
              const eliminated = eliminatedSet.has(team);
              const wonPrizes = teamPrizes.get(team) ?? [];
              const isLast = i === teams.length - 1;

              return (
                <button
                  key={team}
                  onClick={() => setSelectedTeam(team)}
                  className="w-full text-left flex flex-col px-3 py-2.5 transition-colors"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    opacity: eliminated ? 0.4 : 1,
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Country row */}
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="leading-none flex-shrink-0" style={{ fontSize: '1rem' }}>
                      {getFlag(team)}
                    </span>
                    <span
                      className="font-semibold truncate flex-1 min-w-0"
                      style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    >
                      {team}
                    </span>
                    {wonPrizes.map(prize => {
                      const b = BADGE[prize.slug];
                      return b ? (
                        <span
                          key={prize.slug}
                          className="font-bold rounded-sm uppercase flex-shrink-0"
                          style={{
                            ...b.style,
                            fontSize: '0.6rem',
                            padding: '2px 5px',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {b.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Participant — smaller, muted, beneath */}
                  <div className="mt-0.5 pl-[1.375rem]">
                    {participant ? (
                      <span
                        className="font-medium truncate block"
                        style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}
                      >
                        {participant}
                      </span>
                    ) : (
                      <span
                        className="italic"
                        style={{ color: 'var(--border)', fontSize: '0.78rem' }}
                      >
                        TBD
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          participant={participantMap[selectedTeam] ?? null}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </>
  );
}
