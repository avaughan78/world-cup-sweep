'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import { GROUPS_2026 } from '@/lib/groups';
import Flag from './Flag';

const KNOWN_TEAMS = new Set(Object.values(GROUPS_2026).flat());

// 2026 WC R32 bracket draw — maps each qualifying team to their bracket slot (1-16).
// Slots 1-8 = left bracket (top→bottom), slots 9-16 = right bracket (top→bottom).
// Pairs that share a slot play each other in R32 and their winner advances to R16.
const R32_SLOT: Record<string, number> = {
  'Germany': 1, 'Paraguay': 1,
  'France': 2, 'Sweden': 2,
  'South Africa': 3, 'Canada': 3,
  'Netherlands': 4, 'Morocco': 4,
  'Portugal': 5, 'Croatia': 5,
  'Spain': 6, 'Austria': 6,
  'United States': 7, 'Bosnia and Herzegovina': 7,
  'Belgium': 8, 'Senegal': 8,
  'Brazil': 9, 'Japan': 9,
  'Ivory Coast': 10, 'Norway': 10,
  'Mexico': 11, 'Ecuador': 11,
  'England': 12, 'DR Congo': 12,
  'Argentina': 13, 'Cape Verde': 13,
  'Australia': 14, 'Egypt': 14,
  'Switzerland': 15, 'Algeria': 15,
  'Colombia': 16, 'Ghana': 16,
};

const CODE: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'United States': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Türkiye': 'TUR',
  'Germany': 'GER', 'Curaçao': 'CUW', 'Ivory Coast': 'CIV', 'Ecuador': 'ECU',
  'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Cape Verde': 'CPV', 'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'DR Congo': 'COD', 'Uzbekistan': 'UZB', 'Colombia': 'COL',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
};
function teamCode(name: string) { return CODE[name] ?? name.slice(0, 3).toUpperCase(); }

// ── Layout — tuned to fit max-w-[1080px] container with px-4/px-6 padding ───
// 9 card columns + 6 narrow connector gaps + 2 wide center gaps = ~1022px
const SLOT   = 106;  // px per R32 slot (8 per side = full height)
const CARD_W = 96;   // px card width
const CARD_H = 90;   // px card height (enlarged to fit participant names)
const CGAP   = 15;   // px connector gap between round columns
const XGAP   = 34;   // px gap either side of center Final column
const HDR    = 34;   // px stage-label header row

const TOTAL_H = 8 * SLOT; // 848px

// Column left-edge positions
const LR32 = 0;
const LR16 = LR32 + CARD_W + CGAP;
const LQF  = LR16 + CARD_W + CGAP;
const LSF  = LQF  + CARD_W + CGAP;
const CEN  = LSF  + CARD_W + XGAP;
const RSF  = CEN  + CARD_W + XGAP;
const RQF  = RSF  + CARD_W + CGAP;
const RR16 = RQF  + CARD_W + CGAP;
const RR32 = RR16 + CARD_W + CGAP;
const TOTAL_W = RR32 + CARD_W; // ≈ 982px

// Vertical top of card for matchIdx in round with given slot multiplier
function slotTop(i: number, mult: number) {
  return i * mult * SLOT + (mult * SLOT - CARD_H) / 2;
}

let _pid = 0;
function makePlaceholder(stage: string): MatchFixture {
  return {
    id: --_pid, utcDate: '', status: 'SCHEDULED', stage,
    group: null, matchday: null,
    homeTeam: '', awayTeam: '',
    homeScore: null, awayScore: null, elapsed: null,
  };
}

// Build the R32 array in correct bracket order using the hardcoded slot draw.
// Fixtures are looked up by team name; unscheduled slots get placeholders.
function buildR32(fixtures: MatchFixture[]): MatchFixture[] {
  const bySlot = new Map<number, MatchFixture>();
  for (const m of fixtures) {
    const slot = R32_SLOT[m.homeTeam] ?? R32_SLOT[m.awayTeam];
    if (slot != null) bySlot.set(slot, m);
  }
  return Array.from({ length: 16 }, (_, i) => bySlot.get(i + 1) ?? makePlaceholder('ROUND_OF_32'));
}

function getKOWinner(m: MatchFixture): string {
  if (m.status !== 'FINISHED') return '';
  if (m.homeScore == null || m.awayScore == null) return '';
  if (m.homeScore > m.awayScore) return m.homeTeam;
  if (m.awayScore > m.homeScore) return m.awayTeam;
  return '';
}

// Build a knockout round by cascading winners from prevRound (2n entries → n entries).
// Uses actual API fixtures when they exist (matched by team name), otherwise synthesises
// a placeholder showing known winner(s) vs TBD.
function buildDerivedRound(
  prevRound: MatchFixture[],
  actualFixtures: MatchFixture[],
  stage: string
): MatchFixture[] {
  const count = prevRound.length / 2;
  const usedIdxs = new Set<number>();
  return Array.from({ length: count }, (_, i) => {
    const w1 = getKOWinner(prevRound[i * 2]);
    const w2 = getKOWinner(prevRound[i * 2 + 1]);
    const actualIdx = actualFixtures.findIndex((m, idx) => {
      if (usedIdxs.has(idx)) return false;
      const teams = [m.homeTeam, m.awayTeam];
      return (w1 && teams.includes(w1)) || (w2 && teams.includes(w2));
    });
    if (actualIdx !== -1) {
      usedIdxs.add(actualIdx);
      return actualFixtures[actualIdx];
    }
    return {
      id: --_pid, utcDate: '', status: 'SCHEDULED', stage,
      group: null, matchday: null,
      homeTeam: w1, awayTeam: w2,
      homeScore: null, awayScore: null, elapsed: null,
    };
  });
}

// ── Formatting ────────────────────────────────────────────────────────────────
function fmtDate(utcDate: string) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
function fmtTime(utcDate: string) {
  if (!utcDate) return '';
  return new Date(utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

// ── Card components ───────────────────────────────────────────────────────────

function TeamCol({ name, score, wins, loses, known, live, participant }: {
  name: string; score: number | null | undefined;
  wins: boolean; loses: boolean; known: boolean; live: boolean;
  participant: string | null;
}) {
  const code = known ? teamCode(name) : 'TBD';
  const nameCol = wins ? 'var(--text-primary)' : loses ? 'var(--text-muted)' : known ? 'var(--text-secondary)' : 'var(--text-muted)';
  const scoreCol = live ? '#ef4444' : wins ? 'var(--green)' : 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
      {known
        ? <Flag team={name} height="0.85rem" width="1.22rem" />
        : <div style={{ width: '1.22rem', height: '0.85rem', borderRadius: 2, background: 'var(--border)' }} />
      }
      <span style={{
        fontSize: '0.6rem', fontWeight: wins ? 700 : 500, color: nameCol,
        letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', maxWidth: '100%',
      }}>
        {code}
      </span>
      {score != null && (
        <span style={{ fontSize: '0.8rem', fontWeight: wins ? 800 : 600, color: scoreCol, lineHeight: 1 }}>
          {score}
        </span>
      )}
      {known && participant && (
        <span style={{
          fontSize: '0.5rem', color: 'var(--text-muted)', lineHeight: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {participant.split(' ')[0]}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match, participantMap }: { match: MatchFixture; participantMap: Record<string, string | null> }) {
  const finished = match.status === 'FINISHED';
  const live = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const hasScore = match.homeScore != null && match.awayScore != null;
  const homeWins = finished && hasScore && match.homeScore! > match.awayScore!;
  const awayWins = finished && hasScore && match.awayScore! > match.homeScore!;
  const homeKnown = !!match.homeTeam && KNOWN_TEAMS.has(match.homeTeam);
  const awayKnown = !!match.awayTeam && KNOWN_TEAMS.has(match.awayTeam);
  const showScore = finished || live;
  const homeParticipant = match.homeTeam ? (participantMap[match.homeTeam] ?? null) : null;
  const awayParticipant = match.awayTeam ? (participantMap[match.awayTeam] ?? null) : null;

  const dateStr = fmtDate(match.utcDate);
  const timeStr = match.utcDate && !finished ? fmtTime(match.utcDate) : '';

  let dateNode: React.ReactNode = null;
  if (live) {
    const elapsed = match.status === 'PAUSED' ? 'HT' : match.elapsed ? `${match.elapsed}'` : 'Live';
    dateNode = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 4px #ef4444' }} />
        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {elapsed}
        </span>
      </div>
    );
  } else if (dateStr) {
    dateNode = (
      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {finished && <span style={{ fontWeight: 700, marginRight: 3 }}>FT ·</span>}
        {dateStr}{timeStr ? ` · ${timeStr}` : ''}
      </span>
    );
  }

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: 'var(--card)',
      border: `1px solid ${live ? 'rgba(239,68,68,0.45)' : 'var(--border)'}`,
      borderRadius: 8, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 4, padding: '7px 5px 6px',
    }}>
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 3 }}>
        <TeamCol name={match.homeTeam} score={showScore ? (match.homeScore ?? 0) : null}
          wins={homeWins} loses={awayWins} known={homeKnown} live={live} participant={homeParticipant} />
        <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)', paddingTop: 9, flexShrink: 0 }}>
          {showScore ? '–' : 'v'}
        </span>
        <TeamCol name={match.awayTeam} score={showScore ? (match.awayScore ?? 0) : null}
          wins={awayWins} loses={homeWins} known={awayKnown} live={live} participant={awayParticipant} />
      </div>
      {dateNode && <div style={{ lineHeight: 1 }}>{dateNode}</div>}
    </div>
  );
}

// ── Connector SVGs ────────────────────────────────────────────────────────────

function ConnL({ innerCount, outerMult }: { innerCount: number; outerMult: number }) {
  const mid = CGAP / 2;
  return (
    <svg width={CGAP} height={TOTAL_H} style={{ display: 'block' }}>
      {Array.from({ length: innerCount }, (_, i) => {
        const y1 = (i * 2) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const y2 = (i * 2 + 1) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const my = (y1 + y2) / 2;
        return <path key={i} d={`M 0 ${y1} H ${mid} V ${y2} M 0 ${y2} H ${mid} M ${mid} ${my} H ${CGAP}`}
          fill="none" stroke="var(--border)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
}

function ConnR({ innerCount, outerMult }: { innerCount: number; outerMult: number }) {
  const mid = CGAP / 2;
  return (
    <svg width={CGAP} height={TOTAL_H} style={{ display: 'block' }}>
      {Array.from({ length: innerCount }, (_, i) => {
        const y1 = (i * 2) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const y2 = (i * 2 + 1) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const my = (y1 + y2) / 2;
        return <path key={i} d={`M ${CGAP} ${y1} H ${mid} V ${y2} M ${CGAP} ${y2} H ${mid} M ${mid} ${my} H 0`}
          fill="none" stroke="var(--border)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
        if (prev?.some(m => m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED')) load();
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

  const ko = fixtures.filter(m => m.stage !== 'GROUP_STAGE');

  if (ko.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Knockout fixtures will appear here as the group stage concludes.
      </div>
    );
  }

  const byStage = new Map<string, MatchFixture[]>();
  for (const m of ko) {
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }
  // For R16+ sort by matchday (if set) then utcDate then id
  for (const [s, ms] of byStage) {
    if (s === 'ROUND_OF_32') continue;
    byStage.set(s, [...ms].sort((a, b) => {
      if (a.matchday != null && b.matchday != null) return a.matchday - b.matchday;
      if (a.utcDate && b.utcDate) return a.utcDate.localeCompare(b.utcDate);
      return a.id - b.id;
    }));
  }

  // R32: place fixtures in bracket slots using the hardcoded draw
  const r32 = buildR32(byStage.get('ROUND_OF_32') ?? []);
  // R16+: cascade winners from previous round; use actual API fixtures when available
  const r16 = buildDerivedRound(r32, byStage.get('ROUND_OF_16')    ?? [], 'ROUND_OF_16');
  const qf  = buildDerivedRound(r16, byStage.get('QUARTER_FINALS') ?? [], 'QUARTER_FINALS');
  const sf  = buildDerivedRound(qf,  byStage.get('SEMI_FINALS')    ?? [], 'SEMI_FINALS');
  const fin = buildDerivedRound(sf,  byStage.get('FINAL')          ?? [], 'FINAL');
  const tp  = byStage.get('THIRD_PLACE') ?? [];

  // Split each round into left half (first) and right half (second)
  const h = (arr: MatchFixture[]) => [arr.slice(0, arr.length / 2), arr.slice(arr.length / 2)] as const;
  const [r32L, r32R] = h(r32);
  const [r16L, r16R] = h(r16);
  const [qfL,  qfR]  = h(qf);
  const [sfL,  sfR]  = h(sf);

  const finalMatch = fin[0];
  const finalDone  = finalMatch?.status === 'FINISHED';

  const HEADERS = [
    { label: 'Round of 32', x: LR32 }, { label: 'Round of 16', x: LR16 },
    { label: 'Quarter-finals', x: LQF }, { label: 'Semi-finals', x: LSF },
    { label: 'Final', x: CEN },
    { label: 'Semi-finals', x: RSF }, { label: 'Quarter-finals', x: RQF },
    { label: 'Round of 16', x: RR16 }, { label: 'Round of 32', x: RR32 },
  ];

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', width: TOTAL_W, height: TOTAL_H + HDR }}>

          {/* Stage label headers */}
          {HEADERS.map(({ label, x }, i) => (
            <div key={i} style={{ position: 'absolute', left: x, top: 0, width: CARD_W, height: HDR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.54rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                {label}
              </span>
            </div>
          ))}

          {/* ── LEFT HALF ── */}

          {r32L.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LR32, top: HDR + slotTop(i, 1) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          <div style={{ position: 'absolute', left: LR32 + CARD_W, top: HDR }}>
            <ConnL innerCount={4} outerMult={1} />
          </div>

          {r16L.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LR16, top: HDR + slotTop(i, 2) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          <div style={{ position: 'absolute', left: LR16 + CARD_W, top: HDR }}>
            <ConnL innerCount={2} outerMult={2} />
          </div>

          {qfL.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LQF, top: HDR + slotTop(i, 4) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          <div style={{ position: 'absolute', left: LQF + CARD_W, top: HDR }}>
            <ConnL innerCount={1} outerMult={4} />
          </div>

          {sfL.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LSF, top: HDR + slotTop(i, 8) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          {/* SF left → Final */}
          <div style={{ position: 'absolute', left: LSF + CARD_W, top: HDR + TOTAL_H / 2, width: XGAP, height: 1.5, background: 'var(--border)' }} />

          {/* ── RIGHT HALF ── */}

          {r32R.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RR32, top: HDR + slotTop(i, 1) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          <div style={{ position: 'absolute', left: RR16 + CARD_W, top: HDR }}>
            <ConnR innerCount={4} outerMult={1} />
          </div>

          {r16R.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RR16, top: HDR + slotTop(i, 2) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          <div style={{ position: 'absolute', left: RQF + CARD_W, top: HDR }}>
            <ConnR innerCount={2} outerMult={2} />
          </div>

          {qfR.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RQF, top: HDR + slotTop(i, 4) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          <div style={{ position: 'absolute', left: RSF + CARD_W, top: HDR }}>
            <ConnR innerCount={1} outerMult={4} />
          </div>

          {sfR.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RSF, top: HDR + slotTop(i, 8) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}

          {/* Final → SF right */}
          <div style={{ position: 'absolute', left: CEN + CARD_W, top: HDR + TOTAL_H / 2, width: XGAP, height: 1.5, background: 'var(--border)' }} />

          {/* ── CENTER ── */}

          {/* Trophy above Final card */}
          <div style={{
            position: 'absolute', left: CEN, width: CARD_W,
            top: HDR, height: slotTop(0, 8),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            paddingBottom: 8, gap: 2,
          }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🏆</span>
            <span style={{ fontSize: '0.48rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', textAlign: 'center' }}>
              {finalDone ? 'Champion' : 'Final'}
            </span>
          </div>

          {/* Final card */}
          {fin.map(m => (
            <div key={m.id} style={{ position: 'absolute', left: CEN, top: HDR + slotTop(0, 8) }}>
              <MatchCard match={m} participantMap={participantMap} />
            </div>
          ))}
        </div>
      </div>

      {/* Third place */}
      {tp.length > 0 && (
        <div className="mt-5">
          <p className="font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
            Third Place Play-off
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {tp.map(m => <MatchCard key={m.id} match={m} participantMap={participantMap} />)}
          </div>
        </div>
      )}
    </div>
  );
}
