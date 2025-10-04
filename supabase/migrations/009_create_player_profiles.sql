-- Migration: Create player_profiles table
-- Extends auth.users with player metadata and cached statistics

CREATE TABLE player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,

  -- Cached statistics (updated after game completion)
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  total_correct_answers INT NOT NULL DEFAULT 0,
  total_questions_answered INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Players can manage their own profile
CREATE POLICY player_profiles_own_data ON player_profiles
  FOR ALL
  USING (id = auth.uid());

-- Policy: Public read access for leaderboards
CREATE POLICY player_profiles_public_read ON player_profiles
  FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE player_profiles IS 'Player metadata beyond auth with cached game statistics';