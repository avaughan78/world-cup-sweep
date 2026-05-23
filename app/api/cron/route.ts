import { NextRequest, NextResponse } from 'next/server';
import { runSync } from '@/lib/run-sync';

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-sync-key');
  if (!token || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runSync();
  return NextResponse.json(result);
}
