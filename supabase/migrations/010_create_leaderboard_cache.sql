-- Migration: Create leaderboard_cache table
-- Aggregated statistics per venue for performance

CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name TEXT NOT NULL,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  games_played INT NOT NULL,
  games_won INT NOT NULL,
  win_rate NUMERIC(5,2) NOT NULL,
  avg_score NUMERIC(6,2) NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,
  rank INT NOT NULL,

  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(venue_name, player_id)
);

-- Create index for venue leaderboard queries
CREATE INDEX idx_leaderboard_cache_venue_rank ON leaderboard_cache(venue_name, rank);

-- Enable Row Level Security
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY leaderboard_cache_public_read ON leaderboard_cache
  FOR SELECT
  USING (true);

-- Comment
COMMENT ON TABLE leaderboard_cache IS 'Aggregated player statistics per venue (refreshed after game completion)';