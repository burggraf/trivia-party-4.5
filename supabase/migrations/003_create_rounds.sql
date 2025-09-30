-- Migration: Create rounds table

CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number > 0),
  categories TEXT[] NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(game_id, round_number)
);

-- Create index
CREATE INDEX idx_rounds_game_id ON rounds(game_id);

-- Enable Row Level Security
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- Policy: Access via game ownership
CREATE POLICY rounds_via_game_access ON rounds
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );

-- Comment
COMMENT ON TABLE rounds IS 'Round configuration with category selections per game';