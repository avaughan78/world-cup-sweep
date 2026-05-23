import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, getParticipants } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code, password } = await req.json() as { code?: string; password?: string };
  const auth = await authenticateCompanyAdmin(code ?? '', password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const participants = await getParticipants(auth.company.id);
  return NextResponse.json({ ok: true, participants });
}
