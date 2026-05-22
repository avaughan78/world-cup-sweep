import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import { abbreviateName } from '@/lib/format';

export default function PrizeCard({ prize }: { prize: Prize }) {
  const hasLeader = !!prize.current_team;

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <span className="text-2xl leading-none">{prize.icon}</span>
      <p className="font-bold text-base mt-2 leading-tight" style={{ color: 'var(--text-primary)' }}>
        {prize.name}
      </p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {prize.description}
      </p>

      <hr className="my-3" style={{ borderColor: 'var(--border)' }} />

      {hasLeader ? (
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            <span className="mr-1">{getFlag(prize.current_team!)}</span>
            {prize.current_team}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {[prize.value_label, abbreviateName(prize.current_participant)].filter(Boolean).join(' · ')}
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No leader yet</p>
      )}
    </div>
  );
}
