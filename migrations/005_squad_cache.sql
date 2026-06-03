CREATE TABLE IF NOT EXISTS squad_cache (
  team_name       TEXT NOT NULL,
  player_name     TEXT NOT NULL,
  position        TEXT NOT NULL,
  shirt_number    INTEGER,
  photo_url       TEXT,
  club            TEXT,
  club_badge_url  TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_name, player_name)
);
