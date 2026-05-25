import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { setPrizeOverride } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const password = req.headers.get('x-admin-password');
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const company_id = searchParams.get('company_id');
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  const rows = await sql`
    SELECT category, team_name, value_label, notes
    FROM prize_overrides WHERE company_id = ${Number(company_id)}
  `;
  return NextResponse.json({ overrides: rows });
}

// Sets team_name = '__hidden__' to hide a prize, or clears it to show
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    password?: string; company_id?: number; slug?: string; hidden?: boolean;
  };
  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
