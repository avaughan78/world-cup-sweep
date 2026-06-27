'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import { GROUPS_2026 } from '@/lib/groups';
import Flag from './Flag';

const KNOWN_TEAMS = new Set(Object.values(GROUPS_2026).flat());

// 3-letter codes for all WC26 teams
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

// ── Layout ───────────────────────────────────────────────────────────────────
// 8 R32 matches per side → 8 slots. Symmetric bracket flows inward to center.
const SLOT   = 100;   // px per R32 slot (8 slots = full bracket height)
const CARD_W = 96;    // px card width
const CARD_H = 82;    // px card height
const CGAP   = 20;    // px connector gap between round columns
const XGAP   = 48;    // px extra gap either side of center Final column
const HDR    = 36;    // px stage label header row

const TOTAL_H = 8 * SLOT;

// Column left-edge x positions
const LR32 = 0;
const LR16 = LR32 + CARD_W + CGAP;
const LQF  = LR16 + CARD_W + CGAP;
const LSF  = LQF  + CARD_W + CGAP;
const CEN  = LSF  + CARD_W + XGAP;   // Final
const RSF  = CEN  + CARD_W + XGAP;
const RQF  = RSF  + CARD_W + CGAP;
const RR16 = RQF  + CARD_W + CGAP;
const RR32 = RR16 + CARD_W + CGAP;
const TOTAL_W = RR32 + CARD_W;

function fmtDate(utcDate: string) {
  return new Date(utcDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
function fmtTime(utcDate: string) {
  return new Date(utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
}

// Vertical centre of card slot for matchIdx in a given round
function slotTop(matchIdx: number, mult: number) {
  return matchIdx * mult * SLOT + (mult * SLOT - CARD_H) / 2;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TeamCol({
  name, score, wins, loses, known, live,
}: {
  name: string; score: number | null | undefined;
  wins: boolean; loses: boolean; known: boolean; live: boolean;
}) {
  const code = known ? teamCode(name) : 'TBD';
  const nameCol = wins ? 'var(--text-primary)' : loses ? 'var(--text-muted)' : known ? 'var(--text-secondary)' : 'var(--text-muted)';
  const scoreCol = live ? '#ef4444' : wins ? 'var(--green)' : 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
      {known
        ? <Flag team={name} height="0.9rem" width="1.3rem" />
        : <div style={{ width: '1.3rem', height: '0.9rem', borderRadius: 2, background: 'var(--border)' }} />
      }
      <span style={{
        fontSize: '0.62rem', fontWeight: wins ? 700 : 500,
        color: nameCol, letterSpacing: '0.03em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
      }}>
        {code}
      </span>
      {score != null && (
        <span style={{ fontSize: '0.82rem', fontWeight: wins ? 800 : 600, color: scoreCol, lineHeight: 1 }}>
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: MatchFixture }) {
  const finished = match.status === 'FINISHED';
  const live = match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED';
  const hasScore = match.homeScore != null && match.awayScore != null;
  const homeWins = finished && hasScore && match.homeScore! > match.awayScore!;
  const awayWins = finished && hasScore && match.awayScore! > match.homeScore!;
  const homeKnown = !!match.homeTeam && KNOWN_TEAMS.has(match.homeTeam);
  const awayKnown = !!match.awayTeam && KNOWN_TEAMS.has(match.awayTeam);
  const showScore = finished || live;

  let dateNode: React.ReactNode;
  if (live) {
    const elapsed = match.status === 'PAUSED' ? 'HT' : match.elapsed ? `${match.elapsed}'` : 'Live';
    dateNode = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 4px #ef4444' }} />
        <span style={{ fontSize: '0.56rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {elapsed}
        </span>
      </div>
    );
  } else {
    const t = !finished ? ` · ${fmtTime(match.utcDate)}` : '';
    dateNode = (
      <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {finished && <span style={{ fontWeight: 700, marginRight: 3 }}>FT</span>}
        {fmtDate(match.utcDate)}{t}
      </span>
    );
  }

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      background: 'var(--card)',
      border: `1px solid ${live ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
      borderRadius: 9, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 5, padding: '7px 6px 6px',
    }}>
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 4 }}>
        <TeamCol name={match.homeTeam} score={showScore ? (match.homeScore ?? 0) : null}
          wins={homeWins} loses={awayWins} known={homeKnown} live={live} />
        <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', paddingTop: 10, flexShrink: 0 }}>
          {showScore ? '–' : 'v'}
        </span>
        <TeamCol name={match.awayTeam} score={showScore ? (match.awayScore ?? 0) : null}
          wins={awayWins} loses={homeWins} known={awayKnown} live={live} />
      </div>
      <div style={{ lineHeight: 1 }}>{dateNode}</div>
    </div>
  );
}

// Left-side bracket connector (flows right: outer → inner)
function ConnL({ innerCount, outerMult }: { innerCount: number; outerMult: number }) {
  const mid = CGAP / 2;
  return (
    <svg width={CGAP} height={TOTAL_H} style={{ display: 'block' }}>
      {Array.from({ length: innerCount }, (_, i) => {
        const y1 = (i * 2) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const y2 = (i * 2 + 1) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const my = (y1 + y2) / 2;
        return (
          <path key={i}
            d={`M 0 ${y1} H ${mid} V ${y2} M 0 ${y2} H ${mid} M ${mid} ${my} H ${CGAP}`}
            fill="none" stroke="var(--border)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

// Right-side bracket connector (flows left: outer → inner, mirrored)
function ConnR({ innerCount, outerMult }: { innerCount: number; outerMult: number }) {
  const mid = CGAP / 2;
  return (
    <svg width={CGAP} height={TOTAL_H} style={{ display: 'block' }}>
      {Array.from({ length: innerCount }, (_, i) => {
        const y1 = (i * 2) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const y2 = (i * 2 + 1) * outerMult * SLOT + (outerMult * SLOT) / 2;
        const my = (y1 + y2) / 2;
        return (
          <path key={i}
            d={`M ${CGAP} ${y1} H ${mid} V ${y2} M ${CGAP} ${y2} H ${mid} M ${mid} ${my} H 0`}
            fill="none" stroke="var(--border)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KnockoutView({ participantMap: _pm }: { participantMap: Record<string, string | null> }) {
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
  for (const [s, ms] of byStage) byStage.set(s, [...ms].sort((a, b) => a.id - b.id));

  const r32 = byStage.get('ROUND_OF_32') ?? [];
  const r16 = byStage.get('ROUND_OF_16') ?? [];
  const qf  = byStage.get('QUARTER_FINALS') ?? [];
  const sf  = byStage.get('SEMI_FINALS') ?? [];
  const fin = byStage.get('FINAL') ?? [];
  const tp  = byStage.get('THIRD_PLACE') ?? [];

  // Split each round into left (first half) and right (second half)
  const h = (arr: MatchFixture[]) => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))] as const;
  const [r32L, r32R] = h(r32);
  const [r16L, r16R] = h(r16);
  const [qfL,  qfR]  = h(qf);
  const sfL = sf[0] ? [sf[0]] : [];
  const sfR = sf[1] ? [sf[1]] : [];

  const finalMatch = fin[0];
  const finalDone  = finalMatch?.status === 'FINISHED';

  // SF→Final horizontal connector y position (vertical centre of bracket)
  const sfConnY = TOTAL_H / 2;

  const STAGE_HEADERS = [
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

          {/* Stage headers */}
          {STAGE_HEADERS.map(({ label, x }, i) => (
            <div key={i} style={{ position: 'absolute', left: x, top: 0, width: CARD_W, height: HDR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.56rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', textAlign: 'center' }}>
                {label}
              </span>
            </div>
          ))}

          {/* ── LEFT HALF ── */}

          {r32L.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LR32, top: HDR + slotTop(i, 1) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {r16L.length > 0 && r32L.length > 0 && (
            <div style={{ position: 'absolute', left: LR32 + CARD_W, top: HDR }}>
              <ConnL innerCount={r16L.length} outerMult={1} />
            </div>
          )}

          {r16L.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LR16, top: HDR + slotTop(i, 2) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {qfL.length > 0 && r16L.length > 0 && (
            <div style={{ position: 'absolute', left: LR16 + CARD_W, top: HDR }}>
              <ConnL innerCount={qfL.length} outerMult={2} />
            </div>
          )}

          {qfL.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LQF, top: HDR + slotTop(i, 4) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {sfL.length > 0 && qfL.length > 0 && (
            <div style={{ position: 'absolute', left: LQF + CARD_W, top: HDR }}>
              <ConnL innerCount={sfL.length} outerMult={4} />
            </div>
          )}

          {sfL.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: LSF, top: HDR + slotTop(i, 8) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {/* SF left → Final horizontal line */}
          {sfL.length > 0 && fin.length > 0 && (
            <div style={{ position: 'absolute', left: LSF + CARD_W, top: HDR + sfConnY, width: XGAP, height: 1.5, background: 'var(--border)' }} />
          )}

          {/* ── RIGHT HALF ── */}

          {r32R.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RR32, top: HDR + slotTop(i, 1) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {r16R.length > 0 && r32R.length > 0 && (
            <div style={{ position: 'absolute', left: RR16 + CARD_W, top: HDR }}>
              <ConnR innerCount={r16R.length} outerMult={1} />
            </div>
          )}

          {r16R.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RR16, top: HDR + slotTop(i, 2) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {qfR.length > 0 && r16R.length > 0 && (
            <div style={{ position: 'absolute', left: RQF + CARD_W, top: HDR }}>
              <ConnR innerCount={qfR.length} outerMult={2} />
            </div>
          )}

          {qfR.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RQF, top: HDR + slotTop(i, 4) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {sfR.length > 0 && qfR.length > 0 && (
            <div style={{ position: 'absolute', left: RSF + CARD_W, top: HDR }}>
              <ConnR innerCount={sfR.length} outerMult={4} />
            </div>
          )}

          {sfR.map((m, i) => (
            <div key={m.id} style={{ position: 'absolute', left: RSF, top: HDR + slotTop(i, 8) }}>
              <MatchCard match={m} />
            </div>
          ))}

          {/* Final → SF right horizontal line */}
          {sfR.length > 0 && fin.length > 0 && (
            <div style={{ position: 'absolute', left: CEN + CARD_W, top: HDR + sfConnY, width: XGAP, height: 1.5, background: 'var(--border)' }} />
          )}

          {/* ── CENTER ── */}

          {/* Trophy + champion label above Final card */}
          <div style={{
            position: 'absolute', left: CEN, width: CARD_W,
            top: HDR, height: slotTop(0, 8),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            paddingBottom: 10, gap: 3,
          }}>
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🏆</span>
            <span style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', textAlign: 'center' }}>
              {finalDone ? 'Champion' : 'Final'}
            </span>
          </div>

          {/* Final card */}
          {fin.map(m => (
            <div key={m.id} style={{ position: 'absolute', left: CEN, top: HDR + slotTop(0, 8) }}>
              <MatchCard match={m} />
            </div>
          ))}
        </div>
      </div>

      {/* Third place play-off */}
      {tp.length > 0 && (
        <div className="mt-5">
          <p className="font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>
            Third Place Play-off
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {tp.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}
