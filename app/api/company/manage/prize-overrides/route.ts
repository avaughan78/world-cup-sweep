import { NextRequest, NextResponse } from 'next/server';
import { setPrizeOverride } from '@/lib/db';
import sql from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json() as { slug?: string; hidden?: boolean };

  if (body.slug !== undefined && body.hidden !== undefined) {
    await setPrizeOverride(auth.companyId, {
      category: body.slug,
      team_name: body.hidden ? '__hidden__' : null,
      value_label: null,
      notes: null,
    });
    return NextResponse.json({ ok: true });
  }

  const rows = await sql`
    SELECT category, team_name FROM prize_overrides WHERE company_id = ${auth.companyId}
  `;
  return NextResponse.json({ overrides: rows });
}
