import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';

export default function PrizeCard({ prize, prizeAmount }: { prize: Prize; prizeAmount?: string | null }) {
  const hasLeader = !!prize.current_team;

  return (
    <div
      className="rounded-xl p-4 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <span className="text-2xl leading-none">{prize.icon}</span>
          {prizeAmount && (
            <div style={{ transform: 'rotate(12deg)', flexShrink: 0 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: 'var(--green)',
                  clipPath: 'polygon(50% 0%,61% 20%,79% 9%,70% 29%,95% 25%,80% 45%,100% 50%,80% 55%,95% 75%,70% 71%,79% 91%,61% 80%,50% 100%,39% 80%,21% 91%,30% 71%,5% 75%,20% 55%,0% 50%,20% 45%,5% 25%,30% 29%,21% 9%,39% 20%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ transform: 'rotate(-12deg)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, lineHeight: 1, textAlign: 'center' }}>
                  {prizeAmount}
                </span>
              </div>
            </div>
          )}
        </div>
        <p className="font-bold text-base mt-2 leading-tight" style={{ color: 'var(--text-primary)' }}>
          {prize.name}
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
