# Data Model: Multi-User Trivia Party Application

**Date**: 2025-09-30
**Feature**: 001-initial-game-setup
**Database**: Supabase PostgreSQL with Row-Level Security (RLS)

## Overview

This document defines the database schema for the trivia application, including 11 application tables, 2 materialized views, and comprehensive RLS policies for multi-tenant security.

---

## Entity Relationship Diagram

```
┌──────────────┐
│ auth.users   │ (Supabase Auth - managed)
└──────┬───────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────┐                      ┌──────────────────┐
│ hosts       │◄─────────────────────┤ player_profiles  │
│ (extends)   │                      └──────────────────┘
└──────┬──────┘                               │
       │                                      │
       │ 1:N                                  │
       ▼                                      │
┌─────────────┐                               │
│ games       │                               │
│ (RLS: host  │                               │
│  ownership) │                               │
└──────┬──────┘                               │
       │                                      │
       ├──────┬──────────┬──────────┐         │
       │ 1:N  │ 1:N      │ 1:N      │         │
       ▼      ▼          ▼          ▼         │
  ┌────────┐ ┌─────┐ ┌─────┐ ┌────────────┐  │
  │ rounds │ │teams│ │game_│ │question_   │  │
  │        │ └──┬──┘ │event│ │usage       │  │
  └────┬───┘    │    │s    │ │(reuse      │  │
       │ 1:N    │ 1:N└─────┘ │prevention) │  │
       ▼        ▼             └────────────┘  │
  ┌────────────┐ ┌────────────────┐           │
  │game_       │ │team_members    │◄──────────┘
  │questions   │ └────────────────┘
  │(with seed) │
  └──────┬─────┘
         │ 1:N
         ▼
  ┌────────────────────┐
  │answer_submissions  │
  │(UNIQUE constraint: │
  │ game_question_id,  │
  │ team_id)           │
  └────────────────────┘

  ┌────────────────┐
  │ questions      │ (existing table, 61k+ rows, read-only)
  │ (id, category, │
  │  question,     │
  │  a, b, c, d)   │
  └────────────────┘

  ┌────────────────────┐
  │ leaderboard_cache  │ (aggregated stats per venue)
  └────────────────────┘

Materialized Views:
  ┌──────────────┐
  │ game_history │ (completed games for hosts)
  └──────────────┘

  ┌────────────────────┐
  │ leaderboard_entries│ (player stats by venue)
  └────────────────────┘
```

---

## Table Definitions

### 1. hosts

**Purpose**: Extends Supabase `auth.users` with host-specific metadata

```sql
CREATE TABLE hosts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY hosts_own_data ON hosts
  FOR ALL
  USING (id = auth.uid());
```

**Columns**:
- `id`: Foreign key to `auth.users.id`
- `email`: Cached from auth for queries
- `display_name`: Optional friendly name
- `created_at`, `updated_at`: Audit timestamps

---

### 2. games

**Purpose**: Main game entity with configuration and state

```sql
CREATE TYPE game_status AS ENUM ('setup', 'active', 'paused', 'completed');

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  game_code TEXT UNIQUE NOT NULL,  -- 6-character code (e.g., "ABC123")
  name TEXT NOT NULL,
  venue_name TEXT,
  venue_location TEXT,
  scheduled_at TIMESTAMPTZ,
  status game_status NOT NULL DEFAULT 'setup',

  -- Configuration
  num_rounds INT NOT NULL CHECK (num_rounds > 0),
  questions_per_round INT NOT NULL CHECK (questions_per_round > 0),
  time_limit_seconds INT CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
  min_players_per_team INT NOT NULL DEFAULT 1 CHECK (min_players_per_team BETWEEN 1 AND 6),
  max_players_per_team INT NOT NULL DEFAULT 6 CHECK (max_players_per_team BETWEEN 1 AND 6),
  sound_effects_enabled BOOLEAN NOT NULL DEFAULT false,

  -- State tracking
  current_question_index INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_team_size CHECK (min_players_per_team <= max_players_per_team)
);

-- Indexes
CREATE INDEX idx_games_host_id ON games(host_id);
CREATE INDEX idx_games_game_code ON games(game_code);  -- Fast player join lookup
CREATE INDEX idx_games_status ON games(status);

-- RLS Policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY games_host_access ON games
  FOR ALL
  USING (host_id = auth.uid());

-- Players can view games they've joined
CREATE POLICY games_player_access ON games
  FOR SELECT
  USING (
    id IN (
      SELECT tm.game_id
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.player_id = auth.uid()
    )
  );

-- TV displays have public read access for active/completed games
CREATE POLICY games_tv_public_read ON games
  FOR SELECT
  USING (status IN ('active', 'paused', 'completed'));
```

**State Machine**:
```
setup → active → paused ⇄ active → completed
     ↓
 completed (early termination via FR-058)
```

---

### 3. rounds

**Purpose**: Round configuration with category selections

```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INT NOT NULL CHECK (round_number > 0),
  categories TEXT[] NOT NULL,  -- e.g., ['Sports', 'History']

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(game_id, round_number)
);

-- Index
CREATE INDEX idx_rounds_game_id ON rounds(game_id);

-- RLS Policies
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY rounds_via_game_access ON rounds
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );
```

---

### 4. game_questions

**Purpose**: Question instances with randomization seed for consistent shuffling

```sql
CREATE TABLE game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),

  display_order INT NOT NULL,  -- Within round (0-indexed)
  randomization_seed INT NOT NULL,  -- For consistent answer shuffling (FR-037)

  revealed_at TIMESTAMPTZ,  -- Timestamp when correct answer revealed

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(game_id, display_order)
);

-- Indexes
CREATE INDEX idx_game_questions_game_id ON game_questions(game_id);
CREATE INDEX idx_game_questions_round_id ON game_questions(round_id);

-- RLS Policies
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_questions_via_game_access ON game_questions
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );
```

**Note**: `randomization_seed` generated during game setup (Postgres `random() * 1000000`)

---

### 5. teams

**Purpose**: Teams within a game

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,

  -- Cached score (updated on answer submission)
  score INT NOT NULL DEFAULT 0,
  cumulative_answer_time_ms BIGINT NOT NULL DEFAULT 0,  -- For tie-breaking (FR-082)

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(game_id, team_name)  -- Team names unique per game (FR-030)
);

-- Indexes
CREATE INDEX idx_teams_game_id ON teams(game_id);

-- RLS Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_host_access ON teams
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );

CREATE POLICY teams_player_access ON teams
  FOR SELECT
  USING (
    game_id IN (
      SELECT tm.game_id
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.player_id = auth.uid()
    )
  );

CREATE POLICY teams_tv_public_read ON teams
  FOR SELECT
  USING (
    game_id IN (SELECT id FROM games WHERE status IN ('active', 'paused', 'completed'))
  );
```

---

### 6. team_members

**Purpose**: Players on teams (many-to-many: players ↔ teams)

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(team_id, player_id)  -- Player can only join team once
);

-- Indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_player_id ON team_members(player_id);

-- RLS Policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_own_data ON team_members
  FOR ALL
  USING (player_id = auth.uid());
```

---

### 7. answer_submissions

**Purpose**: Team answers with first-submission lock (FR-040, FR-043)

```sql
CREATE TABLE answer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_question_id UUID NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  submitted_by UUID NOT NULL REFERENCES auth.users(id),  -- Player who submitted
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN NOT NULL,
  answer_time_ms INT NOT NULL,  -- Time taken to answer (milliseconds)

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- First answer wins constraint (FR-043)
  UNIQUE(game_question_id, team_id)
);

-- Indexes
CREATE INDEX idx_answer_submissions_game_question_id ON answer_submissions(game_question_id);
CREATE INDEX idx_answer_submissions_team_id ON answer_submissions(team_id);

-- RLS Policies
ALTER TABLE answer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY answer_submissions_team_access ON answer_submissions
  FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE player_id = auth.uid()
    )
  );
```

**Critical**: UNIQUE constraint enforces first-answer-wins (handles race conditions per FR-043)

---

### 8. question_usage

**Purpose**: Tracks questions used by hosts to prevent reuse (FR-006)

```sql
CREATE TABLE question_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(host_id, question_id)  -- Prevent reuse per host
);

-- Critical index for exclusion queries (research.md section 4)
CREATE INDEX idx_question_usage_host_question ON question_usage(host_id, question_id);

-- RLS Policies
ALTER TABLE question_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY question_usage_host_access ON question_usage
  FOR ALL
  USING (host_id = auth.uid());
```

---

### 9. player_profiles

**Purpose**: Player metadata beyond auth

```sql
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,

  -- Stats (cached for performance)
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  total_correct_answers INT NOT NULL DEFAULT 0,
  total_questions_answered INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY player_profiles_own_data ON player_profiles
  FOR ALL
  USING (id = auth.uid());

CREATE POLICY player_profiles_public_read ON player_profiles
  FOR SELECT
  USING (true);  -- Public read for leaderboards
```

---

### 10. leaderboard_cache

**Purpose**: Aggregated statistics per venue (for performance)

```sql
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name TEXT NOT NULL,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  games_played INT NOT NULL,
  games_won INT NOT NULL,
  win_rate NUMERIC(5,2) NOT NULL,  -- Percentage (0.00-100.00)
  avg_score NUMERIC(6,2) NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,  -- Percentage (0.00-100.00)
  rank INT NOT NULL,

  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(venue_name, player_id)
);

-- Index
CREATE INDEX idx_leaderboard_cache_venue_rank ON leaderboard_cache(venue_name, rank);

-- RLS Policies
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY leaderboard_cache_public_read ON leaderboard_cache
  FOR SELECT
  USING (true);
```

**Update Strategy**: Refresh after each game completion or hourly via cron

---

### 11. game_events

**Purpose**: Audit log for game state transitions

```sql
CREATE TYPE event_type AS ENUM (
  'game_created', 'game_started', 'game_paused', 'game_resumed',
  'question_advanced', 'answer_revealed', 'game_completed'
);

CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  metadata JSONB,  -- Event-specific data

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_game_events_game_id ON game_events(game_id);

-- RLS Policies
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY game_events_via_game_access ON game_events
  FOR ALL
  USING (
    game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
  );
```

---

## Materialized Views

### game_history

**Purpose**: Completed games with full details for hosts (FR-090)

```sql
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

  -- Winning team
  (
    SELECT t2.team_name
    FROM teams t2
    WHERE t2.game_id = g.id
    ORDER BY t2.score DESC, t2.cumulative_answer_time_ms ASC
    LIMIT 1
  ) AS winning_team,

  -- Question details (for host view only)
  ARRAY_AGG(
    jsonb_build_object(
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

-- Index
CREATE UNIQUE INDEX idx_game_history_game_id ON game_history(game_id);

-- Refresh strategy: After game completion
CREATE FUNCTION refresh_game_history(p_game_id UUID)
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY game_history;
END;
$$ LANGUAGE plpgsql;
```

---

### leaderboard_entries

**Purpose**: Player statistics by venue (FR-094)

```sql
CREATE MATERIALIZED VIEW leaderboard_entries AS
SELECT
  g.venue_name,
  pp.id AS player_id,
  pp.display_name,

  COUNT(DISTINCT tm.game_id) AS games_played,
  COUNT(DISTINCT CASE WHEN t.score = (
    SELECT MAX(t2.score) FROM teams t2 WHERE t2.game_id = tm.game_id
  ) THEN tm.game_id END) AS games_won,

  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN t.score = (
      SELECT MAX(t2.score) FROM teams t2 WHERE t2.game_id = tm.game_id
    ) THEN tm.game_id END) / NULLIF(COUNT(DISTINCT tm.game_id), 0),
    2
  ) AS win_rate,

  ROUND(AVG(t.score), 2) AS avg_score,

  ROUND(
    100.0 * SUM(CASE WHEN asub.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(asub.id), 0),
    2
  ) AS accuracy,

  RANK() OVER (
    PARTITION BY g.venue_name
    ORDER BY COUNT(DISTINCT CASE WHEN t.score = (
      SELECT MAX(t2.score) FROM teams t2 WHERE t2.game_id = tm.game_id
    ) THEN tm.game_id END) DESC
  ) AS rank

FROM player_profiles pp
JOIN team_members tm ON tm.player_id = pp.id
JOIN teams t ON t.id = tm.team_id
JOIN games g ON g.id = t.game_id
LEFT JOIN answer_submissions asub ON asub.team_id = t.id

WHERE g.status = 'completed' AND g.venue_name IS NOT NULL

GROUP BY g.venue_name, pp.id, pp.display_name;

-- Index
CREATE UNIQUE INDEX idx_leaderboard_entries_venue_player ON leaderboard_entries(venue_name, player_id);

-- Refresh strategy: Hourly or after game completion
CREATE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_entries;
END;
$$ LANGUAGE plpgsql;
```

---

## Existing Table: questions

**Note**: This table already exists with 61,000+ questions (read-only for this feature)

```sql
-- For reference only (not created by this feature)
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  a TEXT NOT NULL,  -- CORRECT ANSWER
  b TEXT NOT NULL,  -- Wrong answer
  c TEXT NOT NULL,  -- Wrong answer
  d TEXT NOT NULL,  -- Wrong answer
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Existing indexes
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
```

---

## Summary

**Tables**: 11 application tables
- `hosts`, `games`, `rounds`, `game_questions`, `teams`, `team_members`
- `answer_submissions`, `question_usage`, `player_profiles`, `leaderboard_cache`, `game_events`

**Materialized Views**: 2
- `game_history` (completed games for hosts)
- `leaderboard_entries` (player stats by venue)

**Key Indexes** (for performance):
- `idx_question_usage_host_question` - Critical for reuse prevention queries
- `idx_games_game_code` - Fast player join lookups
- `idx_answer_submissions_game_question_id` - Answer retrieval

**RLS Policies**: All tables have Row-Level Security enabled
- Hosts: Can only access their own games
- Players: Can access games they've joined
- TV Displays: Public read for active/completed games

**Constraints**:
- UNIQUE(`game_question_id`, `team_id`) on `answer_submissions` - First-answer-wins (FR-043)
- UNIQUE(`host_id`, `question_id`) on `question_usage` - Reuse prevention (FR-006)
- UNIQUE(`game_id`, `team_name`) on `teams` - Team name uniqueness (FR-030)

---

**Data Model Complete**: 2025-09-30
**Next Step**: Generate API contracts