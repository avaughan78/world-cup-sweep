const BASE_URL = 'https://api.football-data.org/v4';

// Set FOOTBALL_SEASON=2022 in .env.local to test against the completed Qatar World Cup
function season() {
  return process.env.FOOTBALL_SEASON ?? '2026';
}

async function footballFetch(path: string) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY not set');

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': apiKey },
    next: { revalidate: 300 },
  });

  if (res.status === 429) throw new Error('Football API rate limited');
  if (!res.ok) throw new Error(`Football API ${res.status} for ${path}`);
  return res.json();
}

export interface ApiGoal {
  minute: number;
  type: 'REGULAR' | 'OWN_GOAL' | 'PENALTY';
  team: { id: number; name: string };
  scorer: { id: number; name: string } | null;
}

export interface ApiBooking {
  minute: number;
  team: { id: number; name: string };
  player: { id: number; name: string };
  card: 'YELLOW' | 'RED' | 'YELLOW_RED';
}

export interface ApiMatch {
  id: number;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
  goals: ApiGoal[];
  bookings: ApiBooking[];
}

export interface ApiScorer {
  player: { id: number; name: string; nationality: string };
  team: { id: number; name: string };
  goals: number;
  assists: number | null;
}

export interface ApiStandingRow {
  position: number;
  team: { id: number; name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface ApiStanding {
  stage: string;
  type: string;
  group: string | null;
  table: ApiStandingRow[];
}

export async function getFinishedMatches(): Promise<ApiMatch[]> {
  // Never use status=FINISHED in the URL — it causes a 400 when no matches exist yet
  // (pre-tournament or historical seasons on the free tier). Filter in code instead.
  const data = await footballFetch(`/competitions/WC/matches?season=${season()}`);
  const matches = (data.matches as ApiMatch[]) ?? [];
  return matches.filter(m => m.status === 'FINISHED');
}

export async function getTopScorers(): Promise<ApiScorer[]> {
  try {
    const data = await footballFetch(`/competitions/WC/scorers?season=${season()}&limit=10`);
    return (data.scorers as ApiScorer[]) ?? [];
  } catch {
    return [];
  }
}

export async function getStandings(): Promise<ApiStanding[]> {
  try {
    const data = await footballFetch(`/competitions/WC/standings?season=${season()}`);
    return (data.standings as ApiStanding[]) ?? [];
  } catch {
    return [];
  }
}

// Map API team names → spreadsheet names where they differ
const TEAM_NAME_MAP: Record<string, string> = {
  Turkey: 'Türkiye',
  Turkiye: 'Türkiye',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Congo DR': 'DR Congo',
  'Korea Republic': 'South Korea',
  'Republic of Korea': 'South Korea',
  USA: 'United States',
  'United States of America': 'United States',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Cabo Verde': 'Cape Verde',
  'Czech Republic': 'Czechia',
  // api-football.com variants
  'IR Iran': 'Iran',
  México: 'Mexico',
  'Trinidad and Tobago': 'Trinidad And Tobago',
  'Korea DPR': 'North Korea',
  'Kyrgyz Republic': 'Kyrgyzstan',
};

export function normaliseTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}
