-- Add game state machine columns to games table
-- This enables proper game flow with intro screens, round transitions, and score displays

-- Add game_state column to track current state in the game flow
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_state TEXT NOT NULL DEFAULT 'setup';

-- Add constraint to ensure only valid states
ALTER TABLE games ADD CONSTRAINT games_game_state_check
  CHECK (game_state IN (
    'setup',           -- Game created, waiting to start
    'game_intro',      -- Welcome screen
    'round_intro',     -- Round title screen (Round 1, Round 2, etc)
    'question_active', -- Question displayed, teams can answer
    'question_revealed', -- Answer revealed, waiting for next
    'round_scores',    -- Scores at end of round
    'game_complete',   -- Final scores
    'game_thanks'      -- Thanks for playing screen
  ));

-- Add index for faster state queries
CREATE INDEX IF NOT EXISTS idx_games_game_state ON games(game_state);

-- Remove the old 'status' column logic since game_state replaces it
-- We'll keep 'status' for backward compatibility but game_state is the source of truth
-- status will be derived: setup/game_intro -> 'setup', question_active/revealed -> 'active', game_complete/thanks -> 'completed'

-- Add comment explaining the state machine
COMMENT ON COLUMN games.game_state IS 'Current state in the game flow state machine. Controls what screen is displayed on all interfaces (host, player, TV).';

-- Migration complete
