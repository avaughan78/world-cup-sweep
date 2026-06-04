import { NextRequest, NextResponse } from 'next/server';
import { getParticipantByToken, claimTeam } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(`claim:${ip}`, 20, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — try again shortly' }, { status: 429 });
  }

  const { token, name } = await req.json() as { token?: string; name?: string };
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (trimmed.length > 50) return NextResponse.json({ error: 'Name too long' }, { status: 400 });

  const participant = await getParticipantByToken(token);
  if (!participant) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

  await claimTeam(token, trimmed);
  return NextResponse.json({ ok: true, team: participant.team_name, name: trimmed, company_code: participant.company_code });
}
