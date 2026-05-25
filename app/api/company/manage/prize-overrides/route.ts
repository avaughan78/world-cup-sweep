import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, setPrizeOverride } from '@/lib/db';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json() as { code?: string; password?: string; slug?: string; hidden?: boolean };
  const auth = await authenticateCompanyAdmin(body.code ?? '', body.password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // If slug + hidden provided: toggle visibility
  if (body.slug !== undefined && body.hidden !== undefined) {
    await setPrizeOverride(auth.company.id, {
      category: body.slug,
      team_name: body.hidden ? '__hidden__' : null,
      value_label: null,
      notes: null,
    });
    return NextResponse.json({ ok: true });
  }

  // Otherwise: return current overrides
  const rows = await sql`
    SELECT category, team_name FROM prize_overrides WHERE company_id = ${auth.company.id}
  `;
  return NextResponse.json({ overrides: rows });
}
