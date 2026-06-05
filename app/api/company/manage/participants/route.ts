import { NextRequest, NextResponse } from 'next/server';
import { getParticipants } from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const participants = await getParticipants(auth.companyId);
  return NextResponse.json({ ok: true, participants });
}
