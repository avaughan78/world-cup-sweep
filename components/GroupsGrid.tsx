import { GROUPS_2026 } from '@/lib/groups';
import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import { abbreviateName } from '@/lib/format';

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
  participantMap: Map<string, string | null>;
  eliminatedTeams: Set<string>;
  prizes: Prize[];
}) {
  const teamPrizes = new Map<string, Prize[]>();
  for (const prize of prizes) {
    if (!prize.current_team) continue;
    const existing = teamPrizes.get(prize.current_team) ?? [];
    existing.push(prize);
    teamPrizes.set(prize.current_team, existing);
  }

  return (
    <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {Object.entries(GROUPS_2026).map(([letter, teams]) => (
        <div
          key={letter}
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {/* Group header */}
          <div
            className="px-4 py-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Group {letter}
            </span>
          </div>

          {/* Teams */}
          {teams.map((team, i) => {
            const participant = participantMap.get(team) ?? null;
            const eliminated = eliminatedTeams.has(team);
            const wonPrizes = teamPrizes.get(team) ?? [];
            const isLast = i === teams.length - 1;

            return (
              <div
                key={team}
                className="flex items-center gap-1.5 px-3 py-2"
                style={{
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  opacity: eliminated ? 0.4 : 1,
                }}
              >
                <span className="text-sm leading-none flex-shrink-0">{getFlag(team)}</span>
                <span
                  className="text-sm font-medium truncate flex-1 min-w-0"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {team}
                </span>

                {/* Prize badges */}
                {wonPrizes.map(prize => {
                  const b = BADGE[prize.slug];
                  return b ? (
                    <span
                      key={prize.slug}
                      className="text-[10px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wide flex-shrink-0"
                      style={b.style}
                    >
                      {b.label}
                    </span>
                  ) : null;
                })}

                {participant ? (
                  <span
                    className="text-xs flex-shrink-0 pl-0.5 max-w-[72px] truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {abbreviateName(participant)}
                  </span>
                ) : (
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: 'var(--border)', fontStyle: 'italic' }}
                  >
                    TBD
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
