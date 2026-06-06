import type { Prize } from '@/lib/prizes';
import Flag from './Flag';
import TicketBadge from './TicketBadge';
import VideoEasterEgg from './VideoEasterEgg';
import SimunicModal from './SimunicModal';
import DerbyModal from './DerbyModal';

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="4"/>
    <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="white"/>
  </svg>
);

const headerStrip: React.CSSProperties = {
  backgroundImage: 'url(/wc2026-header-bg.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

// Renders team/player info only — strip is rendered separately at card level
function LeaderSection({ prize, empty }: { prize: Prize; empty: string }) {
  if (!prize.current_team) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{empty}</p>;
  }

  // Thunderbastard: value_label encoded as "Player Name|35" for yards
  if (prize.slug === 'longest_shot') {
    const raw = prize.value_label ?? '';
    const [playerName, yards] = raw.includes('|') ? raw.split('|') : [raw || prize.current_team, null];
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Flag team={prize.current_team} height="1.2rem" />
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {playerName}
            </span>
          </div>
          {prize.video_url && (
            <a href={prize.video_url} target="_blank" rel="noopener noreferrer" title="Watch video" className="flex-shrink-0"
              style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
              {videoIcon}
            </a>
          )}
        </div>
        {yards && (
          <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
            {yards} yds
          </p>
        )}
      </div>
    );
  }

  const playerMode = prize.slug === 'bicycle';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Flag team={prize.current_team} height="1.3rem" />
        <span className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {playerMode ? (prize.value_label ?? prize.current_team) : prize.current_team}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!playerMode && prize.value_label && (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{prize.value_label}</span>
        )}
        {prize.video_url && (
          <a href={prize.video_url} target="_blank" rel="noopener noreferrer" title="Watch video"
            style={{ display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}>
            {videoIcon}
          </a>
        )}
      </div>
    </div>
  );
}

// Fixed-height strip — always rendered so card bottom sections stay the same height
function ParticipantStrip({ name }: { name: string | null }) {
  return (
    <div style={{ height: '2rem', marginTop: '0.5rem' }}>
      {name && (
        <div className="rounded-md px-3 text-center overflow-hidden flex items-center justify-center"
          style={{ ...headerStrip, height: '100%' }}>
          <span className="text-xs font-bold" style={{ color: '#fff' }}>{name}</span>
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
              ? <VideoEasterEgg icon="😬" label="OG" videoSrc="/haiti-own-goal.mp4" fontSize="1.5rem" />
              : prize.slug === 'bicycle'
              ? <VideoEasterEgg icon="🤸" label="The Bicycle" videoSrc="/richarlison.mp4" fontSize="1.5rem" />
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

        <div className="relative min-h-8">
          <LeaderSection prize={prize} empty="Awaiting some magic..." />
        </div>
        <ParticipantStrip name={prize.current_participant} />
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
            ? <VideoEasterEgg icon="🟨" label="The Zidane Award" modalTitle="Filthy Play" videoSrc="/zidane.mp4" fontSize="1.5rem" />
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
          {prize.slug === 'most_cards' ? <SimunicModal /> : prize.slug === 'sieve' ? <DerbyModal /> : prize.name}
        </p>
        <p className="prize-description text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {prize.description}
        </p>
      </div>

      <hr className="my-3" style={{ borderColor: 'var(--border)' }} />

      <div className="min-h-8">
        <LeaderSection prize={prize} empty={prize.slug === 'longest_shot' ? 'Awaiting some magic...' : 'No leader yet'} />
      </div>
      <ParticipantStrip name={prize.current_participant} />
    </div>
  );
}
