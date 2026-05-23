import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import TicketBadge from './TicketBadge';

export default function PrizeCard({ prize, prizeAmount }: { prize: Prize; prizeAmount?: string | null }) {
  const hasLeader = !!prize.current_team;

  return (
    <div
      className="prize-card rounded-xl p-4 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <span
            className="text-2xl leading-none"
            style={prize.slug === 'top_scorer_team' ? { filter: 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.15)' } : undefined}
          >{prize.icon}</span>
          {prizeAmount && <TicketBadge amount={prizeAmount} />}
        </div>
        <p className="prize-name font-bold text-base mt-2 leading-tight" style={{ color: 'var(--text-primary)', minHeight: '2.5rem' }}>
          {prize.name}
        </p>
        <p className="prize-description text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {prize.description}
        </p>
      </div>

      <hr className="my-3" style={{ borderColor: 'var(--border)' }} />

      {hasLeader ? (
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            <span className="mr-1">{getFlag(prize.current_team!)}</span>
            {prize.current_team}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {[prize.value_label, prize.current_participant].filter(Boolean).join(' · ')}
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No leader yet</p>
      )}
    </div>
  );
}
