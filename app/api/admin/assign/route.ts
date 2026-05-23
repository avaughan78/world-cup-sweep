import { NextRequest, NextResponse } from 'next/server';
import { adminSetParticipant } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password, company_id, team_name, participant_name } = await req.json() as {
    password?: string; company_id?: number; team_name?: string; participant_name?: string;
  };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  if (!team_name) return NextResponse.json({ error: 'team_name required' }, { status: 400 });
  try {
    await adminSetParticipant(company_id, team_name, participant_name ?? '');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
