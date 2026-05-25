import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';
import TicketBadge from './TicketBadge';
import VideoEasterEgg from './VideoEasterEgg';

const MYSTERY_QS = [
  { top:  '4%', left: '38%', size: '1.3rem', opacity: 0.05, rotate:  '10deg' },
  { top:  '8%', left: '72%', size: '1.0rem', opacity: 0.04, rotate: '-18deg' },
  { top: '18%', left: '12%', size: '1.8rem', opacity: 0.06, rotate:  '-8deg' },
  { top: '22%', left: '55%', size: '1.2rem', opacity: 0.05, rotate:  '22deg' },
  { top: '32%', left: '82%', size: '1.5rem', opacity: 0.04, rotate:  '-4deg' },
  { top: '38%', left: '30%', size: '1.0rem', opacity: 0.06, rotate:  '15deg' },
  { top: '48%', left: '65%', size: '2.0rem', opacity: 0.05, rotate: '-12deg' },
  { top: '55%', left:  '8%', size: '1.6rem', opacity: 0.06, rotate:  '-6deg' },
  { top: '64%', left: '48%', size: '1.1rem', opacity: 0.04, rotate:  '20deg' },
  { top: '72%', left: '78%', size: '1.4rem', opacity: 0.05, rotate:   '8deg' },
  { top: '80%', left: '22%', size: '1.2rem', opacity: 0.07, rotate: '-20deg' },
  { top: '88%', left: '60%', size: '1.7rem', opacity: 0.04, rotate:  '14deg' },
  { top: '93%', left: '38%', size: '1.0rem', opacity: 0.05, rotate:  '-9deg' },
];

const videoIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="4"/>
    <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="white"/>
  </svg>
);

const headerStrip: React.CSSProperties = {
  backgroundImage: 'url(/wc2026-header-bg.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

function LeaderSection({ prize, empty }: { prize: Prize; empty: string }) {
  if (!prize.current_team) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{empty}</p>;
  }

  const playerMode = prize.slug === 'longest_shot' || prize.slug === 'bicycle';

  if (playerMode) {
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            <span className="mr-1">{getFlag(prize.current_team)}</span>
            {prize.value_label ?? prize.current_team}
          </p>
          {prize.video_url && (
            <a href={prize.video_url} target="_blank" rel="noopener noreferrer" title="Watch video"
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
              {videoIcon}
            </a>
          )}
        </div>
        {prize.current_participant && (
          <div className="mt-2 rounded-md px-3 py-1 text-center overflow-hidden" style={headerStrip}>
            <span className="text-xs font-bold" style={{ color: '#fff' }}>
              {prize.current_participant}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          <span className="mr-1">{getFlag(prize.current_team)}</span>
          {prize.current_team}
        </p>
        {prize.video_url && (
          <a href={prize.video_url} target="_blank" rel="noopener noreferrer" title="Watch video"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
            {videoIcon}
          </a>
        )}
      </div>
      {prize.value_label && (
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{prize.value_label}</p>
      )}
      {prize.current_participant && (
        <div className="mt-2 rounded-md px-3 py-1 text-center overflow-hidden" style={headerStrip}>
          <span className="text-xs font-bold" style={{ color: '#fff' }}>
            {prize.current_participant}
          </span>
        </div>
      )}
    </div>
  );
}

export default function PrizeCard({ prize, prizeAmount }: { prize: Prize; prizeAmount?: string | null }) {
  if (prize.mystery) {
    return (
      <div
        className="prize-card rounded-xl p-4 flex flex-col h-full relative overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
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

        <div className="relative min-h-12">
          <LeaderSection prize={prize} empty="TBD" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="prize-card rounded-xl p-4 flex flex-col h-full"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
          {prize.slug === 'longest_shot'
            ? <VideoEasterEgg icon="🚀" label="The Thunderbastard" videoSrc="/van-bronckhorst.mp4" fontSize="1.5rem" />
            : prize.slug === 'most_cards'
            ? <VideoEasterEgg icon="🟨" label="The Gareth Barry Award" videoSrc="/zidane.mp4" fontSize="1.5rem" />
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

      <div className="min-h-12">
        <LeaderSection prize={prize} empty="No leader yet" />
      </div>
    </div>
  );
}
