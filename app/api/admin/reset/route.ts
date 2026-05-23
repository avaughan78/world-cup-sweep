import { NextRequest, NextResponse } from 'next/server';
import { resetStatsForNewSeason, logSync } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await resetStatsForNewSeason();
    await logSync('reset', 'success', 'all stats cleared for new season');
    return NextResponse.json({ ok: true, message: 'All stats cleared. Ready for 2026.' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
