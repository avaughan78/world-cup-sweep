import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import TicketBadge from './TicketBadge';
import VideoEasterEgg from './VideoEasterEgg';

export default function PrizeCard({ prize, prizeAmount }: { prize: Prize; prizeAmount?: string | null }) {
  const hasLeader = !!prize.current_team;

  if (prize.mystery) {
    return (
      <div
        className="prize-card rounded-xl p-4 flex flex-row items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, #0d0a1a 0%, #13102a 100%)',
          border: '1px solid rgba(180,140,60,0.3)',
          boxShadow: '0 0 24px rgba(120,60,220,0.12), inset 0 0 40px rgba(0,0,0,0.3)',
        }}
      >
        <span className="text-3xl leading-none flex-shrink-0">{prize.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold uppercase tracking-widest" style={{ color: 'rgba(200,160,60,0.7)', fontSize: '0.6rem' }}>
            Mystery Prize
          </p>
          <p className="prize-name font-bold leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
            {prize.name}
          </p>
          <p className="prize-description mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
            {prize.description}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-black tracking-widest" style={{ color: 'rgba(200,160,60,0.6)', fontSize: '1.1rem' }}>???</p>
          {hasLeader ? (
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {getFlag(prize.current_team!)} {prize.current_team}
            </p>
          ) : (
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>TBD</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="prize-card rounded-xl p-4 flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
          {prize.slug === 'longest_shot'
            ? <VideoEasterEgg icon="🚀" label="The Thunderbastard" videoSrc="/van-bronckhorst.mp4" fontSize="1.5rem" />
            : prize.slug === 'most_cards'
            ? <VideoEasterEgg icon="🟨" label="The Gareth Barry Award" videoSrc="/zidane.mp4" fontSize="1.5rem" />
            : prize.slug === 'most_own_goals'
            ? <VideoEasterEgg icon="😬" label="Oooops" videoSrc="/haiti-own-goal.mp4" fontSize="1.5rem" />
            : (
              <span
                className="text-2xl leading-none"
                style={prize.slug === 'top_scorer_team' ? { filter: 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.15)' } : undefined}
              >{prize.icon}</span>
            )
          }
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
