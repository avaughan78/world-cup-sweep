import { NextRequest, NextResponse } from 'next/server';
import { setParticipantPaid } from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { team_name, paid } = await req.json() as { team_name?: string; paid?: boolean };
  if (!team_name) return NextResponse.json({ error: 'team_name required' }, { status: 400 });
  if (typeof paid !== 'boolean') return NextResponse.json({ error: 'paid must be boolean' }, { status: 400 });
  await setParticipantPaid(auth.companyId, team_name, paid);
  return NextResponse.json({ ok: true });
}
