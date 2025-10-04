-- Migration: Create games table with status enum and RLS policies

-- Create game status enum
CREATE TYPE game_status AS ENUM ('setup', 'active', 'paused', 'completed');

-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  game_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  venue_name TEXT,
  venue_location TEXT,
  scheduled_at TIMESTAMPTZ,
  status game_status NOT NULL DEFAULT 'setup',

  -- Configuration
  num_rounds INT NOT NULL CHECK (num_rounds > 0),
  questions_per_round INT NOT NULL CHECK (questions_per_round > 0),
  time_limit_seconds INT CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
  min_players_per_team INT NOT NULL DEFAULT 1 CHECK (min_players_per_team BETWEEN 1 AND 6),
  max_players_per_team INT NOT NULL DEFAULT 6 CHECK (max_players_per_team BETWEEN 1 AND 6),
  sound_effects_enabled BOOLEAN NOT NULL DEFAULT false,

  -- State tracking
  current_question_index INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_team_size CHECK (min_players_per_team <= max_players_per_team)
);

-- Create indexes for performance
CREATE INDEX idx_games_host_id ON games(host_id);
CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_games_status ON games(status);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can access their own games
CREATE POLICY games_host_access ON games
  FOR ALL
  USING (host_id = auth.uid());

-- Policy: TV displays have public read access for active/completed games
CREATE POLICY games_tv_public_read ON games
  FOR SELECT
  USING (status IN ('active', 'paused', 'completed'));

-- Create updated_at trigger
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE games IS 'Main game entity with configuration and state tracking';