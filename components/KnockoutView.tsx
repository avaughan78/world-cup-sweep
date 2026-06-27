'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import { GROUPS_2026 } from '@/lib/groups';
import Flag from './Flag';

const KNOWN_TEAMS = new Set(Object.values(GROUPS_2026).flat());

const BRACKET_STAGES = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];

const STAGE_LABEL: Record<string, string> = {
  ROUND_OF_32: 'Round of 32',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL: 'Final',
};

const MULTIPLIER: Record<string, number> = {
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINALS: 4,
  SEMI_FINALS: 8,
  FINAL: 16,
};

// Layout constants
const SLOT = 88;      // px height per R32 slot
const DATE_H = 15;    // px date/status header inside each card
const TEAM_H = 30;    // px per team row
const DIV_H = 1;      // divider between team rows
const CARD_H = DATE_H + TEAM_H + DIV_H + TEAM_H; // = 76px
const COL_W = 182;    // px column width
const CONN_W = 28;    // px connector gap between columns
const HEADER_H = 38;  // px stage-label header row
const TOTAL_H = 16 * SLOT; // = 1408px

function fmtDate(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

function fmtTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  });
}

// ── Card sub-components ───────────────────────────────────────────────────────

function CardStatusBar({ match }: { match: MatchFixture }) {
  const live = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const finished = match.status === 'FINISHED';

  if (live) {
    const elapsed = match.status === 'PAUSED' ? 'HT' : match.elapsed ? `${match.elapsed}'` : 'Live';
    return (
      <div style={{
        height: DATE_H,
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 9px',
        background: 'rgba(239,68,68,0.1)',
        borderBottom: '1px solid rgba(239,68,68,0.25)',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#ef4444', flexShrink: 0,
          boxShadow: '0 0 4px #ef4444',
        }} />
        <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {elapsed}
        </span>
      </div>
    );
  }

  const dateStr = fmtDate(match.utcDate);
  const timeStr = !finished ? fmtTime(match.utcDate) : null;

  return (
    <div style={{
      height: DATE_H,
      display: 'flex', alignItems: 'center',
      padding: '0 9px',
      background: 'var(--bg)',
      borderBottom: `1px solid var(--border)`,
      gap: 4,
    }}>
      {finished && (
        <span style={{
          fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.1em',
          color: 'var(--text-muted)', textTransform: 'uppercase',
          marginRight: 2,
        }}>
          FT
        </span>
      )}
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
        {dateStr}
        {timeStr && <> · <span style={{ fontWeight: 600 }}>{timeStr}</span></>}
      </span>
    </div>
  );
}

function TeamRow({
  name, score, wins, loses, known, live,
}: {
  name: string;
  score: number | null | undefined;
  wins: boolean;
  loses: boolean;
  known: boolean;
  live: boolean;
}) {
  const textColor = wins
    ? 'var(--text-primary)'
    : loses
    ? 'var(--text-muted)'
    : known
    ? 'var(--text-secondary)'
    : 'var(--text-muted)';

  const scoreColor = live ? '#ef4444' : wins ? 'var(--green)' : 'var(--text-muted)';
  const rowBg = wins ? 'rgba(34,197,94,0.09)' : 'transparent';

  return (
    <div style={{
      height: TEAM_H,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 9px',
      background: rowBg,
    }}>
      {known ? (
        <Flag team={name} height="0.68rem" width="0.96rem" />
      ) : (
        <div style={{ width: '0.96rem', height: '0.68rem', borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
      )}
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: '0.72rem',
        fontWeight: wins ? 700 : 500,
        color: textColor,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
      }}>
        {known ? name : 'TBC'}
      </span>
      {score != null && (
        <span style={{
          fontSize: '0.8rem',
          fontWeight: wins ? 800 : 600,
          color: scoreColor,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
          minWidth: '1rem',
          textAlign: 'right',
          lineHeight: 1,
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

function BracketCard({ match }: { match: MatchFixture }) {
  const finished = match.status === 'FINISHED';
  const live = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const hasScore = match.homeScore != null && match.awayScore != null;

  const homeWins = finished && hasScore && match.homeScore! > match.awayScore!;
  const awayWins = finished && hasScore && match.awayScore! > match.homeScore!;
  const homeKnown = !!match.homeTeam && KNOWN_TEAMS.has(match.homeTeam);
  const awayKnown = !!match.awayTeam && KNOWN_TEAMS.has(match.awayTeam);
  const showScore = finished || live;

  return (
    <div style={{
      width: COL_W, height: CARD_H,
      background: 'var(--card)',
      border: `1px solid ${live ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
      borderRadius: 9,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <CardStatusBar match={match} />
      <TeamRow
        name={match.homeTeam}
        score={showScore ? (match.homeScore ?? 0) : null}
        wins={homeWins} loses={awayWins}
        known={homeKnown} live={live}
      />
      <div style={{ height: DIV_H, background: 'var(--border)', opacity: 0.5 }} />
      <TeamRow
        name={match.awayTeam}
        score={showScore ? (match.awayScore ?? 0) : null}
        wins={awayWins} loses={homeWins}
        known={awayKnown} live={live}
      />
    </div>
  );
}

// ── Bracket connector SVG ─────────────────────────────────────────────────────

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

// ── Third-place match (inline card, not in bracket grid) ──────────────────────

function ThirdPlaceCard({ match, participantMap }: { match: MatchFixture; participantMap: Record<string, string | null> }) {
  const finished = match.status === 'FINISHED';
  const live = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const hasScore = match.homeScore != null && match.awayScore != null;
  const homeWins = finished && hasScore && match.homeScore! > match.awayScore!;
  const awayWins = finished && hasScore && match.awayScore! > match.homeScore!;
  const homeKnown = KNOWN_TEAMS.has(match.homeTeam);
  const awayKnown = KNOWN_TEAMS.has(match.awayTeam);
  const showScore = finished || live;

  function TeamRowInline({ name, score, wins, loses, known, participant }: {
    name: string; score: number | null | undefined; wins: boolean; loses: boolean; known: boolean; participant: string | null;
  }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 9px', height: TEAM_H, background: wins ? 'rgba(34,197,94,0.09)' : 'transparent' }}>
        {known ? <Flag team={name} height="0.68rem" width="0.96rem" /> : <div style={{ width: '0.96rem', height: '0.68rem', borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: wins ? 700 : 500, color: wins ? 'var(--text-primary)' : loses ? 'var(--text-muted)' : known ? 'var(--text-secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {known ? name : 'TBC'}
          </span>
          {participant && known && (
            <span style={{ display: 'block', fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {participant}
            </span>
          )}
        </div>
        {score != null && (
          <span style={{ fontSize: '0.8rem', fontWeight: wins ? 800 : 600, color: live ? '#ef4444' : wins ? 'var(--green)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: '1rem', textAlign: 'right' }}>
            {score}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: COL_W, borderRadius: 9, overflow: 'hidden', border: `1px solid ${live ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`, background: 'var(--card)' }}>
      <CardStatusBar match={match} />
      <TeamRowInline name={match.homeTeam} score={showScore ? (match.homeScore ?? 0) : null} wins={homeWins} loses={awayWins} known={homeKnown} participant={participantMap[match.homeTeam] ?? null} />
      <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />
      <TeamRowInline name={match.awayTeam} score={showScore ? (match.awayScore ?? 0) : null} wins={awayWins} loses={homeWins} known={awayKnown} participant={participantMap[match.awayTeam] ?? null} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
                top: 0, width: COL_W, height: HEADER_H,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{
                fontSize: '0.62rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.09em',
                color: 'var(--text-muted)',
              }}>
                {STAGE_LABEL[stage] ?? stage}
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
                  <BracketCard match={match} />
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
        <div className="mt-6">
          <p className="font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
            Third Place Play-off
          </p>
          <div className="flex gap-3 flex-wrap">
            {thirdPlace.map(m => (
              <ThirdPlaceCard key={m.id} match={m} participantMap={participantMap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
