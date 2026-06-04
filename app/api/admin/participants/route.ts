import { NextRequest, NextResponse } from 'next/server';
import { getParticipants } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { company_id } = await req.json() as { company_id?: number };
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  const participants = await getParticipants(company_id);
  return NextResponse.json({ ok: true, participants });
}
