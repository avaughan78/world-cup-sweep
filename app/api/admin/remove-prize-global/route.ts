import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// Sets __hidden__ for a prize slug across ALL companies
export async function POST(req: NextRequest) {
  const body = await req.json() as { password?: string; slug?: string };
  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!body.slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const companies = await sql`SELECT id FROM companies`;
  for (const c of companies) {
    await sql`
      INSERT INTO prize_overrides (company_id, category, team_name, value_label, notes, updated_at)
      VALUES (${c.id as number}, ${body.slug}, '__hidden__', null, null, NOW())
      ON CONFLICT (company_id, category) DO UPDATE
        SET team_name = '__hidden__', value_label = null, notes = null, updated_at = NOW()
    `;
  }
  return NextResponse.json({ ok: true, companies: companies.length });
}
