import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, adminSetParticipant } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code, password, team_name, participant_name } = await req.json() as {
    code?: string; password?: string; team_name?: string; participant_name?: string;
  };
  const auth = await authenticateCompanyAdmin(code ?? '', password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!team_name) return NextResponse.json({ error: 'team_name required' }, { status: 400 });
  await adminSetParticipant(auth.company.id, team_name, participant_name ?? '');
  return NextResponse.json({ ok: true });
}
