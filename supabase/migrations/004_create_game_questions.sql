-- Migration: Create game_questions table
-- Stores question instances with randomization seed for consistent answer shuffling

CREATE TABLE game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),

  display_order INT NOT NULL,
  randomization_seed INT NOT NULL,

  revealed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(game_id, display_order)
);

-- Create indexes
CREATE INDEX idx_game_questions_game_id ON game_questions(game_id);
CREATE INDEX idx_game_questions_round_id ON game_questions(round_id);

-- Enable Row Level Security
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Access via game ownership
CREATE POLICY game_questions_via_game_access ON game_questions
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );

-- Policy: TV displays have public read access
CREATE POLICY game_questions_tv_public_read ON game_questions
  FOR SELECT
  USING (
    game_id IN (SELECT id FROM games WHERE status IN ('active', 'paused', 'completed'))
  );

-- Comment
COMMENT ON TABLE game_questions IS 'Question instances with randomization seed for consistent shuffling (FR-037)';