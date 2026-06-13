import { NextResponse } from 'next/server';
import { getHighlights } from '@/lib/db';

export async function GET() {
  const highlights = await getHighlights();
  return NextResponse.json({ highlights }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
