CREATE TABLE IF NOT EXISTS group_standings (
  id               SERIAL PRIMARY KEY,
  group_name       TEXT    NOT NULL,          -- 'A' … 'L'
  position         INTEGER NOT NULL,
  team_name        TEXT    NOT NULL,
  played           INTEGER NOT NULL DEFAULT 0,
  won              INTEGER NOT NULL DEFAULT 0,
  drawn            INTEGER NOT NULL DEFAULT 0,
  lost             INTEGER NOT NULL DEFAULT 0,
  goals_for        INTEGER NOT NULL DEFAULT 0,
  goals_against    INTEGER NOT NULL DEFAULT 0,
  goal_difference  INTEGER NOT NULL DEFAULT 0,
  points           INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_name, team_name)
);
