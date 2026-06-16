import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const ALIASES = ['e. Just'];

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  for (const name of ALIASES) {
    await sql`DELETE FROM player_goals WHERE LOWER(player_name) = LOWER(${name})`;
  }

  return NextResponse.json({ ok: true, deleted: ALIASES });
}
