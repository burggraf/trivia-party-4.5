-- Migration: Create teams table

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,

  -- Cached score (updated on answer submission)
  score INT NOT NULL DEFAULT 0,
  cumulative_answer_time_ms BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(game_id, team_name)
);

-- Create index
CREATE INDEX idx_teams_game_id ON teams(game_id);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can access teams in their games
CREATE POLICY teams_host_access ON teams
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );

-- Policy: TV displays have public read access
CREATE POLICY teams_tv_public_read ON teams
  FOR SELECT
  USING (
    game_id IN (SELECT id FROM games WHERE status IN ('active', 'paused', 'completed'))
  );

-- Create updated_at trigger
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE teams IS 'Teams within games with score and tie-breaking time tracking';