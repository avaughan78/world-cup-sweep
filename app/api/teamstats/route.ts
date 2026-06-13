import { NextResponse } from 'next/server';
import { getAllTeamStats } from '@/lib/db';

export async function GET() {
  const stats = await getAllTeamStats();
  return NextResponse.json({ teamStats: stats }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
