import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// Sets or clears __hidden__ for a prize slug across ALL companies
export async function POST(req: NextRequest) {
  const body = await req.json() as { password?: string; slug?: string; hidden?: boolean };
  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!body.slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const hide = body.hidden !== false; // default true for backwards compat
  const companies = await sql`SELECT id FROM companies`;
  for (const c of companies) {
    if (hide) {
      await sql`
        INSERT INTO prize_overrides (company_id, category, team_name, value_label, notes, updated_at)
        VALUES (${c.id as number}, ${body.slug}, '__hidden__', null, null, NOW())
        ON CONFLICT (company_id, category) DO UPDATE
          SET team_name = '__hidden__', value_label = null, notes = null, updated_at = NOW()
      `;
    } else {
      await sql`
        DELETE FROM prize_overrides
        WHERE company_id = ${c.id as number} AND category = ${body.slug} AND team_name = '__hidden__'
      `;
    }
  }
  return NextResponse.json({ ok: true, companies: companies.length });
}
