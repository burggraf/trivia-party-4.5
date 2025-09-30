-- Migration: Create answer_submissions table
-- CRITICAL: UNIQUE constraint enforces first-answer-wins (FR-043)

CREATE TABLE answer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_question_id UUID NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  answer_time_ms INT NOT NULL,

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- CRITICAL: First answer wins constraint (FR-043)
  UNIQUE(game_question_id, team_id)
);

-- Create indexes
CREATE INDEX idx_answer_submissions_game_question_id ON answer_submissions(game_question_id);
CREATE INDEX idx_answer_submissions_team_id ON answer_submissions(team_id);

-- Enable Row Level Security
ALTER TABLE answer_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view and insert their team's submissions
CREATE POLICY answer_submissions_team_access ON answer_submissions
  FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE player_id = auth.uid()
    )
  );

-- Policy: Hosts can view submissions in their games
CREATE POLICY answer_submissions_host_access ON answer_submissions
  FOR SELECT
  USING (
    game_question_id IN (
      SELECT gq.id FROM game_questions gq
      JOIN games g ON g.id = gq.game_id
      WHERE g.host_id = auth.uid()
    )
  );

-- Comment
COMMENT ON TABLE answer_submissions IS 'Team answers with first-submission lock via UNIQUE constraint';
COMMENT ON CONSTRAINT answer_submissions_game_question_id_team_id_key ON answer_submissions
  IS 'Enforces first-answer-wins: only one submission per team per question (FR-043)';