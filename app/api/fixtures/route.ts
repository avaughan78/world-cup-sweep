import { NextResponse } from 'next/server';
import { normaliseTeamName } from '@/lib/football-api';
import { getLiveWCFixtures, mapStatus } from '@/lib/api-football';

export interface MatchFixture {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  elapsed: number | null;
}

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

  const season = process.env.FOOTBALL_SEASON ?? '2026';
  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?season=${season}`,
      { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[fixtures] API error ${res.status}: ${body.slice(0, 200)}`);
      return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 });
    }
    const data = await res.json() as {
      matches: Array<{
        id: number;
        utcDate: string;
        status: string;
        stage: string;
        group: string | null;
        matchday: number | null;
        homeTeam: { name: string };
        awayTeam: { name: string };
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
      elapsed: null,
    }));

    // Overlay live scores from api-football.com (only returns data during active matches)
    if (process.env.API_FOOTBALL_KEY) {
      try {
        const live = await getLiveWCFixtures();
        for (const lf of live) {
          const home = normaliseTeamName(lf.homeTeam);
          const away = normaliseTeamName(lf.awayTeam);
          const match = fixtures.find(f => f.homeTeam === home && f.awayTeam === away);
          if (match) {
            match.status = mapStatus(lf.statusShort);
            match.homeScore = lf.homeGoals;
            match.awayScore = lf.awayGoals;
            match.elapsed = lf.elapsed;
          }
        }
      } catch (err) {
        console.warn('[fixtures] live overlay failed:', err);
      }
    }

    return NextResponse.json({ fixtures }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[fixtures] error:', err);
    return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
