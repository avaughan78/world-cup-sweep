import { NextRequest, NextResponse } from 'next/server';
import { markTeamEliminated } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { team_name, eliminated_at } = await req.json() as { team_name?: string; eliminated_at?: string };
  if (!team_name?.trim()) return NextResponse.json({ error: 'team_name required' }, { status: 400 });

  await markTeamEliminated(team_name.trim(), eliminated_at);
  return NextResponse.json({ ok: true, team_name, eliminated_at: eliminated_at ?? 'now' });
}
