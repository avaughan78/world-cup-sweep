import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { setPrizeOverride } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const company_id = req.nextUrl.searchParams.get('company_id');
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  const rows = await sql`
    SELECT category, team_name, value_label, notes
    FROM prize_overrides WHERE company_id = ${Number(company_id)}
  `;
  return NextResponse.json({ overrides: rows });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = await req.json() as { company_id?: number; slug?: string; hidden?: boolean };
  if (!body.company_id || !body.slug) {
    return NextResponse.json({ error: 'company_id and slug required' }, { status: 400 });
  }
  await setPrizeOverride(body.company_id, {
    category: body.slug,
    team_name: body.hidden ? '__hidden__' : null,
    value_label: null,
    notes: null,
  });
  return NextResponse.json({ ok: true });
}
