'use client';

import { useEffect, useState } from 'react';
import type { MatchFixture } from '@/app/api/fixtures/route';
import { GROUPS_2026 } from '@/lib/groups';
import Flag from './Flag';

const KNOWN_TEAMS = new Set(Object.values(GROUPS_2026).flat());

// Main bracket stages in bracket order — THIRD_PLACE handled separately
const BRACKET_STAGES = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'] as const;
type BracketStage = typeof BRACKET_STAGES[number];

const STAGE_SHORT: Record<string, string> = {
  ROUND_OF_32: 'R32', ROUND_OF_16: 'R16', QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF', FINAL: 'Final', THIRD_PLACE: '3rd Place',
};
const STAGE_FULL: Record<string, string> = {
  ROUND_OF_32: 'Round of 32', ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals', SEMI_FINALS: 'Semi-finals',
  FINAL: 'Final', THIRD_PLACE: 'Third Place Playoff',
};

const BRAND_STRIPE = 'linear-gradient(to right, #4D10C8, #D40100, #9DC417)';

// In a balanced 32-team bracket, match i in stageIndex feeds into match ⌊i/2⌋ in stage+1.
// Each stage's match[i] occupies rows [i*span+1 .. (i+1)*span] in a 16-row grid.
function gridRow(stageIndex: number, matchIndex: number): string {
  const span = Math.pow(2, stageIndex); // R32=1, R16=2, QF=4, SF=8, Final=16
  return `${matchIndex * span + 1} / span ${span}`;
}

function isKnown(name: string) { return !!name && KNOWN_TEAMS.has(name); }
function didWin(m: MatchFixture, side: 'home' | 'away') {
  if (m.status !== 'FINISHED' || m.homeScore == null || m.awayScore == null) return false;
  return side === 'home' ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
}

// ── Mini card (compact preview) ───────────────────────────────────────────────

function MiniTeamRow({ team, score, dimmed, live }: { team: string; score: number | null; dimmed: boolean; live: boolean }) {
  return (
    <div className="flex items-center justify-between gap-1 px-1.5 py-1" style={{ opacity: dimmed ? 0.38 : 1 }}>
      <div className="flex items-center gap-1 min-w-0">
        {isKnown(team)
          ? <Flag team={team} height="0.65rem" width="0.95rem" />
          : <span style={{ width: '0.95rem', height: '0.65rem', display: 'inline-block', background: 'var(--border)', borderRadius: '2px', flexShrink: 0 }} />}
        <span className="truncate" style={{ fontSize: '0.58rem', fontWeight: 700, color: isKnown(team) ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {team || 'TBC'}
        </span>
      </div>
      {score != null && (
        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: live ? '#ef4444' : 'var(--text-primary)', flexShrink: 0 }}>
          {score}
        </span>
      )}
    </div>
  );
}

function MiniCard({ m }: { m: MatchFixture }) {
  const hw = didWin(m, 'home'), aw = didWin(m, 'away');
  const finished = m.status === 'FINISHED';
  const live = ['IN_PLAY', 'LIVE', 'PAUSED'].includes(m.status);
  const showScore = finished || live;
  return (
    <div className="rounded-md overflow-hidden w-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <MiniTeamRow team={m.homeTeam} score={showScore ? m.homeScore : null} dimmed={finished && aw} live={live} />
      <div style={{ height: '1px', background: 'var(--border)' }} />
      <MiniTeamRow team={m.awayTeam} score={showScore ? m.awayScore : null} dimmed={finished && hw} live={live} />
    </div>
  );
}

// ── Full card (modal) ─────────────────────────────────────────────────────────

function FullTeamRow({ team, score, dimmed, live, participant }: {
  team: string; score: number | null; dimmed: boolean; live: boolean; participant: string | null;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5" style={{ opacity: dimmed ? 0.35 : 1 }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isKnown(team)
            ? <Flag team={team} height="0.85rem" width="1.2rem" />
            : <span style={{ width: '1.2rem', height: '0.85rem', display: 'inline-block', background: 'var(--border)', borderRadius: '2px', flexShrink: 0 }} />}
          <span className="font-bold truncate" style={{ fontSize: '0.8rem', color: isKnown(team) ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {team || 'TBC'}
          </span>
        </div>
        {participant && (
          <p className="truncate" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', paddingLeft: '1.7rem', marginTop: '1px' }}>
            {participant}
          </p>
        )}
      </div>
      {score != null && (
        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: live ? '#ef4444' : 'var(--text-primary)', flexShrink: 0 }}>
          {score}
        </span>
      )}
    </div>
  );
}

function FullCard({ m, participantMap }: { m: MatchFixture; participantMap: Record<string, string | null> }) {
  const hw = didWin(m, 'home'), aw = didWin(m, 'away');
  const finished = m.status === 'FINISHED';
  const live = ['IN_PLAY', 'LIVE', 'PAUSED'].includes(m.status);
  const showScore = finished || live;

  const dateStr = new Date(m.utcDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const timeStr = new Date(m.utcDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  const header = live
    ? (m.status === 'PAUSED' ? 'Half time' : m.elapsed ? `${m.elapsed}'` : 'Live')
    : `${dateStr} · ${timeStr}`;

  return (
    <div className="rounded-xl overflow-hidden w-full" style={{ background: 'var(--card)', border: `1px solid ${live ? '#ef4444' : 'var(--border)'}` }}>
      <div className="px-3 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '0.57rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: live ? '#ef4444' : 'var(--text-muted)' }}>
          {header}
        </span>
      </div>
      <FullTeamRow
        team={m.homeTeam} score={showScore ? m.homeScore : null}
        dimmed={finished && aw} live={live} participant={participantMap[m.homeTeam] ?? null}
      />
      <div style={{ height: '1px', background: 'var(--border)' }} />
      <FullTeamRow
        team={m.awayTeam} score={showScore ? m.awayScore : null}
        dimmed={finished && hw} live={live} participant={participantMap[m.awayTeam] ?? null}
      />
    </div>
  );
}

// ── Bracket grid ──────────────────────────────────────────────────────────────
// Uses a single CSS Grid (16 rows) shared across all columns so matches are
// automatically vertically centred between their two feeder matches.

function BracketGrid({
  byStage, presentStages, participantMap, slotPx, cardPx, colGapPx, mini,
}: {
  byStage: Map<string, MatchFixture[]>;
  presentStages: BracketStage[];
  participantMap: Record<string, string | null>;
  slotPx: number;   // height of one R32 slot
  cardPx: number;   // width of each match card
  colGapPx: number;
  mini: boolean;
}) {
  const BASE_ROWS = 16;

  return (
    <div>
      {/* Round headers */}
      <div className="flex" style={{ gap: colGapPx, marginBottom: 6 }}>
        {presentStages.map(stage => (
          <div key={stage} style={{ width: cardPx, flexShrink: 0, textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontSize: mini ? '0.53rem' : '0.62rem' }}>
            {mini ? STAGE_SHORT[stage] : STAGE_FULL[stage]}
          </div>
        ))}
      </div>

      {/* All rounds in a single grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: presentStages.map(() => `${cardPx}px`).join(' '),
          gridTemplateRows: `repeat(${BASE_ROWS}, ${slotPx}px)`,
          columnGap: colGapPx,
        }}
      >
        {presentStages.map((stage, si) => {
          const matches = byStage.get(stage) ?? [];
          return matches.map((m, mi) => (
            <div
              key={m.id}
              style={{
                gridColumn: si + 1,
                gridRow: gridRow(si, mi),
                display: 'flex',
                alignItems: 'center',
                padding: `${mini ? 2 : 3}px 0`,
              }}
            >
              {mini
                ? <MiniCard m={m} />
                : <FullCard m={m} participantMap={participantMap} />}
            </div>
          ));
        })}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function BracketModal({ byStage, presentStages, participantMap, onClose }: {
  byStage: Map<string, MatchFixture[]>;
  presentStages: BracketStage[];
  participantMap: Record<string, string | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasThirdPlace = byStage.has('THIRD_PLACE');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(8,8,6,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg)', maxHeight: '95dvh', maxWidth: '1120px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ height: '4px', background: BRAND_STRIPE, flexShrink: 0 }} />

        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '0.78rem' }}>
            Knockout Bracket
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1 p-5">
          <BracketGrid
            byStage={byStage}
            presentStages={presentStages}
            participantMap={participantMap}
            slotPx={96}
            cardPx={190}
            colGapPx={16}
            mini={false}
          />

          {hasThirdPlace && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>
                Third Place Playoff
              </p>
              <div style={{ maxWidth: 190 }}>
                {byStage.get('THIRD_PLACE')!.map(m => (
                  <FullCard key={m.id} m={m} participantMap={participantMap} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function KnockoutView({ participantMap }: { participantMap: Record<string, string | null> }) {
  const [fixtures, setFixtures] = useState<MatchFixture[] | null>(null);
  const [showModal, setShowModal] = useState(false);

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
        if (prev?.some(m => ['IN_PLAY', 'LIVE', 'PAUSED'].includes(m.status))) load();
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

  const presentStages = BRACKET_STAGES.filter(s => byStage.has(s));

  return (
    <>
      {/* Compact preview — click anywhere to open modal */}
      <div
        className="rounded-xl overflow-hidden cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={() => setShowModal(true)}
      >
        <div style={{ height: '3px', background: BRAND_STRIPE }} />
        <div className="overflow-x-auto p-3 pb-2">
          <BracketGrid
            byStage={byStage}
            presentStages={presentStages}
            participantMap={participantMap}
            slotPx={50}
            cardPx={108}
            colGapPx={6}
            mini={true}
          />
        </div>
        <div className="flex justify-end px-3 pb-2.5">
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
            Expand bracket →
          </span>
        </div>
      </div>

      {showModal && (
        <BracketModal
          byStage={byStage}
          presentStages={presentStages}
          participantMap={participantMap}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
