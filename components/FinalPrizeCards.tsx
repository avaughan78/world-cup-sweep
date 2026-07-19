'use client';

import { useEffect, useRef, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import Flag from './Flag';
import TicketBadge from './TicketBadge';

// Primary colours for each team — used to tint the winner fireworks
const TEAM_COLORS: Record<string, string[]> = {
  'Spain':                  ['#c60b1e', '#ffc400'],
  'France':                 ['#002395', '#ED2939', '#ffffff'],
  'Brazil':                 ['#009c3b', '#FFDF00'],
  'Germany':                ['#000000', '#DD0000', '#FFCE00'],
  'England':                ['#CF091B', '#ffffff'],
  'Argentina':              ['#74ACDF', '#ffffff'],
  'Netherlands':            ['#FF6600', '#ffffff'],
  'Portugal':               ['#006600', '#FF0000'],
  'Belgium':                ['#000000', '#FDDA24', '#EF3340'],
  'Morocco':                ['#C1272D', '#006233'],
  'Japan':                  ['#BC002D', '#ffffff'],
  'United States':          ['#B22234', '#ffffff', '#3C3B6E'],
  'Canada':                 ['#FF0000', '#ffffff'],
  'Mexico':                 ['#006847', '#ffffff', '#CE1126'],
  'Australia':              ['#00008B', '#FF0000', '#ffffff'],
  'Colombia':               ['#FCD116', '#003087', '#CE1126'],
  'Norway':                 ['#EF2B2D', '#002868', '#ffffff'],
  'Switzerland':            ['#FF0000', '#ffffff'],
  'Sweden':                 ['#006AA7', '#FECC02'],
  'Croatia':                ['#FF0000', '#ffffff', '#0032A0'],
  'Algeria':                ['#006233', '#D21034', '#ffffff'],
  'Ghana':                  ['#006B3F', '#FCD116', '#EF3340'],
  'Senegal':                ['#00853F', '#FDEF42', '#E31B23'],
  'DR Congo':               ['#007FFF', '#CE1126', '#F7D618'],
  'Ivory Coast':            ['#FF8200', '#ffffff', '#009A44'],
  'Ecuador':                ['#FFD100', '#003DA5'],
  'Paraguay':               ['#D52B1E', '#ffffff', '#0038A8'],
  'Cape Verde':             ['#003893', '#CF2027', '#F7D116'],
  'Austria':                ['#ED2939', '#ffffff'],
  'Bosnia and Herzegovina': ['#002395', '#FFCD00'],
  'Egypt':                  ['#CE1126', '#ffffff'],
  'South Africa':           ['#007A4D', '#FFB81C', '#DE3831'],
};

interface Props {
  participantMap: Record<string, string | null>;
  revealed: boolean;
  firstAmount: string | null;
  secondAmount: string | null;
}

export default function FinalPrizeCards({ participantMap, revealed, firstAmount, secondAmount }: Props) {
  const [winner, setWinner] = useState<string | null>(null);
  const [runnerUp, setRunnerUp] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const winnerCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/fixtures')
      .then(r => r.json())
      .then((d: { fixtures?: MatchFixture[] }) => {
        const final = (d.fixtures ?? []).find(
          f => f.stage === 'FINAL' && f.status === 'FINISHED' &&
               f.homeScore != null && f.awayScore != null
        );
        if (final) {
          let w: string | null = null;
          let ru: string | null = null;
          if (final.homeScore! > final.awayScore!) {
            w = final.homeTeam; ru = final.awayTeam;
          } else if (final.awayScore! > final.homeScore!) {
            w = final.awayTeam; ru = final.homeTeam;
          } else if (final.penaltyHome != null && final.penaltyAway != null) {
            if (final.penaltyHome > final.penaltyAway) { w = final.homeTeam; ru = final.awayTeam; }
            else if (final.penaltyAway > final.penaltyHome) { w = final.awayTeam; ru = final.homeTeam; }
          }
          if (w) { setWinner(w); setRunnerUp(ru); }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Continuous fireworks from the winner card using the team's colours
  useEffect(() => {
    if (!winner) return;
    const colors = TEAM_COLORS[winner] ?? ['#ffffff', '#dddddd'];

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    import('canvas-confetti').then((mod) => {
      if (cancelled) return;
      const confetti = mod.default;

      function getOrigin() {
        if (winnerCardRef.current) {
          const r = winnerCardRef.current.getBoundingClientRect();
          return {
            x: (r.left + r.width / 2) / window.innerWidth,
            y: (r.top + r.height / 2) / window.innerHeight,
          };
        }
        return { x: 0.25, y: 0.3 };
      }

      function burst() {
        if (cancelled) return;
        const origin = getOrigin();
        // Slight random offset each burst so it fans out naturally
        confetti({
          particleCount: 29,
          spread: 55 + Math.random() * 30,
          startVelocity: 28 + Math.random() * 10,
          colors,
          origin: { x: origin.x + (Math.random() - 0.5) * 0.1, y: origin.y },
          ticks: 220,
          gravity: 0.75,
          scalar: 0.9,
          zIndex: 9999,
        });
      }

      burst();
      intervalId = setInterval(burst, 1800);
    });

    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [winner]);

  const cards = [
    { ordinal: '1', sup: 'st', label: 'Tournament Winner', amount: firstAmount,  team: winner,   ref: winnerCardRef },
    { ordinal: '2', sup: 'nd', label: 'Runner-up',         amount: secondAmount, team: runnerUp, ref: undefined },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map(({ ordinal, sup, label, amount, team, ref }) => {
        const participant = team && revealed ? (participantMap[team] ?? null) : null;
        return (
          <div
            key={ordinal}
            ref={ref}
            className="main-prize-card rounded-xl p-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="prize-ordinal text-6xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                {ordinal}<sup className="text-3xl">{sup}</sup>
              </div>
              <div className="flex flex-col items-end gap-2">
                {amount && <TicketBadge amount={amount} />}
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
            </div>

            {loaded && team ? (
              <div className="flex items-center gap-3">
                <Flag team={team} height="2rem" width="2.8rem" />
                <div>
                  <p className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>{team}</p>
                  {participant && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{participant}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-base" style={{ color: 'var(--text-muted)' }}>
                {loaded ? 'Pending the final' : ''}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
