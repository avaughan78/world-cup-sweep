import { NextRequest, NextResponse } from 'next/server';
import { runSync } from '@/lib/run-sync';

export async function POST(req: NextRequest) {
  const syncKey = req.headers.get('x-sync-key');
  if (!syncKey || syncKey !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runSync();
  return NextResponse.json(result);
}
