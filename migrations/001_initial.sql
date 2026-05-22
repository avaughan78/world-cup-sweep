CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  team_name TEXT UNIQUE NOT NULL,
  participant_name TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_stats (
  id SERIAL PRIMARY KEY,
  team_name TEXT UNIQUE NOT NULL,
  api_team_id INTEGER,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  own_goals_against INTEGER DEFAULT 0,
  is_eliminated BOOLEAN DEFAULT FALSE,
  eliminated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single-row table; upserted with id=1
CREATE TABLE IF NOT EXISTS top_scorer (
  id INTEGER PRIMARY KEY DEFAULT 1,
  player_name TEXT,
  team_name TEXT,
  goals INTEGER DEFAULT 0,
  nationality TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prize_overrides (
  id SERIAL PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  team_name TEXT,
  value_label TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
