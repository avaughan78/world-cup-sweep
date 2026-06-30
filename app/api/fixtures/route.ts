import { NextResponse } from 'next/server';
import { normaliseTeamName } from '@/lib/football-api';
import { getAllWCFixtures, mapStatus, mapRound } from '@/lib/api-football';
import { GROUPS_2026 } from '@/lib/groups';

export interface MatchFixture {
  id: number;
  utcDate: string;
  status: string;
  statusDetail: 'FT' | 'AET' | 'PEN' | null; // how the match was decided
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHome: number | null;
  penaltyAway: number | null;
  elapsed: number | null;
}

// Build reverse lookup: team name → group letter
const teamToGroup: Record<string, string> = {};
for (const [letter, teams] of Object.entries(GROUPS_2026)) {
  for (const team of teams) teamToGroup[team] = letter;
}

export async function GET() {
  // Primary: api-football.com
  if (process.env.API_FOOTBALL_KEY) {
    try {
      const raw = await getAllWCFixtures();
      const fixtures: MatchFixture[] = raw.map(f => {
        const home = normaliseTeamName(f.homeTeam);
        const away = normaliseTeamName(f.awayTeam);
        const stage = mapRound(f.round);
        const groupLetter = stage === 'GROUP_STAGE' ? (teamToGroup[home] ?? null) : null;
        const group = groupLetter ? `GROUP_${groupLetter}` : null;
        const sd = f.statusShort;
        return {
          id: f.id,
          utcDate: f.date,
          status: mapStatus(sd),
          statusDetail: (sd === 'FT' || sd === 'AET' || sd === 'PEN') ? sd : null,
          stage,
          group,
          matchday: f.roundSlot,
          homeTeam: home,
          awayTeam: away,
          homeScore: f.homeGoals,
          awayScore: f.awayGoals,
          penaltyHome: f.penaltyHome,
          penaltyAway: f.penaltyAway,
          elapsed: f.elapsed,
        };
      });
      return NextResponse.json({ fixtures }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      });
    } catch (err) {
      console.warn('[fixtures] api-football failed, falling back:', err);
    }
  }

  // Fallback: football-data.org
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key configured' }, { status: 500 });

  const season = process.env.FOOTBALL_SEASON ?? '2026';
  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?season=${season}`,
      { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[fixtures] fallback API error ${res.status}: ${body.slice(0, 200)}`);
      return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 });
    }
    const data = await res.json() as {
      matches: Array<{
        id: number; utcDate: string; status: string; stage: string;
        group: string | null; matchday: number | null;
        homeTeam: { name: string }; awayTeam: { name: string };
        score: { fullTime: { home: number | null; away: number | null } };
      }>;
    };
    const fixtures: MatchFixture[] = (data.matches ?? []).map(m => ({
      id: m.id,
      utcDate: m.utcDate,
      status: m.status,
      stage: m.stage,
      group: m.group,
      matchday: m.matchday,
      homeTeam: normaliseTeamName(m.homeTeam.name),
      awayTeam: normaliseTeamName(m.awayTeam.name),
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      penaltyHome: null,
      penaltyAway: null,
      statusDetail: null,
      elapsed: null,
    }));
    return NextResponse.json({ fixtures }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[fixtures] fallback error:', err);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
