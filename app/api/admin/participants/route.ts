import { NextRequest, NextResponse } from 'next/server';
import { getParticipants } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const participants = await getParticipants();
  return NextResponse.json({ ok: true, participants });
}
