const BASE = 'https://v3.football.api-sports.io';
const WC_LEAGUE = 1;
const WC_SEASON = Number(process.env.FOOTBALL_SEASON ?? 2026);

async function apiFetch(path: string) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY not set');
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': key },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`api-football ${res.status} for ${path}`);
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`api-football error: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WCFixture {
  id: number;
  date: string;
  statusShort: string;
  elapsed: number | null;
  round: string;
  roundSlot: number | null;  // bracket slot parsed from "Round of 32 - 3" → 3
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  penaltyHome: number | null;
  penaltyAway: number | null;
}

export interface FixtureEvent {
  elapsed: number;
  team: string;
  player: string;
  type: string;   // "Goal" | "Card" | "subst" | "Var"
  detail: string; // "Normal Goal" | "Own Goal" | "Yellow Card" | "Red Card" | "Second Yellow card"
}

export interface WCStandingRow {
  groupName: string; // "Group A"
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface WCTopScorer {
  playerName: string;
  teamName: string;
  goals: number;
  nationality: string | null;
}

// ── Public helpers ─────────────────────────────────────────────────────────────

export async function getAllWCFixtures(): Promise<WCFixture[]> {
  const data = await apiFetch(`/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((f: any) => {
    const round: string = f.league.round ?? '';
    const slotMatch = round.match(/- (\d+)$/);
    return {
      id: f.fixture.id,
      date: f.fixture.date,
      statusShort: f.fixture.status.short,
      elapsed: f.fixture.status.elapsed ?? null,
      round,
      roundSlot: slotMatch ? parseInt(slotMatch[1], 10) : null,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeGoals: f.goals.home,
      awayGoals: f.goals.away,
      penaltyHome: f.score?.penalty?.home ?? null,
      penaltyAway: f.score?.penalty?.away ?? null,
    };
  });
}

// Returns currently live WC matches only. Empty array when nothing is live.
export async function getLiveWCFixtures(): Promise<WCFixture[]> {
  const data = await apiFetch(`/fixtures?live=all&league=${WC_LEAGUE}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((f: any) => ({
    id: f.fixture.id,
    date: f.fixture.date,
    statusShort: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed ?? null,
    round: f.league.round ?? '',
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeGoals: f.goals.home ?? 0,
    awayGoals: f.goals.away ?? 0,
  }));
}

export async function getFixtureEvents(fixtureId: number): Promise<FixtureEvent[]> {
  const data = await apiFetch(`/fixtures/events?fixture=${fixtureId}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((e: any) => ({
    elapsed: e.time.elapsed,
    team: e.team.name,
    player: e.player.name ?? '',
    type: e.type,
    detail: e.detail,
  }));
}

export async function getWCStandings(): Promise<WCStandingRow[]> {
  const data = await apiFetch(`/standings?league=${WC_LEAGUE}&season=${WC_SEASON}`);
  const rows: WCStandingRow[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups: any[][] = data.response?.[0]?.league?.standings ?? [];
  for (const group of groups) {
    for (const row of group) {
      rows.push({
        groupName: row.group ?? '',
        rank: row.rank,
        team: row.team.name,
        played: row.all?.played ?? 0,
        won: row.all?.win ?? 0,
        drawn: row.all?.draw ?? 0,
        lost: row.all?.lose ?? 0,
        goalsFor: row.all?.goals?.for ?? 0,
        goalsAgainst: row.all?.goals?.against ?? 0,
        goalDiff: row.goalsDiff ?? 0,
        points: row.points ?? 0,
      });
    }
  }
  return rows;
}

export async function getWCTopScorers(): Promise<WCTopScorer[]> {
  const data = await apiFetch(`/players/topscorers?league=${WC_LEAGUE}&season=${WC_SEASON}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((s: any) => ({
    playerName: s.player.name,
    teamName: s.statistics?.[0]?.team?.name ?? '',
    goals: s.statistics?.[0]?.goals?.total ?? 0,
    nationality: s.player.nationality ?? null,
  }));
}

// Map api-football.com status short codes to our internal status strings.
export function mapStatus(short: string): string {
  if (['FT', 'AET', 'PEN', 'WO', 'AWD'].includes(short)) return 'FINISHED';
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(short)) return 'IN_PLAY';
  if (['HT', 'BT', 'SUSP', 'INT'].includes(short)) return 'PAUSED';
  if (['PST'].includes(short)) return 'POSTPONED';
  if (['CANC', 'ABD'].includes(short)) return 'CANCELLED';
  return 'TIMED';
}

// Map api-football.com round strings to our internal stage codes.
export function mapRound(round: string): string {
  if (round.startsWith('Group Stage')) return 'GROUP_STAGE';
  if (round.includes('Round of 32')) return 'ROUND_OF_32';
  if (round.includes('Round of 16')) return 'ROUND_OF_16';
  if (round.toLowerCase().includes('quarter')) return 'QUARTER_FINALS';
  if (round.toLowerCase().includes('semi')) return 'SEMI_FINALS';
  if (round.includes('3rd') || round.toLowerCase().includes('third')) return 'THIRD_PLACE';
  if (round === 'Final') return 'FINAL';
  return round;
}
