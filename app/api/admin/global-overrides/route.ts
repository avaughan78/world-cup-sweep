import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (!pw || pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`
    SELECT DISTINCT ON (category) category, team_name, value_label, notes
    FROM prize_overrides
    ORDER BY category, updated_at DESC NULLS LAST
  `;
  return NextResponse.json({ overrides: rows });
}
