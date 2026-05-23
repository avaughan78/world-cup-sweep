import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `INSERT INTO companies (code, name) VALUES ('DEFAULT', 'Default') ON CONFLICT (code) DO NOTHING`,
  `ALTER TABLE participants ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`,
  `UPDATE participants SET company_id = (SELECT id FROM companies WHERE code = 'DEFAULT') WHERE company_id IS NULL`,
  `ALTER TABLE participants ALTER COLUMN company_id SET NOT NULL`,
  `ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_team_name_key`,
  `ALTER TABLE participants ADD CONSTRAINT participants_company_team_unique UNIQUE (company_id, team_name)`,
  `ALTER TABLE prize_overrides ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`,
  `ALTER TABLE prize_overrides DROP CONSTRAINT IF EXISTS prize_overrides_category_key`,
  `ALTER TABLE prize_overrides ADD CONSTRAINT prize_overrides_company_category_unique UNIQUE (company_id, category)`,
];

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];
  for (const stmt of STATEMENTS) {
    try {
      await sql.unsafe(stmt);
      results.push(`OK: ${stmt.slice(0, 60).replace(/\s+/g, ' ')}…`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`SKIP/ERROR: ${msg}`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
