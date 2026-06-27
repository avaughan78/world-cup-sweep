'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import { GROUPS_2026 } from '@/lib/groups';
import Flag from './Flag';

const KNOWN_TEAMS = new Set(Object.values(GROUPS_2026).flat());

const BRACKET_STAGES = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];

const STAGE_SHORT: Record<string, string> = {
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  FINAL: 'Final',
};

// How many R32 slots each round's match occupies vertically
const MULTIPLIER: Record<string, number> = {
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINALS: 4,
  SEMI_FINALS: 8,
  FINAL: 16,
};

const SLOT = 72;     // px per base slot
const CARD_H = 62;   // px actual card height
const COL_W = 172;   // px column width
const CONN_W = 22;   // px connector gap between columns
const HEADER_H = 28; // px column header height
const TOTAL_H = 16 * SLOT;

function formatKickoff(utcDate: string): string {
  const d = new Date(utcDate);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

function TeamRow({
  name, score, isWinner, isKnown, isLive, participant,
}: {
  name: string;
  score: number | null | undefined;
  isWinner: boolean;
  isKnown: boolean;
  isLive: boolean;
  participant: string | null;
}) {
  const rowH = (CARD_H - 1) / 2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: rowH, gap: 5, padding: '0 8px' }}>
      {isKnown ? (
        <Flag team={name} height="0.62rem" width="0.88rem" />
      ) : (
        <div style={{ width: '0.88rem', height: '0.62rem', borderRadius: 1, background: 'var(--border)', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.68rem',
          fontWeight: isWinner ? 700 : 400,
          color: isKnown ? (isWinner ? 'var(--text-primary)' : 'var(--text-secondary)') : 'var(--text-muted)',
          lineHeight: 1.2,
        }}>
          {isKnown ? name : 'TBC'}
        </span>
        {participant && isKnown && (
          <span style={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
            lineHeight: 1.1,
          }}>
            {participant}
          </span>
        )}
      </div>
      {score != null && (
        <span style={{
          fontSize: '0.7rem',
          fontWeight: isWinner ? 700 : 400,
          color: isLive ? '#ef4444' : (isWinner ? 'var(--text-primary)' : 'var(--text-muted)'),
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          paddingLeft: 3,
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

function BracketCard({ match, participantMap }: { match: MatchFixture; participantMap: Record<string, string | null> }) {
  const finished = match.status === 'FINISHED';
  const live = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const hasScore = match.homeScore != null && match.awayScore != null;
  const homeWins = finished && hasScore && match.homeScore! > match.awayScore!;
  const awayWins = finished && hasScore && match.awayScore! > match.homeScore!;
  const homeKnown = !!match.homeTeam && KNOWN_TEAMS.has(match.homeTeam);
  const awayKnown = !!match.awayTeam && KNOWN_TEAMS.has(match.awayTeam);

  return (
    <div style={{
      width: COL_W,
      height: CARD_H,
      background: 'var(--card)',
      border: `1px solid ${live ? '#ef4444' : 'var(--border)'}`,
      borderRadius: 7,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <TeamRow
        name={match.homeTeam}
        score={hasScore ? match.homeScore : null}
        isWinner={homeWins}
        isKnown={homeKnown}
        isLive={live}
        participant={participantMap[match.homeTeam] ?? null}
      />
      <div style={{ height: 1, background: 'var(--border)', flexShrink: 0 }} />
      <TeamRow
        name={match.awayTeam}
        score={hasScore ? match.awayScore : null}
        isWinner={awayWins}
        isKnown={awayKnown}
        isLive={live}
        participant={participantMap[match.awayTeam] ?? null}
      />
    </div>
  );
}

function ConnectorSVG({ leftCount, rightCount, leftMult }: { leftCount: number; rightCount: number; leftMult: number }) {
  const mid = CONN_W / 2;
  return (
    <svg width={CONN_W} height={TOTAL_H} style={{ display: 'block' }}>
      {Array.from({ length: rightCount }, (_, i) => {
        const y1 = (i * 2) * leftMult * SLOT + (leftMult * SLOT) / 2;
        const hasSecond = i * 2 + 1 < leftCount;
        const y2 = hasSecond ? (i * 2 + 1) * leftMult * SLOT + (leftMult * SLOT) / 2 : y1;
        const midY = (y1 + y2) / 2;
        const d = hasSecond
          ? `M 0 ${y1} H ${mid} V ${y2} M 0 ${y2} H ${mid} M ${mid} ${midY} H ${CONN_W}`
          : `M 0 ${y1} H ${CONN_W}`;
        return (
          <path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        );
      })}
    </svg>
  );
}

export default function KnockoutView({ participantMap }: { participantMap: Record<string, string | null> }) {
  const [fixtures, setFixtures] = useState<MatchFixture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetch('/api/fixtures')
        .then(r => r.json())
        .then((d: { fixtures?: MatchFixture[] }) => { if (!cancelled) setFixtures(d.fixtures ?? []); })
        .catch(() => { if (!cancelled) setFixtures([]); });
    }
    load();
    const id = setInterval(() => {
      setFixtures(prev => {
        const hasLive = prev?.some(m => m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED');
        if (hasLive) load();
        return prev;
      });
    }, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (fixtures === null) {
    return (
      <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}>
        <span className="text-3xl animate-spin" style={{ animationDuration: '1.2s' }}>⚽</span>
        <span style={{ fontSize: '0.9rem' }}>Loading…</span>
      </div>
    );
  }

  const knockoutFixtures = fixtures.filter(m => m.stage !== 'GROUP_STAGE');

  if (knockoutFixtures.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Knockout fixtures will appear here as the group stage concludes.
      </div>
    );
  }

  const byStage = new Map<string, MatchFixture[]>();
  for (const m of knockoutFixtures) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }
  for (const [stage, matches] of byStage) {
    byStage.set(stage, [...matches].sort((a, b) => a.id - b.id));
  }

  const availableStages = BRACKET_STAGES.filter(s => byStage.has(s));
  const thirdPlace = byStage.get('THIRD_PLACE') ?? [];
  const totalWidth = availableStages.length * COL_W + (availableStages.length - 1) * CONN_W;

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', width: totalWidth, height: TOTAL_H + HEADER_H }}>

          {/* Column headers */}
          {availableStages.map((stage, colIdx) => (
            <div
              key={stage}
              style={{
                position: 'absolute',
                left: colIdx * (COL_W + CONN_W),
                top: 0,
                width: COL_W,
                height: HEADER_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                {STAGE_SHORT[stage] ?? stage}
              </span>
            </div>
          ))}

          {/* Match cards */}
          {availableStages.map((stage, colIdx) => {
            const matches = byStage.get(stage)!;
            const mult = MULTIPLIER[stage] ?? 1;
            const colX = colIdx * (COL_W + CONN_W);
            return matches.map((match, matchIdx) => {
              const top = HEADER_H + matchIdx * mult * SLOT + (mult * SLOT - CARD_H) / 2;
              return (
                <div key={match.id} style={{ position: 'absolute', left: colX, top }}>
                  <BracketCard match={match} participantMap={participantMap} />
                </div>
              );
            });
          })}

          {/* Connectors */}
          {availableStages.slice(0, -1).map((leftStage, colIdx) => {
            const rightStage = availableStages[colIdx + 1];
            const leftMatches = byStage.get(leftStage)!;
            const rightMatches = byStage.get(rightStage) ?? [];
            if (!rightMatches.length) return null;
            return (
              <div
                key={`conn-${colIdx}`}
                style={{ position: 'absolute', left: colIdx * (COL_W + CONN_W) + COL_W, top: HEADER_H }}
              >
                <ConnectorSVG
                  leftCount={leftMatches.length}
                  rightCount={rightMatches.length}
                  leftMult={MULTIPLIER[leftStage] ?? 1}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Third place play-off */}
      {thirdPlace.length > 0 && (
        <div className="mt-5">
          <p className="font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            Third Place Play-off
          </p>
          {thirdPlace.map(m => {
            const finished = m.status === 'FINISHED';
            const live = m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED';
            const hasScore = m.homeScore != null && m.awayScore != null;
            return (
              <div
                key={m.id}
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold" style={{ color: KNOWN_TEAMS.has(m.homeTeam) ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {m.homeTeam || 'TBC'}
                    </span>
                    {KNOWN_TEAMS.has(m.homeTeam) && <Flag team={m.homeTeam} height="0.95rem" width="1.4rem" />}
                  </div>
                  {participantMap[m.homeTeam] && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{participantMap[m.homeTeam]}</span>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg px-3 py-1.5" style={{ background: 'var(--bg)', border: '1px solid var(--border)', minWidth: '5rem' }}>
                  {finished && hasScore ? (
                    <span className="font-black tabular-nums" style={{ color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '0.05em' }}>
                      {m.homeScore} – {m.awayScore}
                    </span>
                  ) : live && hasScore ? (
                    <>
                      <span className="font-black tabular-nums" style={{ color: '#ef4444', fontSize: '1rem' }}>
                        {m.homeScore ?? 0} – {m.awayScore ?? 0}
                      </span>
                      <span className="font-bold uppercase" style={{ color: '#ef4444', fontSize: '0.55rem', letterSpacing: '0.08em' }}>
                        {m.status === 'PAUSED' ? 'HT' : m.elapsed ? `${m.elapsed}'` : 'Live'}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {formatKickoff(m.utcDate)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <div className="flex items-center gap-1.5">
                    {KNOWN_TEAMS.has(m.awayTeam) && <Flag team={m.awayTeam} height="0.95rem" width="1.4rem" />}
                    <span className="font-semibold" style={{ color: KNOWN_TEAMS.has(m.awayTeam) ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {m.awayTeam || 'TBC'}
                    </span>
                  </div>
                  {participantMap[m.awayTeam] && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{participantMap[m.awayTeam]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
