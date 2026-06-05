import { NextRequest, NextResponse } from 'next/server';
import { adminSetParticipant } from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { team_name, participant_name } = await req.json() as { team_name?: string; participant_name?: string };
  if (!team_name) return NextResponse.json({ error: 'team_name required' }, { status: 400 });
  const name = (participant_name ?? '').trim();
  if (name.length > 50) return NextResponse.json({ error: 'Name too long' }, { status: 400 });
  await adminSetParticipant(auth.companyId, team_name, name);
  return NextResponse.json({ ok: true });
}
