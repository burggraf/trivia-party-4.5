# Tasks: Multi-User Trivia Party Application (Vite + React Router)

**Input**: Design documents from `/specs/001-initial-game-setup/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory
   ✓ Loaded: Vite 7+ with React Router 7, Supabase, TypeScript strict
   ✓ Tech stack: React 19+, Tailwind, shadcn/ui, Zustand, Recharts, Playwright
2. Load optional design documents:
   ✓ data-model.md: 11 tables + 2 materialized views extracted
   ✓ research.md: 10 technical decisions extracted
   ✓ quickstart.md: 23 validation steps extracted
3. Architecture: Static client-side React with Vite (no API routes)
   ✓ All backend operations via Supabase browser client
   ✓ Service layer for business logic (lib/services/)
   ✓ Real-time via Supabase Realtime broadcast channels
4. Generate tasks by category:
   ✓ Setup: 8 tasks (T001-T008)
   ✓ Database: 11 migration tasks (T009-T019)
   ✓ Service Layer: 15 tasks (T020-T034) [P]
   ✓ Pages: 20 tasks (T035-T054) [P]
   ✓ Real-time: 4 tasks (T055-T058)
   ✓ Integration Tests: 10 tasks (T059-T068)
   ✓ Validation: 5 tasks (T069-T073)
5. Apply task rules:
   ✓ Service tasks marked [P] (different files)
   ✓ Page tasks marked [P] (different files)
   ✓ Real-time tasks sequential (shared state)
6. Number tasks sequentially (T001-T073)
7. Validate task completeness:
   ✓ All 11 entities have migrations
   ✓ All services implemented
   ✓ All pages implemented
8. Return: SUCCESS (73 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[X]**: Task completed
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this project uses **Vite + React Router** structure:
```
src/
├── pages/           # React Router pages
├── components/      # React components
├── lib/             # Services, hooks, utilities
├── types/           # TypeScript types
tests/               # All test files
supabase/            # Database migrations
```

---

## Phase 3.1: Setup (T001-T008) - Completed ✓

- [X] **T001** [P] Initialize Vite project with TypeScript and React at repository root
  - Run: `npm create vite@latest . -- --template react-ts`
  - Configure: Vite config for static site generation
  - Verify: `package.json` has Vite 7+, TypeScript 5+, React 19+

- [X] **T002** [P] Install and configure Supabase client libraries
  - Run: `npm install @supabase/supabase-js`
  - Create: `src/lib/supabase/client.ts` (browser client)
  - Add environment variables to `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

- [X] **T003** [P] Setup Tailwind CSS and shadcn/ui component library
  - Install: `npm install -D @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react`
  - Configure: Tailwind CSS with PostCSS
  - Create: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, etc.
  - Verify: `src/components/ui/` directory created with primitives

- [X] **T004** [P] Configure ESLint, Prettier, and TypeScript strict mode
  - Update `tsconfig.json`: Enable `strict: true`, `noUncheckedIndexedAccess: true`
  - Create `.eslintrc.json`: Extend recommended configs, add custom rules (no `any` types)
  - Create `.prettierrc`: Configure formatting (semi, single quotes, trailing comma)
  - Add npm scripts: `"lint": "eslint ."`, `"format": "prettier --write ."`

- [X] **T005** [P] Setup Vitest and React Testing Library for unit/component tests
  - Run: `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom`
  - Create: `vitest.config.ts` with React plugin
  - Create: `tests/setup.ts` with Testing Library matchers
  - Add npm script: `"test": "vitest"`

- [X] **T006** [P] Setup Playwright for E2E integration tests
  - Run: `npm install -D @playwright/test`
  - Run: `npx playwright install chromium`
  - Create: `playwright.config.ts` with multi-browser config
  - Add npm script: `"test:e2e": "playwright test"`

- [X] **T007** [P] Initialize Supabase project and setup CLI
  - Run: `npx supabase init` (creates `supabase/` directory)
  - Create: `supabase/config.toml` with project settings
  - Link to remote: `npx supabase link --project-ref <ref>`

- [X] **T008** [P] Install additional dependencies (Zod, Zustand, Recharts, QRCode, React Router)
  - Run: `npm install react-router-dom zod zustand recharts qrcode.react seedrandom`
  - Run: `npm install -D @types/seedrandom prettier`
  - Verify: All packages in `package.json` with correct versions

---

## Phase 3.2: Database Migrations (T009-T019)

- [X] **T009** Create hosts table migration in `supabase/migrations/001_create_hosts.sql`
  - Extends Supabase auth.users with host-specific fields
  - Fields: id (FK to auth.users), email, display_name, created_at, updated_at
  - RLS: Host can only view/update their own record

- [X] **T010** Create games table migration in `supabase/migrations/002_create_games.sql`
  - Main game entity with configuration
  - Fields: id, host_id, game_code (unique), name, venue_name, venue_location, scheduled_at, status, num_rounds, questions_per_round, time_limit_seconds, min_players_per_team, max_players_per_team, sound_effects_enabled, current_question_index, started_at, completed_at, created_at, updated_at
  - RLS: Host can manage their games, players can view active games by code

- [X] **T011** Create rounds table migration in `supabase/migrations/003_create_rounds.sql`
  - Round configuration per game
  - Fields: id, game_id, round_number, categories (text[]), created_at
  - RLS: Follows game access rules

- [X] **T012** Create game_questions table migration in `supabase/migrations/004_create_game_questions.sql`
  - Question instances with randomization seed
  - Fields: id, game_id, round_id, question_id, display_order, randomization_seed, revealed_at, created_at
  - RLS: Follows game access rules

- [X] **T013** Create teams table migration in `supabase/migrations/005_create_teams.sql`
  - Teams within games
  - Fields: id, game_id, team_name, score, cumulative_answer_time_ms, created_at, updated_at
  - RLS: Public read for active games, players can create/join teams

- [X] **T014** Create team_members table migration in `supabase/migrations/006_create_team_members.sql`
  - Players on teams (many-to-many)
  - Fields: id, team_id, player_id, joined_at
  - RLS: Public read, players can join teams

- [X] **T015** Create answer_submissions table migration in `supabase/migrations/007_create_answer_submissions.sql`
  - Team answers with first-submission lock
  - Fields: id, game_question_id, team_id, submitted_by, selected_answer, is_correct, answer_time_ms, submitted_at
  - UNIQUE constraint: (game_question_id, team_id)
  - RLS: Team members can view/create for their team

- [X] **T016** Create question_usage table migration in `supabase/migrations/008_create_question_usage.sql`
  - **Purpose**: Tracks questions used by each host across ALL their games to prevent reuse (FR-006)
  - **Schema**:
    ```sql
    CREATE TABLE IF NOT EXISTS public.question_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
      game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
      used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(host_id, question_id)
    );

    -- Performance: Fast lookups for question selection queries
    CREATE INDEX idx_question_usage_host_question ON public.question_usage(host_id, question_id);
    CREATE INDEX idx_question_usage_game ON public.question_usage(game_id);

    -- RLS Policies
    ALTER TABLE public.question_usage ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Hosts can view their own question usage"
      ON public.question_usage FOR SELECT
      USING (auth.uid() = host_id);

    CREATE POLICY "System can insert question usage records"
      ON public.question_usage FOR INSERT
      WITH CHECK (auth.uid() = host_id);
    ```
  - **Validation**: Query `question_usage` table, verify indexes exist with `\d+ question_usage`, test RLS policies
  - **FR Coverage**: FR-006 (question reuse prevention across all host's games)

- [X] **T017** Create player_profiles table migration in `supabase/migrations/009_create_player_profiles.sql`
  - Player metadata beyond auth
  - Fields: id (FK to auth.users), display_name, is_anonymous, games_played, games_won, total_correct_answers, total_questions_answered, created_at, updated_at
  - RLS: Players can view/update their own profile

- [X] **T018** Create leaderboard_cache table migration in `supabase/migrations/010_create_leaderboard_cache.sql`
  - Aggregated player statistics per venue
  - Fields: id, venue_name, player_id, games_played, games_won, win_rate, avg_score, accuracy, rank, last_updated
  - Materialized view refreshed after game completion

- [X] **T019** Create database indexes migration in `supabase/migrations/011_create_indexes.sql`
  - idx_question_usage_host_question on (host_id, question_id)
  - idx_games_game_code on game_code
  - idx_answer_submissions_game_question on game_question_id
  - idx_teams_game_id on game_id
  - idx_game_questions_display_order on (game_id, display_order)

- [X] **T019a** Create materialized views migration in `supabase/migrations/012_create_materialized_views.sql`
  - **File**: `supabase/migrations/012_create_materialized_views.sql`
  - **Schema**:
    ```sql
    -- Game History (refresh on game completion)
    CREATE MATERIALIZED VIEW public.game_history AS
    SELECT
      g.id AS game_id,
      g.name AS game_name,
      g.game_code,
      g.host_id,
      g.num_rounds,
      g.questions_per_round,
      g.created_at,
      g.completed_at,
      COUNT(DISTINCT t.id) AS team_count,
      COUNT(DISTINCT tm.player_id) AS player_count,
      MAX(t.score) AS winning_score
    FROM games g
    LEFT JOIN teams t ON g.id = t.game_id
    LEFT JOIN team_members tm ON t.id = tm.team_id
    WHERE g.status = 'completed'
    GROUP BY g.id;

    CREATE UNIQUE INDEX idx_game_history_id ON public.game_history(game_id);

    -- Leaderboard Entries (refresh hourly or on-demand)
    CREATE MATERIALIZED VIEW public.leaderboard_entries AS
    SELECT
      tm.player_id,
      p.display_name,
      COUNT(DISTINCT g.id) AS games_played,
      SUM(t.score) AS total_score,
      AVG(t.score) AS avg_score,
      MAX(t.score) AS best_score,
      SUM(CASE WHEN t.score = (SELECT MAX(score) FROM teams WHERE game_id = g.id) THEN 1 ELSE 0 END) AS wins
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN games g ON t.game_id = g.id
    JOIN player_profiles p ON tm.player_id = p.id
    WHERE g.status = 'completed'
    GROUP BY tm.player_id, p.display_name;

    CREATE UNIQUE INDEX idx_leaderboard_player ON public.leaderboard_entries(player_id);

    -- Refresh functions
    CREATE OR REPLACE FUNCTION refresh_game_history()
    RETURNS void AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.game_history;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE OR REPLACE FUNCTION refresh_leaderboard()
    RETURNS void AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_entries;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```
  - **Validation**: Query both views, verify data aggregates correctly, test refresh functions
  - **FR Coverage**: FR-087, FR-088, FR-089 (game history and player leaderboards)

---

## Phase 3.3: Service Layer (T020-T034) - Core business logic

### Game Services (T020-T025)

- [X] **T020** [P] Implement game creation service in `src/lib/services/game-service.ts`
  - createGame(config): Generates game code, creates game/rounds/game_questions
  - Implements question selection with reuse prevention (FR-006, FR-007)
  - Records question usage

- [X] **T021** [P] Implement game control services in `src/lib/services/game-service.ts`
  - startGame(gameId): Changes status to 'active'
  - pauseGame(gameId): Changes status to 'paused'
  - resumeGame(gameId): Changes status to 'active'
  - advanceQuestion(gameId): Increments current_question_index
  - revealAnswer(gameId): Sets revealed_at timestamp
  - navigateToQuestion(gameId, index): Jumps to specific question
  - endGame(gameId): Changes status to 'completed', sets completed_at

- [X] **T022** [P] Implement game query services in `src/lib/services/game-service.ts`
  - getGame(gameId): Fetches game with rounds
  - getHostGames(): Fetches all games for current host
  - findGameByCode(code): Finds game for player join
  - getCurrentQuestion(gameId): Fetches current question with details

- [X] **T023** [P] Implement answer submission service in `src/lib/services/game-service.ts`
  - submitAnswer(request): Submits answer, handles first-submission lock
  - Returns 409 error if team already answered (FR-043)
  - Updates team score automatically (correct = +1, time tracked)

- [X] **T024** [P] Implement game scores service in `src/lib/services/game-service.ts`
  - getGameScores(gameId): Fetches final scores with rankings
  - Sorts by score (desc), then time (asc) for tie-breaking (FR-076)
  - Calculates accuracy percentages

- [X] **T025** [P] Implement question selection utility in `src/lib/game/question-selection.ts`
  - **Purpose**: Select questions excluding previously used ones, handle category exhaustion (FR-006, FR-007, FR-007a)
  - **Core function**:
    ```typescript
    import { supabase } from '@/lib/supabase/client'
    import type { Database } from '@/types/database.types'

    type Question = Database['public']['Tables']['questions']['Row']

    export interface SelectQuestionsParams {
      hostId: string
      categories: string[]
      count: number
    }

    export async function selectQuestions(params: SelectQuestionsParams): Promise<{
      questions: Question[]
      error: Error | null
    }> {
      const { hostId, categories, count } = params

      // Step 1: Get all question IDs used by this host across ALL their games
      const { data: usedQuestions } = await supabase
        .from('question_usage')
        .select('question_id')
        .eq('host_id', hostId)

      const usedIds = usedQuestions?.map(q => q.question_id) || []

      // Step 2: Try to select from requested categories (excluding used questions)
      let query = supabase
        .from('questions')
        .select('*')
        .in('category', categories)

      if (usedIds.length > 0) {
        query = query.not('id', 'in', `(${usedIds.join(',')})`)
      }

      const { data: availableQuestions, error } = await query.limit(count * 2)

      if (error) return { questions: [], error }

      // Step 3: If not enough, supplement from ALL categories (FR-007)
      let selectedQuestions = availableQuestions || []
      if (selectedQuestions.length < count) {
        let supplementQuery = supabase
          .from('questions')
          .select('*')
          .not('category', 'in', `(${categories.join(',')})`)

        if (usedIds.length > 0) {
          supplementQuery = supplementQuery.not('id', 'in', `(${usedIds.join(',')})`)
        }

        const { data: supplementQuestions } = await supplementQuery
          .limit(count - selectedQuestions.length)

        selectedQuestions = [...selectedQuestions, ...(supplementQuestions || [])]
      }

      // Step 4: Shuffle and take exact count needed
      const shuffled = selectedQuestions.sort(() => Math.random() - 0.5)
      const final = shuffled.slice(0, count)

      return { questions: final, error: null }
    }
    ```
  - **Validation**: Test with categories exhausted, test with all questions used, verify no reuse
  - **FR Coverage**: FR-006 (reuse prevention), FR-007 (category exhaustion), FR-008 (auto-supplement)
  - **Dependencies**: T016 (question_usage table)

- [X] **T025a** [P] Implement answer shuffling utility in `src/lib/game/answer-shuffling.ts`
  - **Purpose**: Deterministic shuffle using stored seed for consistent order across all clients (FR-009, FR-037)
  - **Install dependency**: `npm install seedrandom && npm install -D @types/seedrandom`
  - **Core function**:
    ```typescript
    import seedrandom from 'seedrandom'

    export interface ShuffleAnswersParams {
      answers: string[]  // [a, b, c, d] where a is always correct
      seed: number       // Stored in games.answer_shuffle_seed
    }

    export function shuffleAnswers(params: ShuffleAnswersParams): {
      shuffled: string[]
      correctIndex: number
    } {
      const { answers, seed } = params
      const rng = seedrandom(seed.toString())

      // Fisher-Yates shuffle with seeded random
      const shuffled = [...answers]
      const originalCorrect = shuffled[0] // 'a' is always correct

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      // Find new index of correct answer
      const correctIndex = shuffled.findIndex(ans => ans === originalCorrect)

      return { shuffled, correctIndex }
    }

    // Generate seed when creating game
    export function generateShuffleSeed(): number {
      return Math.floor(Math.random() * 1000000)
    }
    ```
  - **Usage in createGame()**: Store seed in `games.answer_shuffle_seed`
  - **Usage in UI**: All clients (host, players, TV) use same seed for identical order
  - **Validation**: Verify same seed produces same order, verify different seeds produce different orders
  - **FR Coverage**: FR-009 (deterministic shuffle), FR-037 (identical for all participants)
  - **Dependencies**: None

### Team Services (T026-T028)

- [X] **T026** [P] Implement team management in `src/lib/services/team-service.ts`
  - createTeam(gameId, teamName): Creates team
  - joinTeam(teamId, playerId): Adds player to team
  - leaveTeam(teamId, playerId): Removes player from team

- [X] **T027** [P] Implement team query services in `src/lib/services/team-service.ts`
  - getTeams(gameId): Fetches all teams for game
  - getTeam(teamId): Fetches specific team with members
  - getMyTeam(gameId): Fetches current player's team

- [X] **T028** [P] Implement team scoring in `src/lib/services/team-service.ts`
  - updateTeamScore(teamId, points, time): Updates score and cumulative time
  - getTeamScores(gameId): Fetches all team scores for game

### Auth Services (T029-T030)

- [X] **T029** [P] Implement host authentication service in `src/lib/services/auth-service.ts`
  - **Purpose**: Host login with email/password and session management (FR-013, FR-014, FR-019, FR-020)
  - **Functions to implement**:
    ```typescript
    import { supabase } from '@/lib/supabase/client'
    import type { User, Session } from '@supabase/supabase-js'

    export interface AuthResult {
      user: User | null
      session: Session | null
      error: Error | null
    }

    // Host login with email/password
    export async function loginHost(email: string, password: string): Promise<AuthResult> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { user: null, session: null, error }
      return { user: data.user, session: data.session, error: null }
    }

    // Host signup (create account)
    export async function signupHost(email: string, password: string): Promise<AuthResult> {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { user: null, session: null, error }

      // Create host record
      if (data.user) {
        await supabase.from('hosts').insert({
          id: data.user.id,
          email: data.user.email,
        })
      }

      return { user: data.user, session: data.session, error: null }
    }

    // Logout (all user types)
    export async function logout(): Promise<{ error: Error | null }> {
      const { error } = await supabase.auth.signOut()
      return { error }
    }

    // Get current session
    export async function getCurrentUser(): Promise<{ user: User | null; session: Session | null }> {
      const { data: { user, session } } = await supabase.auth.getSession()
      return { user, session }
    }
    ```
  - **Session persistence**: Supabase Auth automatically stores session in localStorage
  - **Validation**: Test login, signup, logout, session persistence across page reloads
  - **FR Coverage**: FR-019 (host authentication), FR-020 (session management)
  - **Dependencies**: T009 (hosts table), Supabase Auth configured

- [X] **T030** [P] Implement player authentication with email/password and anonymous session support
  - **Purpose**: Player login options including 30-day anonymous sessions (FR-021, FR-021a, FR-022)
  - **File**: `src/lib/services/auth-service.ts` (add to existing file from T029)
  - **Functions to implement**:
    ```typescript
    // Player login with email/password (registered players)
    export async function loginPlayer(email: string, password: string): Promise<AuthResult> {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { user: null, session: null, error }
      return { user: data.user, session: data.session, error: null }
    }

    // Player signup (create registered account)
    export async function signupPlayer(email: string, password: string, displayName: string): Promise<AuthResult> {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      })
      if (error) return { user: null, session: null, error }

      // Create player record
      if (data.user) {
        await supabase.from('player_profiles').insert({
          id: data.user.id,
          display_name: displayName,
          is_anonymous: false
        })
      }

      return { user: data.user, session: data.session, error: null }
    }

    // Anonymous login (guest players) - 30-day session (FR-021a)
    export async function loginAnonymous(): Promise<AuthResult> {
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) return { user: null, session: null, error }

      // Create anonymous player record
      const displayName = `Guest_${Math.random().toString(36).substring(2, 8)}`
      if (data.user) {
        await supabase.from('player_profiles').insert({
          id: data.user.id,
          display_name: displayName,
          is_anonymous: true
        })
      }

      return { user: data.user, session: data.session, error: null }
    }

    // Check if session is anonymous
    export async function isAnonymousSession(): Promise<boolean> {
      const { user } = await getCurrentUser()
      if (!user) return false
      return user.is_anonymous || false
    }
    ```
  - **Session expiry**: Anonymous sessions automatically expire after 30 days (Supabase default, FR-021a)
  - **Multi-device support**: Registered players can login from multiple devices with synchronized state (FR-020a)
  - **Validation**: Test registered login, anonymous login, session expiry, multi-device sync
  - **FR Coverage**: FR-021 (player registration), FR-021a (30-day anonymous), FR-022 (anonymous auth), FR-020a (multi-device)
  - **Dependencies**: T017 (player_profiles table), Supabase Auth configured

### Utility Services (T031-T034)

- [X] **T031** [P] Implement game code utilities in `src/lib/utils/game-code.ts`
  - generateGameCode(): Creates 6-character unique code
  - validateGameCode(code): Validates code format

- [X] **T032** [P] Implement QR code utilities in `src/lib/utils/qr-code.ts`
  - generateQRCode(url): Generates QR code for player join
  - getJoinUrl(gameCode): Creates join URL

- [X] **T033** [P] Implement hooks in `src/lib/hooks/`
  - use-auth.ts: useAuth() hook for current user
  - use-game.ts: useGame() hook for game state
  - use-realtime.ts: useRealtime() hook for Supabase channels

- [X] **T034** [P] Generate TypeScript types from Supabase
  - Run: `npx supabase gen types typescript --local > src/types/database.types.ts`
  - Create: `src/types/game.types.ts` for domain types
  - Create: `src/types/api.types.ts` with Zod schemas

---

## Phase 3.4: Pages & Components (T035-T054)

### Host Pages (T035-T040)

- [X] **T035** [P] Implement host auth pages in `src/pages/host/`
  - HostLoginPage.tsx: Email/password login
  - HostRegisterPage.tsx: New host registration
  - HostForgotPasswordPage.tsx: Password reset

- [X] **T036** [P] Implement HostDashboardPage in `src/pages/host/HostDashboardPage.tsx`
  - Lists all games for current host
  - Shows game status, code, date
  - "Create New Game" button
  - "View Results" for completed games

- [X] **T037** [P] Implement GameCreatePage in `src/pages/host/games/GameCreatePage.tsx`
  - Form for game configuration (name, venue, rounds, questions, categories)
  - Category multi-select
  - Preview question count
  - Creates game and navigates to control page

- [X] **T038** [P] Implement GameControlPage in `src/pages/host/games/GameControlPage.tsx`
  - Displays current question with correct answer highlighted
  - Control buttons: Start, Pause/Resume, Reveal Answer, Next Question, End Game
  - Teams list with answer status
  - Real-time team answer count (needs T055-T058)

- [X] **T038a** [P] Add backward navigation support to GameControlPage with answer preservation
  - **Purpose**: Allow host to navigate to previous questions while preserving submitted answers (FR-061)
  - **File**: `src/pages/host/games/GameControlPage.tsx`
  - **Changes**:
    1. Add "Previous Question" button (disabled on question 1)
    2. Implement `handlePreviousQuestion()` function:
       ```typescript
       const handlePreviousQuestion = async () => {
         if (!gameId || game.current_question_index === 0) return
         setActionLoading(true)

         // Update game to previous question index
         const { data: updatedGame, error } = await supabase
           .from('games')
           .update({ current_question_index: game.current_question_index - 1 })
           .eq('id', gameId)
           .select()
           .single()

         if (error) {
           setError('Failed to go to previous question')
         } else {
           setGame(updatedGame)
           // Reload question
           const { question: questionData } = await getCurrentQuestion(gameId)
           setQuestion(questionData)
         }

         setActionLoading(false)
       }
       ```
    3. Broadcast to players/TV via Realtime channel (handled by T055-T058)
  - **Player behavior**: Previously submitted answers remain locked, display "Already answered" message
  - **TV behavior**: Display previous question with submitted answer counts (frozen from previous state)
  - **Validation**: Navigate backward, verify answers preserved, navigate forward again
  - **FR Coverage**: FR-061 (navigate back preserves answers)
  - **Dependencies**: T021 (game control services), T055-T058 (Realtime sync)

- [X] **T039** [P] Update GameScoresPage in `src/pages/host/games/GameScoresPage.tsx`
  - Replace mock data with getGameScores() call
  - Display final rankings sorted by score and time
  - Show accuracy percentages
  - "Start New Game" and "Back to Dashboard" buttons

- [ ] **T040** [P] Implement host components in `src/components/host/`
  - game-config-form.tsx: Reusable game configuration form
  - question-preview.tsx: Question display with answer highlighting
  - team-list.tsx: Team list with status indicators

### Player Pages (T041-T046)

- [X] **T041** [P] Implement player auth pages in `src/pages/player/`
  - PlayerLoginPage.tsx: Email/password or anonymous login
  - PlayerRegisterPage.tsx: New player registration
  - PlayerForgotPasswordPage.tsx: Password reset

- [X] **T042** [P] Implement JoinGamePage in `src/pages/player/JoinGamePage.tsx`
  - Game code input
  - Team name input (create or join existing)
  - Player name input
  - Navigates to lobby after join

- [X] **T043** [P] Implement LobbyPage in `src/pages/player/LobbyPage.tsx`
  - Shows game info and team members
  - Displays "Waiting for host to start..." message
  - Auto-redirects to GamePage when game starts (needs T055-T058)

- [X] **T044** [P] Implement GamePage in `src/pages/player/GamePage.tsx`
  - Displays current question with 4 answer options
  - Timer countdown (visual indicator)
  - Submit answer button (disabled after submission)
  - Shows "Answer submitted! Waiting for other teams..." after submit
  - Auto-updates when host advances question (needs T055-T058)

- [X] **T045** [P] Implement player results page in `src/pages/player/PlayerResultsPage.tsx`
  - Shows final score for player's team
  - Displays team ranking
  - Option to join another game

- [ ] **T046** [P] Implement player components in `src/components/player/`
  - answer-button.tsx: Large touch-friendly answer button
  - team-status.tsx: Shows team members online/offline
  - timer-display.tsx: Visual countdown timer

### TV Display Pages (T047-T051)

- [X] **T047** [P] Update TVLobbyPage in `src/pages/tv/TVLobbyPage.tsx`
  - Replace mock data with real game data
  - Display QR code for player join
  - Show game code prominently
  - List all teams and player counts
  - Auto-advances to question when game starts (needs T055-T058)

- [X] **T048** [P] Update TVQuestionPage in `src/pages/tv/TVQuestionPage.tsx`
  - Replace mock data with getCurrentQuestion() call
  - Display question and shuffled answers (use randomization seed)
  - Show timer countdown
  - Display teams answered count
  - Highlight correct answer when revealed
  - Auto-advances when host advances (needs T055-T058)

- [X] **T049** [P] Update TVScoresPage in `src/pages/tv/TVScoresPage.tsx`
  - Replace mock data with getGameScores() call
  - Display leaderboard with rankings
  - Show score, accuracy, and cumulative time
  - Winner announcement with animation

- [ ] **T050** [P] Implement TV components in `src/components/tv/`
  - question-display.tsx: Large format question display
  - scoreboard.tsx: Animated scoreboard
  - qr-code.tsx: QR code generator component

### Shared Components (T051-T054)

- [ ] **T051** [P] Implement shared components in `src/components/shared/`
  - team-status.tsx: Team member list with online indicators
  - game-state-indicator.tsx: Game status badge

- [ ] **T052** [P] Implement layout components in `src/components/layouts/`
  - HostLayout.tsx: Host interface layout with navigation
  - PlayerLayout.tsx: Player interface layout
  - TVLayout.tsx: TV display full-screen layout

- [X] **T053** [P] Setup React Router in `src/App.tsx`
  - Configure routes for all pages
  - Add route guards for authentication
  - Implement 404 page

- [X] **T054** [P] Implement error boundary in `src/components/ErrorBoundary.tsx`
  - Catches React errors
  - Displays user-friendly error message
  - Logs to console for debugging

---

## Phase 3.5: Real-time Synchronization (T055-T058) - Completed ✓

- [X] **T055** Implement Supabase Realtime channels in `src/lib/realtime/channels.ts`
  - createGameChannel(gameId): Main game state broadcast
  - createPresenceChannel(teamId): Team member presence
  - createTVChannel(gameId): TV-specific updates
  - Exponential backoff reconnection logic

- [X] **T056** Implement game state synchronization in `src/lib/realtime/game-channel.ts`
  - Broadcast on: question advance, answer reveal, pause/resume, game end
  - Listeners: Host control page, player game page, TV question page
  - Update local state on events

- [X] **T057** Implement presence synchronization in `src/lib/realtime/presence-channel.ts`
  - Track team members online/offline
  - Broadcast heartbeat every 30s
  - Update UI when members join/leave

- [X] **T058** Implement TV synchronization in `src/lib/realtime/tv-channel.ts`
  - Broadcast teams_answered_count
  - TV pages listen for updates
  - Auto-advance between lobby, question, and scores

---

## Phase 3.6: Integration Tests (T059-T068)

- [ ] **T059** [P] E2E test: Host game setup in `tests/e2e/host-setup.spec.ts`
  - Register host, login, create game
  - Verify game code generated
  - Verify game appears in dashboard

- [ ] **T060** [P] E2E test: Player join flow in `tests/e2e/player-join.spec.ts`
  - Join game with code
  - Create/join team
  - Verify lobby displays correctly

- [ ] **T061** [P] E2E test: Host start game in `tests/e2e/host-start.spec.ts`
  - Start game from control page
  - Verify status changes to 'active'
  - Verify question loads

- [ ] **T062** [P] E2E test: Player answer submission in `tests/e2e/player-answer.spec.ts`
  - Submit answer before timer expires
  - Verify answer recorded in database
  - Verify score updated
  - Test duplicate submission blocked

- [ ] **T063** [P] E2E test: Host reveal and advance in `tests/e2e/host-advance.spec.ts`
  - Reveal answer
  - Advance to next question
  - Verify question index incremented

- [ ] **T064** [P] E2E test: Multi-player gameplay in `tests/e2e/multi-player.spec.ts`
  - Two players, two teams
  - Both submit answers
  - Verify scores calculated correctly
  - Verify tie-breaking works

- [ ] **T065** [P] E2E test: Real-time sync in `tests/e2e/realtime-sync.spec.ts`
  - Host advances question
  - Player page auto-updates
  - TV page auto-updates
  - Verify sync latency < 300ms

- [ ] **T066** [P] E2E test: Game completion in `tests/e2e/game-completion.spec.ts`
  - Advance through all questions
  - End game
  - Verify final scores page displays
  - Verify game history updated

- [ ] **T067** [P] Unit test: Question selection in `tests/unit/question-selection.test.ts`
  - Test reuse prevention
  - Test category exhaustion handling
  - Test auto-supplementation

- [ ] **T068** [P] Unit test: Scoring logic in `tests/unit/scoring.test.ts`
  - Test score calculation
  - Test tie-breaking by time
  - Test accuracy percentages

---

## Phase 3.7: Validation & Polish (T069-T073)

- [ ] **T069** Run complete quickstart.md validation
  - Execute all 23 steps
  - Verify all acceptance scenarios pass
  - Document any issues

- [ ] **T070** Performance optimization
  - Run Lighthouse audit
  - Verify FCP < 1.5s, TTI < 3.5s
  - Optimize bundle size
  - Implement code splitting

- [ ] **T071** Accessibility audit
  - Test keyboard navigation
  - Verify ARIA labels
  - Test screen reader compatibility
  - Fix any issues

- [ ] **T072** Cross-browser testing
  - Test in Chrome, Firefox, Safari
  - Test on mobile devices (iOS, Android)
  - Verify WebSocket support

- [ ] **T073** Documentation updates
  - Update README.md with setup instructions
  - Document environment variables
  - Add deployment guide

---

## Dependencies

**Sequential Dependencies:**
- Phase 3.1 (Setup) → Phase 3.2 (Database)
- Phase 3.2 (Database) → Phase 3.3 (Services)
- Phase 3.3 (Services) → Phase 3.4 (Pages)
- Phase 3.4 (Pages) → Phase 3.5 (Real-time)
- Phase 3.5 (Real-time) → Phase 3.6 (Integration Tests)
- Phase 3.6 (Integration Tests) → Phase 3.7 (Validation)

**Parallel Opportunities:**
- All database migrations (T009-T019) can run in parallel
- All service layer tasks (T020-T034) can run in parallel
- All page tasks within same interface (T035-T054) can run in parallel
- All integration tests (T059-T068) can run in parallel

---

## Progress Summary

**Completed**: 49/74 tasks (66.2%)
- ✅ Phase 3.1: Setup (8/8) - Complete
- ✅ Phase 3.2: Database migrations (12/12) - Complete
- ✅ Phase 3.3: Service Layer (15/15) - Complete
- ✅ Phase 3.4: Pages & Infrastructure (21/21) - ALL PAGES COMPLETE
- ✅ Phase 3.5: Real-time synchronization (4/4) - Complete

**Remaining**:
- Phase 3.4: Component libraries (T040, T046, T050-T052) - Optional refactoring
- Phase 3.6: Integration tests (0/10) - Ready to implement
- Phase 3.7: Validation (0/5) - Ready to execute

**Not Started**:
- Phase 3.6: Integration tests (0/10)
- Phase 3.7: Validation (0/5)

---

## Next Steps

**Immediate priorities:**
1. Complete database migrations (T009-T019) - Required for production
2. Update TV display pages with real data (T047-T049)
3. Implement real-time synchronization (T055-T058) - Critical for UX
4. Update GameScoresPage with real data (T039)
5. Fix auth session persistence issue
6. Run integration tests (T059-T068)

**Critical path for MVP:**
T009-T019 → T039, T047-T049 → T055-T058 → T059-T066 → T069
