import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];
  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      results.push(`OK: ${label}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push(`ERROR: ${label}: ${msg}`);
    }
  };

  await run('create companies table', () => sql`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run('seed default company', () => sql`
    INSERT INTO companies (code, name) VALUES ('DEFAULT', 'Default')
    ON CONFLICT (code) DO NOTHING
  `);
  await run('add company_id to participants', () => sql`
    ALTER TABLE participants ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)
  `);
  await run('backfill participants.company_id', () => sql`
    UPDATE participants SET company_id = (SELECT id FROM companies WHERE code = 'DEFAULT') WHERE company_id IS NULL
  `);
  await run('set participants.company_id NOT NULL', () => sql`
    ALTER TABLE participants ALTER COLUMN company_id SET NOT NULL
  `);
  await run('drop old unique constraint on participants', () => sql`
    ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_team_name_key
  `);
  await run('add new unique constraint on participants', () => sql`
    ALTER TABLE participants ADD CONSTRAINT participants_company_team_unique UNIQUE (company_id, team_name)
  `);
  await run('add company_id to prize_overrides', () => sql`
    ALTER TABLE prize_overrides ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)
  `);
  await run('drop old unique constraint on prize_overrides', () => sql`
    ALTER TABLE prize_overrides DROP CONSTRAINT IF EXISTS prize_overrides_category_key
  `);
  await run('add new unique constraint on prize_overrides', () => sql`
    ALTER TABLE prize_overrides ADD CONSTRAINT prize_overrides_company_category_unique UNIQUE (company_id, category)
  `);

  const hasErrors = results.some(r => r.startsWith('ERROR:'));
  return NextResponse.json({ ok: !hasErrors, results });
}
