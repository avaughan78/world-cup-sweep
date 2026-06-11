import { NextRequest, NextResponse } from 'next/server';
import { setCompanyMaxTeams } from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { max_teams_per_person } = await req.json() as { max_teams_per_person?: number };
  if (typeof max_teams_per_person !== 'number') return NextResponse.json({ error: 'max_teams_per_person required' }, { status: 400 });
  const clamped = Math.max(1, Math.min(10, Math.floor(max_teams_per_person)));
  await setCompanyMaxTeams(auth.companyId, clamped);
  return NextResponse.json({ ok: true });
}
