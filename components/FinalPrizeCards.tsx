'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import Flag from './Flag';
import TicketBadge from './TicketBadge';

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

  useEffect(() => {
    fetch('/api/fixtures')
      .then(r => r.json())
      .then((d: { fixtures?: MatchFixture[] }) => {
        const final = (d.fixtures ?? []).find(
          f => f.stage === 'FINAL' && f.status === 'FINISHED' &&
               f.homeScore != null && f.awayScore != null
        );
        if (final) {
          if (final.homeScore! > final.awayScore!) {
            setWinner(final.homeTeam);
            setRunnerUp(final.awayTeam);
          } else if (final.awayScore! > final.homeScore!) {
            setWinner(final.awayTeam);
            setRunnerUp(final.homeTeam);
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const cards = [
    { ordinal: '1', sup: 'st', label: 'Tournament Winner', amount: firstAmount,  team: winner },
    { ordinal: '2', sup: 'nd', label: 'Runner-up',         amount: secondAmount, team: runnerUp },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map(({ ordinal, sup, label, amount, team }) => {
        const participant = team && revealed ? (participantMap[team] ?? null) : null;
        return (
          <div
            key={ordinal}
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
