import { NextRequest, NextResponse } from 'next/server';
import { adminSetParticipant } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { company_id, team_name, participant_name } = await req.json() as {
    company_id?: number; team_name?: string; participant_name?: string;
  };
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  if (!team_name) return NextResponse.json({ error: 'team_name required' }, { status: 400 });
  const name = (participant_name ?? '').trim();
  if (name.length > 50) return NextResponse.json({ error: 'Name too long' }, { status: 400 });
  try {
    await adminSetParticipant(company_id, team_name, name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
