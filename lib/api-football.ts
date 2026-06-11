const BASE = 'https://v3.football.api-sports.io';

async function apiFetch(path: string) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('API_FOOTBALL_KEY not set');
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': key },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`api-football ${res.status} for ${path}`);
  return res.json();
}

export interface LiveFixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  statusShort: string;
  elapsed: number | null;
}

export interface FixtureEvent {
  elapsed: number;
  team: string;
  player: string;
  type: string;
  detail: string;
}

// Returns currently live WC matches only (league=1). Empty array when nothing is live.
export async function getLiveWCFixtures(): Promise<LiveFixture[]> {
  const data = await apiFetch('/fixtures?live=all&league=1');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((f: any) => ({
    id: f.fixture.id,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    homeGoals: f.goals.home ?? 0,
    awayGoals: f.goals.away ?? 0,
    statusShort: f.fixture.status.short,
    elapsed: f.fixture.status.elapsed ?? null,
  }));
}

// Returns all events (goals, cards, subs) for a specific fixture.
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

// Map api-football.com status shorts to our internal status strings.
export function mapStatus(short: string): string {
  if (['FT', 'AET', 'PEN', 'WO', 'AWD'].includes(short)) return 'FINISHED';
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(short)) return 'IN_PLAY';
  if (['HT', 'BT', 'SUSP', 'INT'].includes(short)) return 'PAUSED';
  if (['PST'].includes(short)) return 'POSTPONED';
  if (['CANC', 'ABD'].includes(short)) return 'CANCELLED';
  return 'TIMED';
}
