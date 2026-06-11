import { NextResponse } from 'next/server';
import { getWCTopScorers } from '@/lib/api-football';
import { normaliseTeamName } from '@/lib/football-api';

export interface TopScorerEntry {
  playerName: string;
  teamName: string;
  goals: number;
  nationality: string | null;
}

export async function GET() {
  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ scorers: [] });
  }
  try {
    const raw = await getWCTopScorers();
    const scorers: TopScorerEntry[] = raw.map(s => ({
      playerName: s.playerName,
      teamName: normaliseTeamName(s.teamName),
      goals: s.goals,
      nationality: s.nationality,
    }));
    return NextResponse.json({ scorers }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[topscorers]', err);
    return NextResponse.json({ scorers: [] });
  }
}
