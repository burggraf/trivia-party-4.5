-- Migration: Create questions table
-- This table existed before project migrations started
-- Contains 61,000+ trivia questions used across all games

CREATE TABLE IF NOT EXISTS questions (
  id UUID NOT NULL PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  a TEXT,
  b TEXT,
  c TEXT,
  d TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

ALTER TABLE questions OWNER TO postgres;

-- Index for category-based question selection
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions USING btree (category);

-- Index for temporal queries
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions USING btree (created_at DESC);

-- Enable Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read questions
CREATE POLICY "Authenticated users can read questions" ON questions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view questions" ON questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE questions TO anon;
GRANT ALL ON TABLE questions TO authenticated;
GRANT ALL ON TABLE questions TO service_role;