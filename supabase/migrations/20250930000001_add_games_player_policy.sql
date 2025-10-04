-- Migration: Add player access policies (after teams/team_members tables exist)
-- These policies reference teams/team_members and must run after migration 006

-- Policy: Players can view games they've joined
CREATE POLICY games_player_access ON games
  FOR SELECT
  USING (
    id IN (
      SELECT t.game_id
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.player_id = auth.uid()
    )
  );

-- Policy: Players can view teams in games they've joined
CREATE POLICY teams_player_access ON teams
  FOR SELECT
  USING (
    game_id IN (
      SELECT t.game_id
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.player_id = auth.uid()
    )
  );

-- Policy: Players can view questions for games they've joined
CREATE POLICY game_questions_player_access ON game_questions
  FOR SELECT
  USING (
    game_id IN (
      SELECT t.game_id
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.player_id = auth.uid()
    )
  );

-- Comments
COMMENT ON POLICY games_player_access ON games IS 'Allow players to view games they have joined via team membership';
COMMENT ON POLICY teams_player_access ON teams IS 'Allow players to view teams in games they have joined';
COMMENT ON POLICY game_questions_player_access ON game_questions IS 'Allow players to view questions for games they have joined';