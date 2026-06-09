import type { Prize } from '@/lib/prizes';
import Flag from './Flag';
import TicketBadge from './TicketBadge';
import VideoEasterEgg from './VideoEasterEgg';
import SimunicModal from './SimunicModal';
import DerbyModal from './DerbyModal';
import PrizeVideoModal from './PrizeVideoModal';

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
    const nameEl = prize.video_url
      ? <PrizeVideoModal name={playerName} team={prize.current_team} videoUrl={prize.video_url} prizeName={prize.name} />
      : <span className="font-semibold">{playerName}</span>;
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Flag team={prize.current_team} height="1.1rem" />
        <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {nameEl}
        </span>
        {yards && (
          <span className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded-md"
            style={{ color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            {yards} yds
          </span>
        )}
      </div>
    );
  }

  const playerMode = prize.slug === 'bicycle';
  const displayName = playerMode ? (prize.value_label ?? prize.current_team) : prize.current_team;
  const nameEl = prize.video_url
    ? <PrizeVideoModal name={displayName} team={prize.current_team} videoUrl={prize.video_url} prizeName={prize.name} />
    : <span>{displayName}</span>;

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Flag team={prize.current_team} height="1.1rem" />
      <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
        {nameEl}
      </span>
      {!playerMode && !prize.video_url && prize.value_label && (
        <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{prize.value_label}</span>
      )}
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
              ? <VideoEasterEgg icon="😬" label="OG" videoSrc={process.env.NEXT_PUBLIC_VIDEO_OWN_GOAL || '/haiti-own-goal.mp4'} fontSize="2rem" />
              : prize.slug === 'bicycle'
              ? <VideoEasterEgg icon="🤸" label="The Bicycle" videoSrc={process.env.NEXT_PUBLIC_VIDEO_BICYCLE || '/richarlison.mp4'} fontSize="2rem" />
              : <span className="text-4xl leading-none">{prize.icon}</span>
            }
            <TicketBadge amount="?" />
          </div>
          <p className="prize-name font-black text-xl mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
            {prize.name}
          </p>
          <p className="prize-description text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {prize.description}
          </p>
        </div>

        <hr className="my-3 relative" style={{ borderColor: 'var(--border)' }} />

        <div className="relative min-h-[2rem]">
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
            ? <VideoEasterEgg icon="🚀" label="The Thunderbastard" videoSrc={process.env.NEXT_PUBLIC_VIDEO_THUNDERBASTARD || '/van-bronckhorst.mp4'} fontSize="2rem" />
            : prize.slug === 'most_cards'
            ? <VideoEasterEgg icon="🟨" label="The Josip Šimunić Award" modalTitle="Filthy Play" videoSrc={process.env.NEXT_PUBLIC_VIDEO_ZIDANE || '/zidane.mp4'} fontSize="2rem" />
            : (
              <span
                className="text-4xl leading-none"
                style={prize.slug === 'top_scorer_team' ? { filter: 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.15)' } : undefined}
              >{prize.icon}</span>
            )
          }
          {prizeAmount && <TicketBadge amount={prizeAmount} />}
        </div>
        <p className="prize-name font-black text-xl mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
          {prize.slug === 'most_cards' ? <SimunicModal /> : prize.slug === 'sieve' ? <DerbyModal /> : prize.name}
        </p>
        <p className="prize-description text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {prize.description}
        </p>
      </div>

      <hr className="my-3" style={{ borderColor: 'var(--border)' }} />

      <div className="min-h-[2rem]">
        <LeaderSection prize={prize} empty={prize.slug === 'longest_shot' ? 'Awaiting some magic...' : 'No leader yet'} />
      </div>
      <ParticipantStrip name={prize.current_participant} />
    </div>
  );
}
