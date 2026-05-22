import { NextRequest, NextResponse } from 'next/server';
import { runSync } from '@/lib/run-sync';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runSync();
  return NextResponse.json(result);
}
