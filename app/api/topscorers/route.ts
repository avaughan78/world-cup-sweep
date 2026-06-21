import { NextResponse } from 'next/server';
import { getPlayerGoals } from '@/lib/db';

export interface TopScorerEntry {
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  nationality: string | null;
}

export async function GET() {
  try {
    const rows = await getPlayerGoals();
    const scorers: TopScorerEntry[] = rows.map(r => ({
      playerName: r.player_name,
      teamName: r.team_name,
      goals: r.goals,
      assists: r.assists,
      nationality: r.nationality,
    }));
    return NextResponse.json({ scorers }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('[topscorers]', err);
    return NextResponse.json({ scorers: [] });
  }
}
