-- Migration: Create team_members table
-- Many-to-many relationship between players and teams

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(team_id, player_id)
);

-- Create indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_player_id ON team_members(player_id);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Players can manage their own team memberships
CREATE POLICY team_members_own_data ON team_members
  FOR ALL
  USING (player_id = auth.uid());

-- Policy: Hosts can view team members in their games
CREATE POLICY team_members_host_access ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN games g ON g.id = t.game_id
      WHERE g.host_id = auth.uid()
    )
  );

-- Comment
COMMENT ON TABLE team_members IS 'Players on teams (many-to-many relationship)';