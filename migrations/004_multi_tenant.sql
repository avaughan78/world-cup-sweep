-- Multi-tenant support: partition participants and prize_overrides by company

CREATE TABLE IF NOT EXISTS companies (
  id   SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,   -- short identifier, e.g. 'ACME26'
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default company for any pre-existing data
INSERT INTO companies (code, name) VALUES ('DEFAULT', 'Default')
ON CONFLICT (code) DO NOTHING;

-- Add company_id to participants (nullable first so we can backfill)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
UPDATE participants SET company_id = (SELECT id FROM companies WHERE code = 'DEFAULT') WHERE company_id IS NULL;
ALTER TABLE participants ALTER COLUMN company_id SET NOT NULL;

-- team_name unique per company, not globally
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_team_name_key;
ALTER TABLE participants ADD CONSTRAINT participants_company_team_unique UNIQUE (company_id, team_name);

-- Add company_id to prize_overrides
ALTER TABLE prize_overrides ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE prize_overrides DROP CONSTRAINT IF EXISTS prize_overrides_category_key;
ALTER TABLE prize_overrides ADD CONSTRAINT prize_overrides_company_category_unique UNIQUE (company_id, category);
