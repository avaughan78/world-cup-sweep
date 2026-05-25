import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import TicketBadge from './TicketBadge';
import VideoEasterEgg from './VideoEasterEgg';

const MYSTERY_QS = [
  { top: '52%', left: '8%',  size: '1.6rem', opacity: 0.06, rotate: '-14deg' },
  { top: '68%', left: '55%', size: '2.1rem', opacity: 0.05, rotate:  '11deg' },
  { top: '78%', left: '28%', size: '1.2rem', opacity: 0.07, rotate:  '25deg' },
  { top: '60%', left: '80%', size: '1.8rem', opacity: 0.04, rotate:  '-6deg' },
  { top: '85%', left: '68%', size: '1.0rem', opacity: 0.06, rotate:  '18deg' },
  { top: '90%', left: '14%', size: '1.4rem', opacity: 0.05, rotate: '-22deg' },
  { top: '43%', left: '70%', size: '1.1rem', opacity: 0.04, rotate:   '8deg' },
];

export default function PrizeCard({ prize, prizeAmount }: { prize: Prize; prizeAmount?: string | null }) {
  const hasLeader = !!prize.current_team;

  if (prize.mystery) {
    return (
      <div
        className="prize-card rounded-xl p-4 flex flex-col relative overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Scattered ? marks — body area only, below the icon row */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none' }}>
          {MYSTERY_QS.map((q, i) => (
            <span key={i} style={{
              position: 'absolute', top: q.top, left: q.left,
              fontSize: q.size, opacity: q.opacity, fontWeight: 900,
              color: 'var(--text-primary)', lineHeight: 1,
              transform: `rotate(${q.rotate})`,
            }}>?</span>
          ))}
        </div>

        <div className="flex-1 relative">
          <div className="flex items-start justify-between">
            {prize.slug === 'most_own_goals'
              ? <VideoEasterEgg icon="😬" label="Oooops" videoSrc="/haiti-own-goal.mp4" fontSize="1.5rem" />
              : <span className="text-2xl leading-none">{prize.icon}</span>
            }
            <TicketBadge amount="?" />
          </div>
          <p className="prize-name font-bold text-base mt-2 leading-tight" style={{ color: 'var(--text-primary)', minHeight: '2.5rem' }}>
            {prize.name}
          </p>
          <p className="prize-description text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {prize.description}
          </p>
        </div>

        <hr className="my-3 relative" style={{ borderColor: 'var(--border)' }} />

        <div className="relative">
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
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>TBD</p>
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
