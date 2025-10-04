-- Migration: Create question_usage table
-- Tracks questions used by hosts to prevent reuse (FR-006)

CREATE TABLE question_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(host_id, question_id)
);

-- CRITICAL INDEX: For exclusion queries with 61k+ questions
CREATE INDEX idx_question_usage_host_question ON question_usage(host_id, question_id);

-- Enable Row Level Security
ALTER TABLE question_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can access their own usage records
CREATE POLICY question_usage_host_access ON question_usage
  FOR ALL
  USING (host_id = auth.uid());

-- Comment
COMMENT ON TABLE question_usage IS 'Tracks questions used by each host to prevent reuse across all games (FR-006)';
COMMENT ON INDEX idx_question_usage_host_question
  IS 'Critical for performance: enables fast exclusion queries in question selection';