CREATE TABLE IF NOT EXISTS country_cache (
  team_name    TEXT PRIMARY KEY,
  capital      TEXT,
  population   BIGINT,
  area         NUMERIC,
  currencies   TEXT[],
  languages    TEXT[],
  wiki_image   TEXT,
  wiki_extract TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
