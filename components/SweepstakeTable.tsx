import type { Prize } from '@/lib/prizes';
import type { Participant } from '@/lib/db';
import { getFlag } from '@/lib/flags';
import { abbreviateName } from '@/lib/format';

const BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  most_cards:       { label: 'CARD', style: { background: '#f59e0b', color: '#fff' } },
  first_eliminated: { label: 'OUT',  style: { background: '#ef4444', color: '#fff' } },
  longest_shot:     { label: 'KM',   style: { background: 'var(--green)', color: '#fff' } },
  most_own_goals:   { label: 'OG',   style: { background: 'var(--green)', color: '#fff' } },
  top_scorer_team:  { label: 'BOOT', style: { background: 'var(--green)', color: '#fff' } },
};

export default function SweepstakeTable({
  participants,
  prizes,
  eliminatedTeams,
  inRunning,
}: {
  participants: Participant[];
  prizes: Prize[];
  eliminatedTeams: Set<string>;
  inRunning: number;
}) {
  const teamPrizes = new Map<string, Prize[]>();
  for (const prize of prizes) {
    if (!prize.current_team) continue;
    const existing = teamPrizes.get(prize.current_team) ?? [];
    existing.push(prize);
    teamPrizes.set(prize.current_team, existing);
  }

  const isEliminated = (team: string) => eliminatedTeams.has(team);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Table header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          All entries
        </span>
        {inRunning > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {inRunning} currently in the running
          </span>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3">
        {participants.map((p, i) => {
          const wonPrizes = teamPrizes.get(p.team_name) ?? [];
          const eliminated = isEliminated(p.team_name);
          const isLast = i >= participants.length - (participants.length % 3 || 3);
          const isLastInRow = (i + 1) % 3 === 0;

          return (
            <div
              key={p.team_name}
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                borderRight: isLastInRow ? 'none' : '1px solid var(--border)',
                opacity: eliminated ? 0.45 : 1,
              }}
            >
              <span className="text-base leading-none flex-shrink-0">{getFlag(p.team_name)}</span>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {p.team_name}
              </span>

              {/* Prize badges */}
              {wonPrizes.map(prize => {
                const b = BADGE[prize.slug];
                return b ? (
                  <span
                    key={prize.slug}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide flex-shrink-0"
                    style={b.style}
                  >
                    {b.label}
                  </span>
                ) : null;
              })}
              {eliminated && wonPrizes.length === 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide flex-shrink-0"
                  style={{ background: '#ef444422', color: '#ef4444' }}
                >
                  OUT
                </span>
              )}

              <span className="ml-auto text-xs flex-shrink-0 pl-2" style={{ color: 'var(--text-muted)' }}>
                {abbreviateName(p.participant_name) || <span style={{ fontStyle: 'italic' }}>TBD</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
