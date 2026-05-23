import { NextRequest, NextResponse } from 'next/server';
import { getParticipants } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password, company_id } = await req.json() as { password?: string; company_id?: number };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  const participants = await getParticipants(company_id);
  return NextResponse.json({ ok: true, participants });
}
