import { NextRequest, NextResponse } from 'next/server';
import { getParticipantByToken } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  if (!checkRateLimit(`resolve:${getIp(req)}`, 30, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — try again shortly' }, { status: 429 });
  }
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  const p = await getParticipantByToken(token);
  if (!p) return NextResponse.json({ error: 'Invalid ticket' }, { status: 404 });
  return NextResponse.json({ team: p.team_name, name: p.participant_name ?? null, company_code: p.company_code });
}
