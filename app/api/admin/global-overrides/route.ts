import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const rows = await sql`
    SELECT DISTINCT ON (category) category, team_name, value_label, notes
    FROM prize_overrides
    ORDER BY category, updated_at DESC NULLS LAST
  `;
  return NextResponse.json({ overrides: rows });
}
