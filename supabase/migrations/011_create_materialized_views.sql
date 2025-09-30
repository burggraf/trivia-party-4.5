-- Migration: Create materialized views for game history and leaderboard
-- These views are refreshed after game completion

-- ============================================================================
-- MATERIALIZED VIEW: game_history
-- Completed games with full details for hosts (FR-090)
-- ============================================================================

CREATE MATERIALIZED VIEW game_history AS
SELECT
  g.id AS game_id,
  g.host_id,
  g.name AS game_name,
  g.venue_name,
  g.completed_at,

  -- Aggregate stats
  COUNT(DISTINCT t.id) AS num_teams,
  COUNT(DISTINCT tm.player_id) AS num_players,
  COUNT(DISTINCT gq.id) AS num_questions,

  -- Winning team (with tie-breaking)
  (
    SELECT t2.team_name
    FROM teams t2
    WHERE t2.game_id = g.id
    ORDER BY t2.score DESC, t2.cumulative_answer_time_ms ASC
    LIMIT 1
  ) AS winning_team,

  -- Question details (for host view only - NOT for players per FR-089)
  ARRAY_AGG(
    jsonb_build_object(
      'question_id', q.id,
      'question', q.question,
      'category', q.category,
      'correct_answer', q.a
    ) ORDER BY gq.display_order
  ) AS questions

FROM games g
JOIN rounds r ON r.game_id = g.id
JOIN game_questions gq ON gq.game_id = g.id
JOIN questions q ON q.id = gq.question_id
LEFT JOIN teams t ON t.game_id = g.id
LEFT JOIN team_members tm ON tm.team_id = t.id

WHERE g.status = 'completed'

GROUP BY g.id, g.host_id, g.name, g.venue_name, g.completed_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_game_history_game_id ON game_history(game_id);

-- ============================================================================
-- MATERIALIZED VIEW: leaderboard_entries
-- Player statistics by venue (FR-094)
-- ============================================================================

CREATE MATERIALIZED VIEW leaderboard_entries AS
SELECT
  g.venue_name,
  pp.id AS player_id,
  pp.display_name,

  COUNT(DISTINCT t.game_id) AS games_played,

  COUNT(DISTINCT CASE
    WHEN t.score = (
      SELECT MAX(t2.score) FROM teams t2 WHERE t2.game_id = t.game_id
    ) THEN t.game_id
  END) AS games_won,

  ROUND(
    100.0 * COUNT(DISTINCT CASE
      WHEN t.score = (
        SELECT MAX(t2.score) FROM teams t2 WHERE t2.game_id = t.game_id
      ) THEN t.game_id
    END) / NULLIF(COUNT(DISTINCT t.game_id), 0),
    2
  ) AS win_rate,

  ROUND(AVG(t.score), 2) AS avg_score,

  ROUND(
    100.0 * SUM(CASE WHEN asub.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(asub.id), 0),
    2
  ) AS accuracy,

  RANK() OVER (
    PARTITION BY g.venue_name
    ORDER BY COUNT(DISTINCT CASE
      WHEN t.score = (
        SELECT MAX(t2.score) FROM teams t2 WHERE t2.game_id = t.game_id
      ) THEN t.game_id
    END) DESC
  ) AS rank

FROM player_profiles pp
JOIN team_members tm ON tm.player_id = pp.id
JOIN teams t ON t.id = tm.team_id
JOIN games g ON g.id = t.game_id
LEFT JOIN answer_submissions asub ON asub.team_id = t.id AND asub.submitted_by = pp.id

WHERE g.status = 'completed' AND g.venue_name IS NOT NULL

GROUP BY g.venue_name, pp.id, pp.display_name;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_leaderboard_entries_venue_player ON leaderboard_entries(venue_name, player_id);

-- ============================================================================
-- REFRESH FUNCTIONS
-- ============================================================================

-- Refresh game_history after a specific game completes
CREATE OR REPLACE FUNCTION refresh_game_history(p_game_id UUID)
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY game_history;
END;
$$ LANGUAGE plpgsql;

-- Refresh leaderboard (called hourly via cron or manually)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_entries;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON MATERIALIZED VIEW game_history IS 'Completed games with full details (hosts only - includes question content)';
COMMENT ON MATERIALIZED VIEW leaderboard_entries IS 'Player statistics by venue (public access)';
COMMENT ON FUNCTION refresh_game_history IS 'Refresh game history view after game completion';
COMMENT ON FUNCTION refresh_leaderboard IS 'Refresh leaderboard view (hourly or on-demand)';