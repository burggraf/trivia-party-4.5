# Tasks: Multi-User Trivia Party Application

**Input**: Design documents from `/specs/001-initial-game-setup/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory
   ✓ Loaded: Next.js 14+ App Router, Supabase, TypeScript strict
   ✓ Tech stack: React, Tailwind, shadcn/ui, Zustand, Recharts, Playwright
2. Load optional design documents:
   ✓ data-model.md: 11 tables + 2 materialized views extracted
   ✓ contracts/: 25 API endpoints identified
   ✓ research.md: 10 technical decisions extracted
   ✓ quickstart.md: 23 validation steps extracted
3. Generate tasks by category:
   ✓ Setup: 8 tasks (T001-T008)
   ✓ Contract Tests: 25 tasks (T009-T033) [P]
   ✓ Utilities: 7 tasks (T034-T040)
   ✓ Database: 11 tasks (T041-T051)
   ✓ API Implementation: 25 tasks (T052-T076)
   ✓ Components: 32 tasks (T077-T108)
   ✓ Integration Tests: 17 tasks (T109-T125)
   ✓ Validation: 5 tasks (T126-T130)
4. Apply task rules:
   ✓ Contract tests marked [P] (different files)
   ✓ Component tasks marked [P] (different files)
   ✓ API tasks sequential (shared dependencies)
   ✓ TDD: Tests before implementation enforced
5. Number tasks sequentially (T001-T130)
6. Generate dependency graph (see Dependencies section)
7. Create parallel execution examples (see below)
8. Validate task completeness:
   ✓ All 25 contracts have tests
   ✓ All 11 entities have migrations
   ✓ All 25 endpoints implemented
9. Return: SUCCESS (130 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this project uses **Next.js App Router** structure:
```
app/                  # Next.js pages (route groups)
components/           # React components
lib/                  # Utilities and business logic
types/                # TypeScript types
tests/                # All test files
supabase/             # Database migrations
```

---

## Phase 3.1: Setup (T001-T008) - All parallelizable [P]

- [X] **T001** [P] Initialize Next.js 14+ project with TypeScript and App Router at repository root
  - Run: `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"`
  - Configure: `output: 'export'` in `next.config.js` for static site generation
  - Verify: `package.json` has Next.js 14+, TypeScript 5+, React 18+

- [X] **T002** [P] Install and configure Supabase client libraries
  - Run: `npm install @supabase/supabase-js @supabase/ssr`
  - Create: `lib/supabase/client.ts` (browser client)
  - Create: `lib/supabase/server.ts` (server client for RLS)
  - Add environment variables to `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [X] **T003** [P] Setup Tailwind CSS and shadcn/ui component library
  - Install: `npm install -D @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react`
  - Configure: Tailwind CSS with @tailwindcss/postcss
  - Create: `components/ui/button.tsx` and `components/ui/card.tsx`
  - Verify: `components/ui/` directory created with primitives

- [X] **T004** [P] Configure ESLint, Prettier, and TypeScript strict mode
  - Update `tsconfig.json`: Enable `strict: true`, `noUncheckedIndexedAccess: true`
  - Create `.eslintrc.json`: Extend Next.js config, add custom rules (no `any` types)
  - Create `.prettierrc`: Configure formatting (semi, single quotes, trailing comma)
  - Add npm scripts: `"lint": "next lint"`, `"format": "prettier --write ."`

- [X] **T005** [P] Setup Vitest and React Testing Library for unit/component tests
  - Run: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom`
  - Create: `vitest.config.ts` with React plugin
  - Create: `tests/setup.ts` with Testing Library matchers
  - Add npm script: `"test": "vitest"`
  - Verify: `npm test -- --version` runs successfully

- [X] **T006** [P] Setup Playwright for E2E integration tests
  - Run: `npm install -D @playwright/test`
  - Run: `npx playwright install chromium`
  - Create: `playwright.config.ts` with multi-browser config
  - Add npm script: `"test:e2e": "playwright test"`

- [X] **T007** [P] Initialize Supabase project and setup CLI
  - Run: `npx supabase init` (creates `supabase/` directory)
  - Create: `supabase/config.toml` with project settings

- [X] **T008** [P] Install additional dependencies (Zod, Zustand, Recharts, QRCode)
  - Run: `npm install zod zustand recharts qrcode.react seedrandom`
  - Run: `npm install -D @types/seedrandom prettier`
  - Verify: All packages in `package.json` with correct versions

---

## Phase 3.2: Contract Tests First (T009-T033) - TDD ⚠️ MUST FAIL

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation (Phase 3.4)**

All 25 contract tests can run in parallel [P] as they are independent files.

### Host Endpoints (T009-T018)

- [ ] **T009** [P] Contract test POST /api/host/games in `tests/contract/host/test_create_game.ts`
  - Import Zod schemas from `types/api.types.ts` (CreateGameRequest, CreateGameResponse)
  - Test: Request schema validation (valid + invalid cases)
  - Test: Response schema validation
  - Test: 201 status on success, 400 on invalid input, 401 on unauthorized
  - Test: Warning message when insufficient questions available (FR-007a)
  - **Expected**: All tests FAIL (no API route exists yet)

- [ ] **T010** [P] Contract test GET /api/host/games/:id in `tests/contract/host/test_get_game.ts`
  - Test: Response schema validation (game config with all fields)
  - Test: 200 on success, 404 on non-existent game, 403 on unauthorized access
  - **Expected**: All tests FAIL

- [ ] **T011** [P] Contract test PUT /api/host/games/:id in `tests/contract/host/test_update_game.ts`
  - Test: Request schema (partial updates allowed)
  - Test: 200 on success, 404 on not found, 403 on not owner
  - **Expected**: All tests FAIL

- [ ] **T012** [P] Contract test POST /api/host/games/:id/start in `tests/contract/host/test_start_game.ts`
  - Test: Response includes game_code, qr_code_url
  - Test: 200 on success, 400 if already started, 403 on unauthorized
  - **Expected**: All tests FAIL

- [ ] **T013** [P] Contract test POST /api/host/games/:id/pause in `tests/contract/host/test_pause_game.ts`
  - Test: 200 on success, 400 if not active, 403 on unauthorized
  - **Expected**: All tests FAIL

- [ ] **T014** [P] Contract test POST /api/host/games/:id/resume in `tests/contract/host/test_resume_game.ts`
  - Test: 200 on success, 400 if not paused, 403 on unauthorized
  - **Expected**: All tests FAIL

- [ ] **T015** [P] Contract test POST /api/host/games/:id/advance in `tests/contract/host/test_advance_question.ts`
  - Test: Response includes next question index
  - Test: 200 on success, 400 if no more questions, 403 on unauthorized
  - **Expected**: All tests FAIL

- [ ] **T016** [P] Contract test POST /api/host/games/:id/reveal in `tests/contract/host/test_reveal_answer.ts`
  - Test: Response includes correct answer
  - Test: 200 on success, 400 if already revealed, 403 on unauthorized
  - **Expected**: All tests FAIL

- [ ] **T017** [P] Contract test POST /api/host/games/:id/navigate in `tests/contract/host/test_navigate_question.ts`
  - Test: Request includes target question index
  - Test: 200 on success, 400 on invalid index, 403 on unauthorized
  - **Expected**: All tests FAIL

- [ ] **T018** [P] Contract test POST /api/host/games/:id/end in `tests/contract/host/test_end_game.ts`
  - Test: Response includes final scores
  - Test: 200 on success, 400 if already ended, 403 on unauthorized
  - **Expected**: All tests FAIL

### Player Endpoints (T019-T026)

- [ ] **T019** [P] Contract test POST /api/player/auth/register in `tests/contract/player/test_register.ts`
  - Test: Request schema (email, password, display_name)
  - Test: Response includes user_id, session token
  - Test: 201 on success, 400 on invalid email, 409 on duplicate email
  - **Expected**: All tests FAIL

- [ ] **T020** [P] Contract test POST /api/player/auth/anonymous in `tests/contract/player/test_anonymous.ts`
  - Test: Request schema (display_name only)
  - Test: Response includes anon user_id, session token
  - Test: 201 on success, 400 on missing name
  - **Expected**: All tests FAIL

- [ ] **T021** [P] Contract test GET /api/player/games/:code in `tests/contract/player/test_find_game.ts`
  - Test: Response includes game details (name, status, venue)
  - Test: 200 on success, 404 on invalid code
  - **Expected**: All tests FAIL

- [ ] **T022** [P] Contract test POST /api/player/games/:id/teams in `tests/contract/player/test_create_team.ts`
  - Test: Request schema (team_name)
  - Test: Response includes team_id
  - Test: 201 on success, 409 on duplicate team name, 400 if game started
  - **Expected**: All tests FAIL

- [ ] **T023** [P] Contract test POST /api/player/games/:id/teams/:teamId/join in `tests/contract/player/test_join_team.ts`
  - Test: 200 on success, 403 if team full, 400 if game started
  - **Expected**: All tests FAIL

- [ ] **T024** [P] Contract test POST /api/player/games/:id/questions/:questionId/answers in `tests/contract/player/test_submit_answer.ts`
  - Test: Request schema (selected_answer: 'a'|'b'|'c'|'d', answer_time_ms)
  - Test: Response includes submission_id
  - Test: 201 on first submission, 409 on duplicate with "Your team has already answered"
  - Test: Verify UNIQUE constraint enforcement (FR-043)
  - **Expected**: All tests FAIL

- [ ] **T025** [P] Contract test GET /api/player/games/:id/status in `tests/contract/player/test_get_status.ts`
  - Test: Response includes current_question_index, status, teams_answered_count
  - Test: 200 on success, 404 on not found
  - **Expected**: All tests FAIL

- [ ] **T026** [P] Contract test GET /api/player/history in `tests/contract/player/test_get_history.ts`
  - Test: Response includes games array (without question content per FR-089)
  - Test: 200 on success, 401 on unauthorized
  - **Expected**: All tests FAIL

### TV Display Endpoints (T027-T029)

- [ ] **T027** [P] Contract test GET /api/tv/games/:code in `tests/contract/tv/test_get_game.ts`
  - Test: Public access (no auth required)
  - Test: Response includes game details
  - Test: 200 on success, 404 on not found
  - **Expected**: All tests FAIL

- [ ] **T028** [P] Contract test GET /api/tv/games/:id/question in `tests/contract/tv/test_get_question.ts`
  - Test: Response includes question text, shuffled answers
  - Test: 200 on success, 404 on not found
  - **Expected**: All tests FAIL

- [ ] **T029** [P] Contract test GET /api/tv/games/:id/scores in `tests/contract/tv/test_get_scores.ts`
  - Test: Response includes teams array with scores, ranks
  - Test: 200 on success, 404 on not found
  - **Expected**: All tests FAIL

### Leaderboard Endpoints (T030-T031)

- [ ] **T030** [P] Contract test GET /api/leaderboard/:venueId in `tests/contract/leaderboard/test_get_venue_leaderboard.ts`
  - Test: Response includes players array sorted by rank
  - Test: 200 on success, 404 on invalid venue
  - **Expected**: All tests FAIL

- [ ] **T031** [P] Contract test GET /api/leaderboard/:venueId/player/:playerId in `tests/contract/leaderboard/test_get_player_stats.ts`
  - Test: Response includes games_played, win_rate, accuracy
  - Test: 200 on success, 404 on not found
  - **Expected**: All tests FAIL

### Admin Endpoints (T032-T033)

- [ ] **T032** [P] Contract test DELETE /api/host/games/:id in `tests/contract/host/test_delete_game.ts`
  - Test: 204 on success, 403 if not owner, 404 on not found
  - **Expected**: All tests FAIL

- [ ] **T033** [P] Contract test POST /api/admin/leaderboard/refresh in `tests/contract/admin/test_refresh_leaderboard.ts`
  - Test: 200 on success (refreshes materialized views)
  - **Expected**: All tests FAIL

**Verification**: Run `npm test -- tests/contract/` and confirm ALL 25 tests FAIL

---

## Phase 3.3: Core Utilities (T034-T040) - Before API Implementation

These utilities are critical dependencies for API implementation (T052-T076).

- [ ] **T034** Implement question selection utility in `lib/game/question-selection.ts`
  - Function: `selectQuestions(hostId: string, categories: string[], count: number, excludeUsed: boolean): Promise<Question[]>`
  - Query: Use Supabase RPC to call Postgres function (from data-model.md)
  - Logic: Exclude questions in `question_usage` for host (FR-006)
  - Logic: Supplement from all categories if insufficient (FR-007)
  - Logic: Return available count for warning (FR-007a)
  - Export: Type-safe function with Zod validation

- [ ] **T035** Unit test for question selection in `tests/unit/question-selection.test.ts`
  - Test: Excludes previously used questions
  - Test: Supplements from all categories when needed
  - Test: Returns warning when insufficient questions
  - Test: Handles empty database gracefully
  - Mock: Supabase client responses
  - **Expected**: All tests PASS after T034

- [ ] **T036** Implement answer shuffling utility in `lib/game/answer-shuffling.ts`
  - Function: `shuffleAnswers(answers: Answer[], seed: number): Answer[]`
  - Algorithm: Fisher-Yates shuffle with seeded PRNG (seedrandom library)
  - Logic: Deterministic shuffle (same seed = same order)
  - Verify: Consistent across multiple calls with same seed
  - Export: Type-safe function

- [ ] **T037** Unit test for answer shuffling in `tests/unit/answer-shuffling.test.ts`
  - Test: Same seed produces identical shuffle
  - Test: Different seeds produce different shuffles
  - Test: All answers present after shuffle (no duplicates/missing)
  - Test: Shuffle order matches across calls
  - **Expected**: All tests PASS after T036

- [ ] **T038** Implement scoring utility in `lib/game/scoring.ts`
  - Function: `calculateScores(submissions: Submission[]): TeamScore[]`
  - Logic: 1 point per correct answer (FR-077)
  - Logic: Tie-breaking by cumulative_answer_time_ms (FR-082)
  - Logic: Return sorted by score DESC, then time ASC
  - Export: Type-safe function with complete team rankings

- [ ] **T039** Unit test for scoring in `tests/unit/scoring.test.ts`
  - Test: Correct point calculation
  - Test: Tie-breaking by lowest cumulative time
  - Test: Proper ranking (1st, 2nd, 3rd with ties)
  - Test: Handles zero submissions
  - **Expected**: All tests PASS after T038

- [ ] **T040** Implement Realtime channel setup in `lib/realtime/channels.ts`
  - Function: `createGameChannel(gameId: string): RealtimeChannel`
  - Function: `createPresenceChannel(teamId: string): RealtimeChannel`
  - Function: `createTVChannel(gameId: string): RealtimeChannel`
  - Logic: Configure broadcast channels (not table subscriptions per research.md)
  - Logic: Handle reconnection with exponential backoff
  - Export: Channel factory functions

---

## Phase 3.4: Database Schema (T041-T051) - Sequential

Database migrations must run in order (dependencies between tables).

- [ ] **T041** Create hosts table migration in `supabase/migrations/001_create_hosts.sql`
  - Table: `hosts` extending auth.users
  - Columns: id (FK to auth.users), email, display_name, created_at, updated_at
  - RLS: Enable with policy `hosts_own_data`
  - Run: `npx supabase migration new create_hosts`
  - Apply: `npx supabase db push`

- [ ] **T042** Create games table migration in `supabase/migrations/002_create_games.sql`
  - Table: `games` with all config fields (see data-model.md)
  - Enum: `game_status` (setup, active, paused, completed)
  - Columns: id, host_id (FK), game_code (UNIQUE), name, venue, status, config, state tracking
  - Indexes: idx_games_host_id, idx_games_game_code, idx_games_status
  - RLS: Three policies (host access, player access, TV public read)
  - Apply: `npx supabase db push`

- [ ] **T043** Create rounds table migration in `supabase/migrations/003_create_rounds.sql`
  - Table: `rounds` with game_id FK, round_number, categories (TEXT[])
  - Constraint: UNIQUE(game_id, round_number)
  - Index: idx_rounds_game_id
  - RLS: Policy via game ownership
  - Apply: `npx supabase db push`

- [ ] **T044** Create game_questions table migration in `supabase/migrations/004_create_game_questions.sql`
  - Table: `game_questions` with game_id, round_id, question_id FKs
  - Columns: id, display_order, randomization_seed, revealed_at
  - Constraint: UNIQUE(game_id, display_order)
  - Indexes: idx_game_questions_game_id, idx_game_questions_round_id
  - RLS: Policy via game ownership
  - Apply: `npx supabase db push`

- [ ] **T045** Create teams table migration in `supabase/migrations/005_create_teams.sql`
  - Table: `teams` with game_id FK, team_name
  - Columns: id, score, cumulative_answer_time_ms (for tie-breaking)
  - Constraint: UNIQUE(game_id, team_name) - FR-030
  - Index: idx_teams_game_id
  - RLS: Three policies (host, player, TV access)
  - Apply: `npx supabase db push`

- [ ] **T046** Create team_members table migration in `supabase/migrations/006_create_team_members.sql`
  - Table: `team_members` with team_id, player_id FKs
  - Constraint: UNIQUE(team_id, player_id)
  - Indexes: idx_team_members_team_id, idx_team_members_player_id
  - RLS: Policy for own data
  - Apply: `npx supabase db push`

- [ ] **T047** Create answer_submissions table migration in `supabase/migrations/007_create_answer_submissions.sql`
  - Table: `answer_submissions` with game_question_id, team_id FKs
  - Columns: id, submitted_by (FK), selected_answer, is_correct, answer_time_ms, submitted_at
  - **CRITICAL**: UNIQUE(game_question_id, team_id) - enforces first-answer-wins (FR-043)
  - Indexes: idx_answer_submissions_game_question_id, idx_answer_submissions_team_id
  - RLS: Policy via team membership
  - Apply: `npx supabase db push`

- [ ] **T048** Create question_usage table migration in `supabase/migrations/008_create_question_usage.sql`
  - Table: `question_usage` with host_id, question_id, game_id FKs
  - Constraint: UNIQUE(host_id, question_id) - prevents reuse per host (FR-006)
  - **CRITICAL INDEX**: idx_question_usage_host_question(host_id, question_id) - performance for exclusion queries
  - RLS: Policy for host access
  - Apply: `npx supabase db push`

- [ ] **T049** Create player_profiles table migration in `supabase/migrations/009_create_player_profiles.sql`
  - Table: `player_profiles` extending auth.users
  - Columns: id (FK), display_name, is_anonymous, stats (games_played, games_won, etc.)
  - RLS: Own data + public read (for leaderboards)
  - Apply: `npx supabase db push`

- [ ] **T050** Create leaderboard_cache table migration in `supabase/migrations/010_create_leaderboard_cache.sql`
  - Table: `leaderboard_cache` with venue_name, player_id
  - Columns: games_played, win_rate, avg_score, accuracy, rank
  - Constraint: UNIQUE(venue_name, player_id)
  - Index: idx_leaderboard_cache_venue_rank
  - RLS: Public read
  - Apply: `npx supabase db push`

- [ ] **T051** Create materialized views migration in `supabase/migrations/011_create_materialized_views.sql`
  - View: `game_history` (completed games for hosts with full details)
  - View: `leaderboard_entries` (player stats by venue)
  - Function: `refresh_game_history(game_id UUID)`
  - Function: `refresh_leaderboard()`
  - Indexes: Unique indexes on both views
  - Apply: `npx supabase db push`

**Verification**: Run `npx supabase db reset` to verify all migrations apply cleanly

---

## Phase 3.5: API Implementation (T052-T076) - Make Tests Pass

**CRITICAL**: Only start after T009-T033 (contract tests) are written and failing.

### Host API Endpoints (T052-T061)

- [ ] **T052** Implement POST /api/host/games in `app/api/host/games/route.ts`
  - Parse: CreateGameRequest (Zod validation)
  - Call: `selectQuestions()` utility (T034) to get questions
  - Logic: Generate randomization seeds per question
  - Insert: Game, rounds, game_questions, question_usage rows
  - Return: CreateGameResponse with game_id, game_code, available_questions, warning
  - RLS: Enforce via Supabase server client
  - **Verify**: T009 contract test now PASSES

- [ ] **T053** Implement GET /api/host/games/:id in `app/api/host/games/[id]/route.ts`
  - Query: Fetch game with rounds, game_questions (join questions table)
  - RLS: Supabase enforces host_id = auth.uid()
  - Return: Full game config with shuffled answer preview
  - **Verify**: T010 contract test now PASSES

- [ ] **T054** Implement PUT /api/host/games/:id in `app/api/host/games/[id]/route.ts`
  - Parse: Partial game config (Zod)
  - Update: Game row (only if status = 'setup')
  - Return: Updated game config
  - **Verify**: T011 contract test now PASSES

- [ ] **T055** Implement POST /api/host/games/:id/start in `app/api/host/games/[id]/start/route.ts`
  - Generate: 6-character game_code (unique)
  - Generate: QR code URL
  - Update: Game status to 'active', set started_at
  - Broadcast: `game:started` event on Realtime channel
  - Return: game_code, qr_code_url
  - **Verify**: T012 contract test now PASSES

- [ ] **T056** Implement POST /api/host/games/:id/pause in `app/api/host/games/[id]/pause/route.ts`
  - Update: Game status to 'paused'
  - Broadcast: `game:paused` event
  - Return: Success
  - **Verify**: T013 contract test now PASSES

- [ ] **T057** Implement POST /api/host/games/:id/resume in `app/api/host/games/[id]/resume/route.ts`
  - Update: Game status to 'active'
  - Broadcast: `game:resumed` event
  - Return: Success
  - **Verify**: T014 contract test now PASSES

- [ ] **T058** Implement POST /api/host/games/:id/advance in `app/api/host/games/[id]/advance/route.ts`
  - Update: current_question_index += 1
  - Query: Next game_question with shuffled answers
  - Broadcast: `question:advanced` event with question data
  - Return: Next question index
  - **Verify**: T015 contract test now PASSES

- [ ] **T059** Implement POST /api/host/games/:id/reveal in `app/api/host/games/[id]/reveal/route.ts`
  - Update: game_questions.revealed_at = now()
  - Broadcast: `answer:revealed` event with correct answer
  - Return: Correct answer
  - **Verify**: T016 contract test now PASSES

- [ ] **T060** Implement POST /api/host/games/:id/navigate in `app/api/host/games/[id]/navigate/route.ts`
  - Validate: Target question index in range
  - Update: current_question_index = target
  - Broadcast: `question:navigated` event
  - Return: Success
  - **Verify**: T017 contract test now PASSES

- [ ] **T061** Implement POST /api/host/games/:id/end in `app/api/host/games/[id]/end/route.ts`
  - Update: Game status to 'completed', set completed_at
  - Call: `calculateScores()` utility (T038)
  - Update: Team scores and ranks
  - Broadcast: `game:ended` event with final scores
  - Trigger: Refresh materialized views
  - Return: Final scores
  - **Verify**: T018 contract test now PASSES

### Player API Endpoints (T062-T069)

- [ ] **T062** Implement POST /api/player/auth/register in `app/api/player/auth/register/route.ts`
  - Call: Supabase Auth `signUp()` with email/password
  - Insert: player_profiles row with display_name
  - Return: user_id, session token
  - **Verify**: T019 contract test now PASSES

- [ ] **T063** Implement POST /api/player/auth/anonymous in `app/api/player/auth/anonymous/route.ts`
  - Call: Supabase Auth `signInAnonymously()`
  - Insert: player_profiles row with is_anonymous=true, 30-day expiry (FR-021a)
  - Return: anon user_id, session token
  - **Verify**: T020 contract test now PASSES

- [ ] **T064** Implement GET /api/player/games/:code in `app/api/player/games/[code]/route.ts`
  - Query: Find game by game_code (public access)
  - Return: Game details (name, venue, status)
  - **Verify**: T021 contract test now PASSES

- [ ] **T065** Implement POST /api/player/games/:id/teams in `app/api/player/games/[id]/teams/route.ts`
  - Validate: Game status = 'active', team_name unique
  - Insert: Team row with initial score = 0
  - Insert: team_members row linking player to team
  - Return: team_id
  - **Verify**: T022 contract test now PASSES

- [ ] **T066** Implement POST /api/player/games/:id/teams/:teamId/join in `app/api/player/games/[id]/teams/[teamId]/join/route.ts`
  - Validate: Team not full, game not started
  - Insert: team_members row
  - Return: Success
  - **Verify**: T023 contract test now PASSES

- [ ] **T067** Implement POST /api/player/games/:id/questions/:questionId/answers in `app/api/player/games/[id]/questions/[questionId]/answers/route.ts`
  - Validate: Player is on a team, game is active
  - Insert: answer_submissions row with selected_answer, answer_time_ms
  - **CRITICAL**: UNIQUE constraint handles race condition (FR-043)
  - Catch: 409 conflict if team already answered, return "Your team has already answered"
  - Update: Team score if correct
  - Broadcast: `answer:submitted` event for TV counter update
  - Return: submission_id or error
  - **Verify**: T024 contract test now PASSES (especially 409 case)

- [ ] **T068** Implement GET /api/player/games/:id/status in `app/api/player/games/[id]/status/route.ts`
  - Query: Game current_question_index, status
  - Query: Count teams that answered current question
  - Return: Game status, question index, teams_answered_count
  - **Verify**: T025 contract test now PASSES

- [ ] **T069** Implement GET /api/player/history in `app/api/player/history/route.ts`
  - Query: game_history view filtered by player participation
  - **CRITICAL**: Exclude question content per FR-089 (only show scores, teams, dates)
  - Return: Games array with sanitized data
  - **Verify**: T026 contract test now PASSES

### TV Display API Endpoints (T070-T072)

- [ ] **T070** Implement GET /api/tv/games/:code in `app/api/tv/games/[code]/route.ts`
  - Query: Find game by code (public, no auth)
  - Return: Game details for TV display
  - **Verify**: T027 contract test now PASSES

- [ ] **T071** Implement GET /api/tv/games/:id/question in `app/api/tv/games/[id]/question/route.ts`
  - Query: Current game_question with shuffled answers
  - Return: Question text, answers (same shuffle as players via seed)
  - **Verify**: T028 contract test now PASSES

- [ ] **T072** Implement GET /api/tv/games/:id/scores in `app/api/tv/games/[id]/scores/route.ts`
  - Query: Teams with scores sorted by rank
  - Return: Teams array with rankings
  - **Verify**: T029 contract test now PASSES

### Leaderboard API Endpoints (T073-T074)

- [ ] **T073** Implement GET /api/leaderboard/:venueId in `app/api/leaderboard/[venueId]/route.ts`
  - Query: leaderboard_entries view filtered by venue_name
  - Return: Players sorted by rank (FR-094: venue-based only)
  - **Verify**: T030 contract test now PASSES

- [ ] **T074** Implement GET /api/leaderboard/:venueId/player/:playerId in `app/api/leaderboard/[venueId]/player/[playerId]/route.ts`
  - Query: Single player stats from leaderboard_entries
  - Return: Player stats (games_played, win_rate, accuracy)
  - **Verify**: T031 contract test now PASSES

### Admin API Endpoints (T075-T076)

- [ ] **T075** Implement DELETE /api/host/games/:id in `app/api/host/games/[id]/route.ts`
  - Validate: RLS ensures only creator can delete (FR-024)
  - Delete: Game row (CASCADE deletes related rows)
  - Return: 204 No Content
  - **Verify**: T032 contract test now PASSES

- [ ] **T076** Implement POST /api/admin/leaderboard/refresh in `app/api/admin/leaderboard/refresh/route.ts`
  - Call: Postgres functions `refresh_game_history()`, `refresh_leaderboard()`
  - Return: Success
  - **Verify**: T033 contract test now PASSES

**Verification**: Run `npm test -- tests/contract/` and confirm ALL 25 tests PASS

---

## Phase 3.6: UI Components (T077-T108) - Parallel by Interface

Components are organized by interface (host/player/tv). Tasks within each interface can run in parallel [P].

### Host Components (T077-T089)

- [ ] **T077** [P] Game config form component in `components/host/game-config-form.tsx`
  - Form fields: name, venue, rounds, questions_per_round, categories (multi-select), time_limit, team_size
  - Validation: Zod schema, display errors
  - Submit: Call POST /api/host/games
  - Display: Warning if insufficient questions (FR-007a)
  - Use: shadcn/ui form components

- [ ] **T078** [P] Question preview component in `components/host/question-preview.tsx`
  - Display: 15 questions with shuffled answers
  - Actions: Remove question, replace question
  - Verify: Same shuffle order persists (seeded randomization)
  - Use: shadcn/ui card, button

- [ ] **T079** [P] Control panel component in `components/host/control-panel.tsx`
  - Buttons: Pause, Resume, Advance, Reveal, Navigate Back, End Game
  - State: Zustand store for current_question_index, isPaused, isRevealed
  - Broadcast: Send events on Realtime channels
  - Use: shadcn/ui button, dialog

- [ ] **T080** [P] Game code display component in `components/host/game-code-display.tsx`
  - Display: 6-character game code, QR code
  - Use: qrcode.react library
  - Styling: Large, prominent display

- [ ] **T081** [P] Host dashboard component in `components/host/game-list.tsx`
  - List: Host's games (created, active, completed)
  - Filter: By status
  - Actions: Create New, View, Delete
  - Use: shadcn/ui table, button

- [ ] **T082** [P] Game setup page in `app/(host)/games/[gameId]/setup/page.tsx`
  - Import: GameConfigForm (T077), QuestionPreview (T078)
  - Flow: Configure → Preview → Start
  - Auth: Require host login
  - Layout: Use host layout

- [ ] **T083** [P] Game control page in `app/(host)/games/[gameId]/control/page.tsx`
  - Import: ControlPanel (T079)
  - Display: Current question, teams answered count
  - Real-time: Subscribe to game channel
  - Auth: Require host login

- [ ] **T084** [P] Host scores page in `app/(host)/games/[gameId]/scores/page.tsx`
  - Display: Scoreboard with Recharts bar chart
  - Sort: By score DESC, cumulative time ASC
  - Highlight: Winning team
  - Use: Recharts BarChart

- [ ] **T085** [P] Host dashboard page in `app/(host)/dashboard/page.tsx`
  - Import: GameList (T081)
  - Actions: Create game button
  - Auth: Require host login
  - Layout: Use host layout with nav

- [ ] **T086** [P] Host layout with auth guard in `app/(host)/layout.tsx`
  - Auth: Check Supabase session, redirect to login if not host
  - Nav: Dashboard, Create Game, Logout
  - Use: shadcn/ui navigation

- [ ] **T087** [P] Host login page in `app/(host)/login/page.tsx`
  - Form: Email, password
  - Submit: Supabase Auth signInWithPassword
  - Redirect: To dashboard on success
  - Use: shadcn/ui form, button

- [ ] **T088** [P] Host presence detection in `lib/realtime/host-presence.ts`
  - Monitor: Host connection status via Presence channel
  - Action: Auto-pause game on disconnect (FR-067)
  - Action: Resume on reconnect (FR-068)
  - Broadcast: "Waiting for host" message to players

- [ ] **T089** [P] Zustand store for host controls in `lib/stores/host-control-store.ts`
  - State: currentQuestionIndex, isPaused, isRevealed
  - Actions: advanceQuestion, pauseGame, resumeGame, revealAnswer
  - Persist: Optional localStorage for host preferences

### Player Components (T090-T099)

- [ ] **T090** [P] Game code entry component in `components/player/game-code-entry.tsx`
  - Input: 6-character code (auto-uppercase)
  - Submit: Call GET /api/player/games/:code
  - Validate: Show error if code invalid
  - Use: shadcn/ui input, button

- [ ] **T091** [P] Team selector component in `components/player/team-selector.tsx`
  - Options: Create New Team, Join Existing Team (list)
  - Validate: Team name uniqueness, team capacity
  - Submit: Call POST /api/player/games/:id/teams or join
  - Use: shadcn/ui select, dialog

- [ ] **T092** [P] Answer button component in `components/player/answer-button.tsx`
  - Display: Answer text only (no A/B/C/D labels per FR-038)
  - State: Selected, locked, disabled
  - Submit: Call POST answers endpoint with answer_time_ms
  - Handle: 409 conflict with "Your team has already answered" message
  - Use: shadcn/ui button with custom styling

- [ ] **T093** [P] Countdown timer component in `components/player/countdown-timer.tsx`
  - Display: Only if time_limit_seconds configured (FR-047)
  - Countdown: From configured seconds to zero
  - Alert: Flash/sound when time running out
  - Use: React hooks for interval

- [ ] **T094** [P] Team status indicator in `components/player/team-status.tsx`
  - Display: "Your team has answered" after submission (FR-044)
  - Display: Online team members (Presence channel)
  - Use: shadcn/ui badge, avatar

- [ ] **T095** [P] Player join page in `app/(player)/join/page.tsx`
  - Import: GameCodeEntry (T090)
  - Flow: Enter code → Select team → Lobby
  - Auth: Allow anonymous or registered
  - Layout: Mobile-first, use player layout

- [ ] **T096** [P] Player lobby page in `app/(player)/lobby/page.tsx`
  - Display: Team name, member count, waiting message
  - Real-time: Subscribe to game channel for start event
  - Redirect: To game page when host starts
  - Layout: Mobile-first

- [ ] **T097** [P] Player game page in `app/(player)/game/[gameId]/page.tsx`
  - Import: AnswerButton (T092), CountdownTimer (T093), TeamStatus (T094)
  - Display: Current question, answer options
  - Real-time: Subscribe to game channel for question advances
  - Submit: Answer with timestamp
  - Layout: Mobile-first

- [ ] **T098** [P] Player layout in `app/(player)/layout.tsx`
  - Auth: Check session (allow anonymous per FR-022)
  - Nav: Minimal (logout only)
  - Responsive: Mobile-first design
  - Use: Tailwind responsive classes

- [ ] **T099** [P] Player reconnection handler in `lib/realtime/player-reconnect.ts`
  - Detect: Connection loss
  - Attempt: Auto-reconnect with exponential backoff
  - Fallback: Show "Reconnect" button (FR-097)
  - Rejoin: Auto-rejoin team on reconnect (FR-098)

### TV Display Components (T100-T108)

- [ ] **T100** [P] Question display component in `components/tv/question-display.tsx`
  - Display: Question text (large font)
  - Display: Answer options (shuffled, same as players)
  - Display: "X of Y teams have answered" counter (FR-076)
  - Real-time: Subscribe to TV channel for counter updates
  - Use: Large text, high contrast for TV visibility

- [ ] **T101** [P] Scoreboard component in `components/tv/scoreboard.tsx`
  - Display: Teams with scores, ranks
  - Chart: Recharts bar chart for visual comparison
  - Highlight: Winning team (gold)
  - Animate: Score updates
  - Use: Recharts BarChart, shadcn/ui table

- [ ] **T102** [P] QR code display component in `components/tv/qr-code.tsx`
  - Display: QR code for game join (large, centered)
  - Display: Game code text below
  - Use: qrcode.react library
  - Styling: High contrast, large size

- [ ] **T103** [P] TV lobby page in `app/(tv)/[gameCode]/lobby/page.tsx`
  - Import: QRCode (T102)
  - Display: Team list with member counts
  - Real-time: Update team list as players join
  - Layout: Full-screen, TV-optimized

- [ ] **T104** [P] TV question page in `app/(tv)/[gameCode]/question/page.tsx`
  - Import: QuestionDisplay (T100)
  - Real-time: Subscribe to game channel for question advances
  - Transition: Smooth animation between questions
  - Layout: Full-screen, TV-optimized

- [ ] **T105** [P] TV scores page in `app/(tv)/[gameCode]/scores/page.tsx`
  - Import: Scoreboard (T101)
  - Display: Final scores at game end
  - Animate: Ranking reveal
  - Layout: Full-screen, TV-optimized

- [ ] **T106** [P] TV layout in `app/(tv)/layout.tsx`
  - Auth: None (public access per RLS policies)
  - Styling: Full-screen, no nav/header
  - Use: Dark theme for TV visibility

- [ ] **T107** [P] TV reconnection handler in `lib/realtime/tv-reconnect.ts`
  - Detect: Connection loss
  - Reconnect: Silently in background (FR-101)
  - Resume: Show current state without notification (FR-101a)
  - No host alert: Per FR-101

- [ ] **T108** [P] Shared game state indicator component in `components/shared/game-state-indicator.tsx`
  - Display: "Game Paused", "Waiting for host", "Game Ended" overlays
  - Real-time: Subscribe to game status changes
  - Use: shadcn/ui alert, dialog

---

## Phase 3.7: Integration Tests (T109-T125) - E2E with Playwright

All integration tests can run in parallel [P] as they test different scenarios.

### Host Setup Flow (T109-T112)

- [ ] **T109** [P] E2E test: Host creates game and previews questions in `tests/e2e/host-setup.spec.ts`
  - Open: Host dashboard
  - Action: Create game with config (Scenario 1 from quickstart.md)
  - Verify: 15 questions displayed with shuffled answers
  - Verify: Warning if insufficient questions
  - **Maps to**: Quickstart Steps 1-3

- [ ] **T110** [P] E2E test: Host modifies question selection in `tests/e2e/host-modify-questions.spec.ts`
  - Action: Remove question, select replacement (Scenario 3)
  - Verify: Question replaced, count remains 15
  - **Maps to**: Quickstart Step 4

- [ ] **T111** [P] E2E test: Host starts game and generates code in `tests/e2e/host-start-game.spec.ts`
  - Action: Finalize setup, start game (Scenario 4)
  - Verify: 6-character code displayed, QR code visible
  - Verify: Status changes to 'active'
  - **Maps to**: Quickstart Step 5

- [ ] **T112** [P] E2E test: Host control panel navigation in `tests/e2e/host-controls.spec.ts`
  - Action: Advance, reveal, pause, resume, navigate back
  - Verify: Real-time sync to player devices
  - **Maps to**: Quickstart Steps 9, 12-13

### Player Join Flow (T113-T116)

- [ ] **T113** [P] E2E test: Player enters code and sees team options in `tests/e2e/player-join.spec.ts`
  - Open: /join page (mobile viewport)
  - Action: Enter game code (Scenario 5)
  - Verify: Team selection screen displayed
  - **Maps to**: Quickstart Step 6

- [ ] **T114** [P] E2E test: Player creates team in `tests/e2e/player-create-team.spec.ts`
  - Action: Create team "Quiz Wizards" (Scenario 6)
  - Verify: Redirected to lobby, member count 1/6
  - **Maps to**: Quickstart Step 7

- [ ] **T115** [P] E2E test: Second player joins existing team in `tests/e2e/player-join-team.spec.ts`
  - Context: Two browser tabs/contexts (Scenario 7)
  - Action: Player 2 joins "Quiz Wizards"
  - Verify: Both see updated count 2/6, real-time sync <300ms
  - **Maps to**: Quickstart Step 8

- [ ] **T116** [P] E2E test: Players see question simultaneously in `tests/e2e/player-sync-question.spec.ts`
  - Context: Host + 2 players (Scenario 8)
  - Action: Host advances to Q1
  - Verify: All players see Q1 within 300ms
  - **Maps to**: Quickstart Step 9

### Gameplay Flow (T117-T120)

- [ ] **T117** [P] E2E test: Player submits answer and locks team in `tests/e2e/gameplay-submit-answer.spec.ts`
  - Action: Player 1 submits answer (Scenario 9)
  - Verify: Answer locked, other team members see "Your team has answered"
  - **Maps to**: Quickstart Step 10

- [ ] **T118** [P] E2E test: Duplicate submission rejected with 409 in `tests/e2e/gameplay-duplicate-answer.spec.ts`
  - Context: Player 2 tries to submit after Player 1 (Scenario 10)
  - Verify: Error "Your team has already answered", 409 status
  - Verify: Player 1's answer remains locked
  - **Maps to**: Quickstart Step 11

- [ ] **T119** [P] E2E test: Timer expiry auto-advances question in `tests/e2e/gameplay-timer-expiry.spec.ts`
  - Action: Wait for countdown to reach zero (Scenario 11)
  - Verify: Auto-reveal, host can advance
  - **Maps to**: Quickstart Step 12

- [ ] **T120** [P] E2E test: Complete game and display final scores in `tests/e2e/gameplay-complete-game.spec.ts`
  - Action: Complete all 15 questions (Scenarios 12-14)
  - Verify: Final scores with tie-breaking
  - Verify: Winning team identified
  - **Maps to**: Quickstart Steps 13-15

### Real-Time Sync (T121-T123)

- [ ] **T121** [P] E2E test: Measure sync latency <300ms in `tests/e2e/realtime-sync-latency.spec.ts`
  - Context: Host + player + TV (3 browser contexts)
  - Action: Host advances question, measure time to player update (Scenario 15)
  - Verify: All devices sync within 300ms
  - **Maps to**: Quickstart Step 16

- [ ] **T122** [P] E2E test: TV answer count updates in real-time in `tests/e2e/realtime-tv-counter.spec.ts`
  - Context: TV display + 2 teams (Scenario 16)
  - Action: Teams submit answers
  - Verify: TV shows "1 of 2", then "2 of 2" with <300ms updates
  - **Maps to**: Quickstart Step 17

- [ ] **T123** [P] E2E test: Host disconnection auto-pauses game in `tests/e2e/realtime-host-disconnect.spec.ts`
  - Action: Close host browser tab (Scenario 18)
  - Verify: Game pauses after ~5s, players see "Waiting for host"
  - Action: Host reconnects, resumes
  - **Maps to**: Quickstart Step 19

### Edge Cases (T124-T125)

- [ ] **T124** [P] E2E test: Question reuse prevention across games in `tests/e2e/edge-question-reuse.spec.ts`
  - Action: Host creates second game with same config
  - Verify: No questions repeat from first game
  - Verify: question_usage table populated
  - **Maps to**: Quickstart Step 22

- [ ] **T125** [P] E2E test: Anonymous player 30-day session in `tests/e2e/edge-anonymous-session.spec.ts`
  - Action: Join as guest, play game, close browser
  - Action: Reopen within 30 days
  - Verify: Session persists in localStorage
  - Verify: After 30 days, session expires (mock time)
  - **Maps to**: Quickstart Step 23

---

## Phase 3.8: Validation & Polish (T126-T130)

- [ ] **T126** Run all contract tests and verify 100% pass in CI
  - Command: `npm test -- tests/contract/`
  - Verify: All 25 contract tests PASS
  - Fix: Any remaining failures before proceeding

- [ ] **T127** Run all unit tests and verify coverage ≥80%
  - Command: `npm test -- tests/unit/ --coverage`
  - Verify: All unit tests PASS (question selection, shuffling, scoring)
  - Verify: Coverage report shows ≥80% for utilities

- [ ] **T128** Run all E2E tests and verify all scenarios pass
  - Command: `npx playwright test`
  - Verify: All 17 integration tests PASS
  - Fix: Any flaky tests (retry logic, waits)
  - Record: Videos of failures for debugging

- [ ] **T129** Execute complete quickstart.md manual validation (23 steps)
  - Follow: All 23 steps in quickstart.md
  - Verify: All acceptance scenarios (1-20) pass
  - Verify: Edge cases (22-23) pass
  - Document: Any discrepancies or issues
  - Time: Record execution time (should be 45-60 minutes)

- [ ] **T130** Performance validation: Lighthouse, load testing
  - Run: Lighthouse on player interface (mobile)
  - Verify: Performance ≥90, Accessibility ≥90, Best Practices ≥90
  - Load test: Create game with 10 teams (60 players), all submit simultaneously
  - Verify: Real-time sync <300ms, no dropped messages
  - Profile: Identify any bottlenecks (Postgres query times, Realtime latency)
  - Optimize: Fix any performance issues found

---

## Dependencies

### Critical Path
```
T001-T008 (Setup)
    ↓
T009-T033 (Contract Tests - must FAIL)
    ↓
T034-T040 (Utilities)  ←─ Must complete before API
    ↓
T041-T051 (Database)   ←─ Must complete before API
    ↓
T052-T076 (API Implementation - makes tests PASS)
    ↓
T077-T108 (Components)
    ↓
T109-T125 (Integration Tests)
    ↓
T126-T130 (Validation)
```

### Specific Blockers
- **T052-T076** (API) blocked by: T034-T040 (utilities), T041-T051 (database)
- **T067** (submit answer API) requires: T047 (answer_submissions table with UNIQUE constraint)
- **T077-T108** (components) blocked by: T052-T076 (API implementation)
- **T109-T125** (E2E tests) blocked by: T077-T108 (components must exist)
- **T126-T130** (validation) blocked by: ALL previous tasks

### No Dependencies (Can Run in Parallel)
- **T001-T008**: All setup tasks (different areas: Next.js, Supabase, testing)
- **T009-T033**: All contract tests (different files)
- **T034, T036, T038, T040**: Utilities (different files)
- **T077-T089**: Host components (different files)
- **T090-T099**: Player components (different files)
- **T100-T108**: TV components (different files)
- **T109-T125**: Integration tests (different scenarios)

---

## Parallel Execution Examples

### Example 1: Setup Phase (T001-T008)
```bash
# Run all 8 setup tasks concurrently in separate terminals:
Task 1: "Initialize Next.js 14+ project with TypeScript"
Task 2: "Install Supabase client libraries"
Task 3: "Setup Tailwind CSS and shadcn/ui"
Task 4: "Configure ESLint and TypeScript strict mode"
Task 5: "Setup Vitest and React Testing Library"
Task 6: "Setup Playwright for E2E tests"
Task 7: "Initialize Supabase project and CLI"
Task 8: "Install Zod, Zustand, Recharts, QRCode"

# Or run sequentially with single agent
```

### Example 2: Contract Tests (T009-T033)
```bash
# Run all 25 contract tests in parallel (maximum concurrency)
npm test -- tests/contract/ --maxWorkers=25

# Or launch via Task agents:
Task 1: "Contract test POST /api/host/games"
Task 2: "Contract test GET /api/host/games/:id"
Task 3: "Contract test PUT /api/host/games/:id"
# ... (all 25 tasks launched concurrently)
```

### Example 3: Host Components (T077-T089)
```bash
# Run all 13 host component tasks in parallel
Task 1: "Game config form component"
Task 2: "Question preview component"
Task 3: "Control panel component"
# ... (all 13 tasks launched concurrently)
```

### Example 4: Integration Tests (T109-T125)
```bash
# Run all 17 E2E tests in parallel
npx playwright test --workers=17

# Or launch specific scenarios:
Task 1: "E2E test: Host creates game and previews questions"
Task 2: "E2E test: Player enters code and sees team options"
Task 3: "E2E test: Player submits answer and locks team"
# ... (all 17 tasks launched concurrently)
```

---

## Notes

- **[P] tasks**: Different files, no dependencies, can run truly in parallel
- **TDD Enforcement**: T009-T033 must FAIL before T052-T076 (verify with `npm test`)
- **Real-time Testing**: Use Playwright multi-context for host + players + TV simulation
- **Database Migrations**: Run sequentially (T041-T051) due to FK dependencies
- **Commit Strategy**: Commit after each task or logical group
- **Performance**: Target FCP <1.5s, TTI <3.5s, Lighthouse ≥90 (validated in T130)
- **RLS Testing**: Verify Row-Level Security enforces host/player isolation
- **Answer Locking**: Critical test in T118 (409 conflict handling)

---

## Validation Checklist

*GATE: Verify before marking tasks complete*

- [x] All 25 contracts have corresponding tests (T009-T033)
- [x] All 11 entities have migration tasks (T041-T051)
- [x] All 25 endpoints have implementation tasks (T052-T076)
- [x] All tests come before implementation (Phase 3.2 before 3.5)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path (✓ all tasks include paths)
- [x] No task modifies same file as another [P] task (verified)
- [x] Critical requirements mapped to tasks:
  - FR-006 (question reuse): T034, T048, T124
  - FR-037 (consistent shuffle): T036, T037, T071
  - FR-043 (first answer wins): T047, T067, T118
  - FR-076 (TV counter): T100, T122
  - FR-082 (tie-breaking): T038, T039, T120
  - FR-089 (player history privacy): T069
  - FR-101, FR-101a (TV reconnect): T107

---

## Task Summary

**Total Tasks**: 130
- Phase 3.1 Setup: 8 tasks (all [P])
- Phase 3.2 Contract Tests: 25 tasks (all [P])
- Phase 3.3 Utilities: 7 tasks (4 [P])
- Phase 3.4 Database: 11 tasks (sequential)
- Phase 3.5 API Implementation: 25 tasks (sequential with shared deps)
- Phase 3.6 Components: 32 tasks (all [P] within interface groups)
- Phase 3.7 Integration Tests: 17 tasks (all [P])
- Phase 3.8 Validation: 5 tasks (sequential)

**Parallelizable**: 104 tasks marked [P]
**Sequential**: 26 tasks (database migrations, API with shared deps, validation)

**Estimated Timeline**:
- 1 developer: 4-6 weeks (assuming 5-8 tasks/day)
- Team of 3-4: 2-3 weeks (parallel execution of [P] tasks)

**Ready for Execution**: ✅ All tasks numbered, dependencies clear, file paths specified

---

**Tasks Generated**: 2025-09-30
**Next Step**: Begin Phase 3.1 (T001-T008) - All can run in parallel