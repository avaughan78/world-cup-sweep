'use client';

import { useState } from 'react';
import { GROUPS_2026 } from '@/lib/groups';
import type { Prize } from '@/lib/prizes';
import type { GroupStanding } from '@/lib/db';
import Flag from './Flag';
import TeamModal from './TeamModal';


function gdLabel(gd: number): string {
  if (gd > 0) return `+${gd}`;
  return String(gd);
}

const COL: React.CSSProperties = {
  flexShrink: 0,
  width: '1.6rem',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

export default function GroupsGrid({
  participantMap,
  eliminatedTeams,
  prizes,
  groupStandings,
}: {
  participantMap: Record<string, string | null>;
  eliminatedTeams: string[];
  prizes: Prize[];
  groupStandings: GroupStanding[];
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

  // Build standings lookup: group_name → sorted rows
  const standingsMap = new Map<string, GroupStanding[]>();
  for (const row of groupStandings) {
    const existing = standingsMap.get(row.group_name) ?? [];
    existing.push(row);
    standingsMap.set(row.group_name, existing);
  }
  for (const [g, rows] of standingsMap) {
    standingsMap.set(g, rows.sort((a, b) => a.position - b.position));
  }

  // For groups not yet in DB, fall back to GROUPS_2026 order with zero stats
  function getRows(letter: string, teams: string[]): GroupStanding[] {
    const dbRows = standingsMap.get(letter);
    if (dbRows?.length) return dbRows;
    return teams.map((team_name, i) => ({
      group_name: letter, position: i + 1, team_name,
      played: 0, won: 0, drawn: 0, lost: 0,
      goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
    }));
  }

  const anyMatchesPlayed = groupStandings.some(r => r.played > 0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(GROUPS_2026).map(([letter, teams]) => {
          const rows = getRows(letter, teams);

          return (
            <div
              key={letter}
              className="group-card rounded-xl overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {/* Group header */}
              <div
                className="group-header flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <span className="group-letter font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                  Group {letter}
                </span>
                {/* Column headers */}
                <div className="flex items-center gap-0" style={{ color: 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 700 }}>
                  <span style={COL}>P</span>
                  <span style={COL}>W</span>
                  <span style={COL}>D</span>
                  <span style={COL}>L</span>
                  <span style={{ ...COL, width: '2rem' }}>GD</span>
                  <span style={{ ...COL, width: '2rem' }}>Pts</span>
                </div>
              </div>

              {/* Team rows */}
              {rows.map((row, i) => {
                const team = row.team_name;
                const participant = participantMap[team] ?? null;
                const eliminated = eliminatedSet.has(team);
                const wonPrizes = teamPrizes.get(team) ?? [];
                const isLast = i === rows.length - 1;
                const gd = row.goal_difference;
                const gdColor = gd > 0 ? 'var(--green)' : gd < 0 ? '#ef4444' : 'var(--text-muted)';

                return (
                  <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className={`team-row w-full text-left transition-colors${wonPrizes.length ? ' has-prize' : ''}`}
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      opacity: eliminated ? 0.4 : 1,
                      background: 'transparent',
                      display: 'block',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-1 px-4 py-2">
                      {/* Position */}
                      <span
                        style={{ color: 'var(--text-muted)', fontSize: '0.7rem', width: '1rem', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {row.position}
                      </span>

                      {/* Flag + name + participant */}
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <Flag team={team} height="0.95rem" width="1.4rem" />
                        <div className="min-w-0 flex-1">
                          <span
                            className="team-name font-semibold truncate block"
                            style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}
                          >
                            {team}
                          </span>
                          {participant && (
                            <div
                              className="participant-name truncate"
                              style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                            >
                              {participant}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prize icons — vertically centred across full row height, right-aligned before stats */}
                      {wonPrizes.length > 0 && (
                        <div className="flex items-center gap-2 flex-shrink-0 px-1.5">
                          {wonPrizes.map(prize => (
                            <span
                              key={prize.slug}
                              title={prize.name}
                              style={{ fontSize: '1.1rem', lineHeight: 1, transform: 'scale(1.4)', display: 'inline-block' }}
                            >
                              {prize.icon}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center flex-shrink-0" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <span style={COL}>{row.played}</span>
                        <span style={COL}>{row.won}</span>
                        <span style={COL}>{row.drawn}</span>
                        <span style={COL}>{row.lost}</span>
                        <span style={{ ...COL, width: '2rem', color: anyMatchesPlayed ? gdColor : 'var(--text-muted)' }}>
                          {anyMatchesPlayed ? gdLabel(gd) : '–'}
                        </span>
                        <span style={{ ...COL, width: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {anyMatchesPlayed ? row.points : '–'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
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
