# Implementation Plan: Multi-User Trivia Party Application

**Branch**: `001-initial-game-setup` | **Date**: 2025-09-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-initial-game-setup/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   ✓ Loaded successfully - 119 functional requirements identified
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✓ Project Type: Web application (static React + Supabase backend)
   ✓ Set Structure Decision based on Vite + React Router (migrated from initial Next.js plan)
3. Fill the Constitution Check section based on the constitution document
   ✓ Aligned with constitution: Static React + Supabase exclusive
4. Evaluate Constitution Check section below
   ✓ No violations - full alignment with constitutional principles
   ✓ Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   ✓ All technical decisions resolved (no NEEDS CLARIFICATION)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   ✓ Generated all Phase 1 artifacts
7. Re-evaluate Constitution Check section
   ✓ No new violations after design
   ✓ Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   ✓ Task strategy documented below
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Primary Requirement**: Build a real-time multi-user trivia application for pub/restaurant venues with three distinct interfaces (Host, Player, TV Display) enabling interactive trivia gameplay with team-based competition, real-time synchronization, and comprehensive game management.

**Technical Approach**: Static React application deployed to Cloudflare Pages using **Vite + React Router** for client-side routing. All backend services provided by Supabase (PostgreSQL with RLS, Auth, Realtime broadcast channels). Answer shuffling uses client-generated randomization seed stored per question instance for consistent display across all clients. Question reuse prevention tracked via `question_usage` table with composite indexes. Real-time synchronization via Supabase Realtime broadcast channels (not table subscriptions) with exponential backoff reconnection logic.

**NOTE**: Originally planned with Next.js App Router, but migrated to Vite for better static site generation performance and simpler client-side routing. See `VITE_MIGRATION.md` for details.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode, no `any` types), React 19+, Node.js 18+ (build-time only)
**Primary Dependencies**:
- **Vite 7+** (fast dev server, static site build)
- **React Router 7** (client-side routing)
- Supabase client library (`@supabase/supabase-js`)
- shadcn/ui + Tailwind CSS + Radix UI primitives
- Zod (runtime schema validation)
- Zustand (client state management for host controls)
- Recharts (score visualizations)
- QRCode.react (QR code generation)
- Vitest + React Testing Library (unit/component tests)
- Playwright (E2E integration tests)

**Storage**: Supabase PostgreSQL with Row-Level Security (RLS)
- 11 application tables
- Existing `questions` table (61,000+ rows) with category index
- `question_usage` table for reuse prevention (composite index on `host_id, question_id`)

**Testing**:
- Vitest for unit tests (pure functions: scoring, shuffling, question selection)
- React Testing Library for component tests
- Playwright for E2E integration tests (multi-client scenarios)
- Contract tests for all 25 API endpoints (Zod schema validation)

**Target Platform**: Static web application (Cloudflare Pages), mobile-first responsive design
**Project Type**: Web (static frontend with Supabase backend services)

**Performance Goals**:
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Real-time sync latency < 300ms (broadcast channel propagation)
- Lighthouse Performance score ≥ 90

**Constraints**:
- Static site only (no Node.js runtime APIs, no server-side execution)
- Supabase exclusive (no other backend services)
- All logic runs in browser or Supabase (Postgres functions or Edge Functions)
- File size target: ≤250 lines per file for maintainability
- Browser compatibility: Modern browsers supporting WebSocket

**Scale/Scope**:
- Expected concurrent games: 10-50 per venue
- Players per game: 10-50 (2-10 teams of 1-6 players)
- Question database: 61,000+ questions
- Real-time broadcast: 3 channels per game (game state, presence, TV updates)
- Three distinct UI interfaces with separate routing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Architecture Requirements ✅

**Static Client-Side React Application**:
- ✅ Vite 7+ with React Router deployed as static site to Cloudflare Pages
- ✅ No server-side execution beyond build time
- ✅ All application logic runs in browser
- ✅ React with TypeScript strict mode enforced
- ✅ shadcn/ui components with Tailwind CSS for all UI
- ✅ Target: ≤250 lines per file

**Backend: Supabase Exclusive**:
- ✅ `@supabase/supabase-js` is the only backend interface
- ✅ All data operations through Supabase PostgreSQL with RLS
- ✅ Authentication via Supabase Auth (email/password + anonymous)
- ✅ Realtime via Supabase Realtime broadcast channels
- ✅ Postgres functions (via `supabase.rpc()`) for complex queries
  - Question selection with exclusion logic
  - Score calculation with tie-breaking
  - Leaderboard aggregation
- ✅ Edge Functions only if needed for external integrations (none identified)

### Code Quality Standards ✅

- ✅ TypeScript strict mode with zero `any` types
- ✅ ESLint with zero warnings
- ✅ Small, focused functions and components
- ✅ Inline documentation for complex logic (answer shuffling, question selection)

### Experience & Quality Standards ✅

**Design Consistency**:
- ✅ shadcn/ui components exclusively
- ✅ Consistent Tailwind design tokens
- ✅ Semantic HTML, ARIA labels, keyboard navigation

**Testing & Validation**:
- ✅ TypeScript compilation with strict mode
- ✅ ESLint validation
- ✅ Unit tests for business logic (scoring, shuffling)
- ✅ Integration tests for critical flows (game setup, player join, gameplay)

**Performance Targets**:
- ✅ FCP < 1.5s, TTI < 3.5s, Lighthouse ≥ 90 (as per constitution)

### Constitution Alignment: PASS ✅

No deviations from constitutional principles. The specification naturally aligns with the static React + Supabase architecture defined in the constitution.

## Project Structure

### Documentation (this feature)
```
specs/001-initial-game-setup/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   └── api-contracts.md # 25 REST endpoint contracts with Zod schemas
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
src/                          # Vite source directory
├── pages/                    # Page components (React Router routes)
│   ├── HomePage.tsx         # Landing page
│   ├── TestPage.tsx         # Architecture test page
│   ├── host/                # Host interface pages
│   │   ├── HostLoginPage.tsx
│   │   ├── HostDashboardPage.tsx
│   │   └── games/
│   │       ├── GameSetupPage.tsx      # Game configuration & preview
│   │       ├── GameControlPage.tsx    # Active game controls
│   │       └── GameScoresPage.tsx     # Score display
│   ├── player/              # Player interface pages (mobile-first)
│   │   ├── PlayerLoginPage.tsx
│   │   ├── PlayerJoinPage.tsx         # Game code entry / QR scan
│   │   ├── PlayerLobbyPage.tsx        # Pre-game team lobby
│   │   └── PlayerGamePage.tsx         # Active game (questions & answers)
│   └── tv/                  # TV display pages (public, no auth)
│       ├── TvLobbyPage.tsx            # Pre-game team list
│       ├── TvQuestionPage.tsx         # Question display
│       └── TvScoresPage.tsx           # Scoreboard
├── lib/                      # Client-side services and utilities
│   ├── services/            # Supabase service wrappers
│   ├── hooks/               # React hooks
│   └── utils/               # Helper functions
├── types/                    # TypeScript type definitions
├── App.tsx                   # React Router configuration
└── main.tsx                  # Application entry point

components/
├── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
├── host/                     # Host-specific components
│   ├── game-config-form.tsx
│   ├── question-preview.tsx
│   └── control-panel.tsx
├── player/                   # Player-specific components
│   ├── answer-button.tsx
│   ├── team-selector.tsx
│   └── countdown-timer.tsx
├── tv/                       # TV-specific components
│   ├── question-display.tsx
│   ├── scoreboard.tsx
│   └── qr-code.tsx
└── shared/                   # Cross-interface components
    ├── team-status.tsx
    └── game-state-indicator.tsx

lib/
├── supabase/
│   ├── client.ts            # Browser Supabase client
│   ├── server.ts            # Server Supabase client (for RLS enforcement)
│   └── types.ts             # Generated Supabase types
├── game/
│   ├── question-selection.ts    # Question selection with reuse prevention
│   ├── answer-shuffling.ts      # Seeded random shuffle (deterministic)
│   └── scoring.ts               # Score calculation with tie-breaking
├── realtime/
│   ├── channels.ts              # Supabase Realtime channel setup
│   ├── game-channel.ts          # Game state broadcast
│   ├── presence-channel.ts      # Team member presence
│   └── tv-channel.ts            # TV-specific updates
└── utils/
    ├── game-code.ts             # Game code generation/validation
    └── qr-code.ts               # QR code generation helpers

types/
├── database.types.ts        # Generated from Supabase (via supabase gen types)
├── game.types.ts            # Game domain types (Game, Round, Question, etc.)
└── api.types.ts             # API request/response types with Zod schemas

tests/
├── contract/                # Contract tests (one per endpoint, 25 files)
│   ├── host/
│   │   ├── test_create_game.ts
│   │   ├── test_update_game.ts
│   │   └── ...
│   ├── player/
│   │   ├── test_join_game.ts
│   │   ├── test_submit_answer.ts
│   │   └── ...
│   └── tv/
│       └── test_get_game_state.ts
├── unit/                    # Unit tests for pure functions
│   ├── question-selection.test.ts
│   ├── answer-shuffling.test.ts
│   └── scoring.test.ts
└── e2e/                     # Playwright integration tests
    ├── host-setup.spec.ts
    ├── player-join.spec.ts
    ├── gameplay.spec.ts
    └── realtime-sync.spec.ts

supabase/
├── migrations/              # Database migrations (schema)
├── functions/               # Edge Functions (if needed)
└── seed.sql                 # Seed data (test hosts, games)
```

**Structure Decision**: Vite + React Router with separate page components for interface separation. This provides:
- Clear separation of concerns (host/player/TV interfaces organized in `src/pages/`)
- Client-side routing with React Router for SPA navigation
- URL structure reflects user roles: `/host/dashboard`, `/player/join`, `/tv/[gameCode]/lobby`
- Fast dev server with instant HMR (Hot Module Replacement)
- Optimized static build output in `dist/` directory
- Aligns with constitution's static React requirement

## Phase 0: Outline & Research

No unknowns in Technical Context - all decisions resolved during specification and constitutional alignment. Proceeding directly to `research.md` generation to document rationale for technology choices.

**Research Topics** (See `research.md` for detailed analysis):
1. **Vite + React Router** for static site generation (migrated from Next.js for better SPA performance)
2. **Supabase Realtime** broadcast channels vs. table subscriptions for game state
3. **Answer shuffling** algorithm with seeded randomization for consistency
4. **Question reuse prevention** query patterns with large dataset (61k+ rows)
5. **Row-Level Security** policies for multi-tenant host isolation
6. **Anonymous authentication** session management in Supabase
7. **QR code generation** for mobile player onboarding
8. **Zustand** for host control panel state management
9. **Recharts** for score visualization
10. **Playwright** multi-client testing strategies

**Output**: research.md documenting all technical decisions with rationale

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

### 1. Extract entities from feature spec → `data-model.md`

**Database Schema** (11 tables + 2 materialized views):

**Tables**:
1. `hosts` (extends Supabase auth.users)
2. `games` (main game entity with config)
3. `rounds` (round configuration per game)
4. `game_questions` (question instances with randomization seed)
5. `teams` (teams within games)
6. `team_members` (players on teams)
7. `answer_submissions` (team answers with timestamps)
8. `question_usage` (tracks used questions per host)
9. `player_profiles` (player metadata beyond auth)
10. `leaderboard_cache` (aggregated stats per venue)
11. `game_events` (audit log for state transitions)

**Existing Table** (read-only):
- `questions` (61,000+ trivia questions with categories)

**Key Relationships**:
- `games` ↔ `hosts` (1:N, RLS enforces host ownership)
- `games` ↔ `rounds` (1:N)
- `rounds` ↔ `game_questions` (1:N)
- `game_questions` ↔ `questions` (N:1, foreign key)
- `games` ↔ `teams` (1:N)
- `teams` ↔ `team_members` (1:N)
- `team_members` ↔ `player_profiles` (N:1)
- `game_questions` ↔ `answer_submissions` (1:N)
- `hosts` ↔ `question_usage` (1:N, tracks reuse prevention)

**State Machine** (`games.status`):
```
setup → active → paused ⇄ active → completed
     ↓
 completed (early termination)
```

### 2. Service Layer Architecture

All database operations are performed **client-side** using the Supabase browser client (`src/lib/supabase/client.ts`). This aligns with our constitutional principle of "static site only" - zero server-side execution.

**Service Layer Structure**:

```typescript
// src/lib/services/game-service.ts
export async function createGame(params: CreateGameParams): Promise<GameResult>
export async function getGame(gameId: string): Promise<GameResult>
export async function startGame(gameId: string): Promise<GameResult>
export async function pauseGame(gameId: string): Promise<GameResult>
export async function resumeGame(gameId: string): Promise<GameResult>
export async function advanceQuestion(gameId: string): Promise<GameResult>
export async function revealAnswer(gameId: string): Promise<GameResult>
export async function navigateToQuestion(gameId: string, index: number): Promise<GameResult>
export async function endGame(gameId: string): Promise<GameResult>
export async function submitAnswer(params: SubmitAnswerParams): Promise<SubmitAnswerResult>
export async function getGameScores(gameId: string): Promise<GameScoresResult>
export async function getCurrentQuestion(gameId: string): Promise<QuestionResult>

// src/lib/services/team-service.ts
export async function createTeam(params: CreateTeamParams): Promise<TeamResult>
export async function joinTeam(params: JoinTeamParams): Promise<JoinResult>
export async function getTeams(gameId: string): Promise<TeamsResult>
export async function getMyTeam(gameId: string): Promise<TeamResult>

// src/lib/services/auth-service.ts
export async function loginHost(email: string, password: string): Promise<AuthResult>
export async function signupHost(email: string, password: string): Promise<AuthResult>
export async function loginPlayer(email: string, password: string): Promise<AuthResult>
export async function signupPlayer(email: string, password: string, displayName: string): Promise<AuthResult>
export async function loginAnonymous(): Promise<AuthResult>
export async function logout(): Promise<{ error: Error | null }>
export async function getCurrentUser(): Promise<{ user: User | null; session: Session | null }>
```

**Authorization**: Row-Level Security (RLS) policies enforce all access control. Services call Supabase client as authenticated user, RLS policies filter results automatically.

**Error Handling**: Services return `{ data, error }` tuple pattern. UI components handle errors via React state.

**Type Safety**: All service functions use Zod schemas for request/response validation:

```typescript
// src/types/api.types.ts
import { z } from 'zod'

export const CreateGameSchema = z.object({
  name: z.string().min(1),
  venueLocation: z.string().optional(),
  numRounds: z.number().int().positive(),
  questionsPerRound: z.number().int().positive(),
  categories: z.array(z.string()).min(1),
  timeLimitSeconds: z.number().int().positive().optional(),
})

export type CreateGameParams = z.infer<typeof CreateGameSchema>
```

### 3. Service Layer Testing

**Unit Tests** (`tests/unit/services/`):
- Test service functions with mocked Supabase client
- Validate request parameter validation via Zod schemas
- Verify error handling for all failure cases
- Test RLS policy enforcement (expect nulls/errors for unauthorized access)

**Integration Tests** (`tests/e2e/`):
- Playwright tests with real Supabase project
- Multi-client scenarios (host + players + TV in separate browsers)
- Test complete user flows from quickstart.md
- Verify real-time synchronization across clients

**Example Unit Test** (`tests/unit/services/game-service.test.ts`):
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createGame } from '@/lib/services/game-service'
import { supabase } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client')

describe('createGame', () => {
  it('validates required parameters', async () => {
    const result = await createGame({ name: '', numRounds: 0 })
    expect(result.error).toBeTruthy()
    expect(result.error.message).toContain('name')
  })

  it('creates game with valid parameters', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: 'game-123' }, error: null })
    })

    const result = await createGame({
      name: 'Test Game',
      numRounds: 3,
      questionsPerRound: 5,
      categories: ['Sports']
    })

    expect(result.game).toBeTruthy()
    expect(result.error).toBeNull()
  })
})
```

### 4. Extract test scenarios from user stories → `quickstart.md`

**Quickstart Test Scenarios** (mapping to acceptance scenarios 1-20):

1. **Host Setup** - Create game, configure rounds, preview questions
2. **Player Join** - Enter game code, create/join team
3. **Gameplay** - Answer questions, handle team locks, time limits
4. **Real-time Sync** - Verify <300ms propagation across clients
5. **Scoring** - Calculate scores with tie-breaking
6. **Edge Cases** - Disconnections, navigation, early termination

Each scenario maps to Playwright E2E test with multi-client simulation.

### 5. Update CLAUDE.md

Run `.specify/scripts/bash/update-agent-context.sh claude` to generate/update `CLAUDE.md` in repository root with:
- Architecture patterns (answer shuffling seed, question reuse prevention)
- Critical requirements (FR-006, FR-020a, FR-021a, FR-037, FR-043, FR-076, FR-082, FR-089, FR-101, FR-101a)
- Key utilities to implement first (question selection, answer shuffling, scoring)
- Common pitfalls to avoid
- File organization principles
- Testing strategy (TDD with contract tests first)

**Output**:
- `data-model.md` with 11 tables + 2 views + relationships + RLS policies
- `contracts/api-contracts.md` with 25 endpoint specs + Zod schemas
- 25 failing contract test files in `tests/contract/`
- `quickstart.md` with 23-step manual validation guide
- `CLAUDE.md` updated with architecture patterns and critical requirements

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

1. **Load Base Template**: `.specify/templates/tasks-template.md`

2. **Generate Setup Tasks** (T001-T008) - All parallelizable [P]:
   - Initialize Next.js project with TypeScript + App Router
   - Configure Tailwind CSS + shadcn/ui
   - Setup Supabase client (browser + server)
   - Configure ESLint + Prettier + TypeScript strict mode
   - Setup Vitest + React Testing Library
   - Setup Playwright for E2E tests
   - Initialize Supabase project (schema migrations)
   - Generate Supabase TypeScript types

3. **Generate Contract Test Tasks** (T009-T033) - All parallelizable [P]:
   - One task per contract test file (25 files)
   - Each test must fail initially (no implementation)
   - Run: `npm test -- tests/contract/` to verify all fail

4. **Generate Utility Tasks** (T034-T040) - Critical before API implementation:
   - T034: Implement `lib/game/question-selection.ts` (with reuse exclusion)
   - T035: Unit test for question selection
   - T036: Implement `lib/game/answer-shuffling.ts` (seeded random)
   - T037: Unit test for answer shuffling (deterministic verification)
   - T038: Implement `lib/game/scoring.ts` (tie-breaking logic)
   - T039: Unit test for scoring
   - T040: Implement `lib/realtime/channels.ts` (Supabase broadcast setup)

5. **Generate Database Tasks** (T041-T051) - Sequential dependencies:
   - T041: Create migration for `hosts` table
   - T042: Create migration for `games` table with RLS
   - T043: Create migration for `rounds` table
   - T044: Create migration for `game_questions` table
   - T045: Create migration for `teams` table
   - T046: Create migration for `team_members` table
   - T047: Create migration for `answer_submissions` table (unique constraint)
   - T048: Create migration for `question_usage` table (composite index)
   - T049: Create migration for `player_profiles` table
   - T050: Create migration for `leaderboard_cache` table

6. **Generate API Implementation Tasks** (T052-T076) - Make contract tests pass:
   - One task per endpoint to implement business logic
   - Each task references specific contract test to verify
   - Priority order: Host setup → Player join → Gameplay → Scoring
   - Run specific contract test after each: `npm test -- tests/contract/host/test_create_game.ts`

7. **Generate Component Tasks** (T077-T108) - Parallelizable by interface [P]:
   - **Host Components** (T077-T089): Game config form, question preview, control panel
   - **Player Components** (T090-T099): Answer buttons, team selector, countdown timer
   - **TV Components** (T100-T108): Question display, scoreboard, QR code

8. **Generate Integration Test Tasks** (T109-T125) - Based on quickstart scenarios:
   - T109-T112: Host setup flow (4 scenarios)
   - T113-T116: Player join flow (4 scenarios)
   - T117-T120: Gameplay flow (4 scenarios)
   - T121-T123: Real-time sync verification (3 scenarios)
   - T124-T125: Edge cases (2 scenarios)

9. **Generate Validation Tasks** (T126-T130):
   - T126: Run all contract tests (must pass)
   - T127: Run all unit tests (must pass)
   - T128: Run all E2E tests (must pass)
   - T129: Execute complete quickstart.md (23 steps)
   - T130: Performance validation (Lighthouse, FCP/TTI targets)

**Ordering Strategy**:
- **TDD Strict**: Contract tests (T009-T033) before implementations (T052-T076)
- **Critical Path**: Utilities (T034-T040) before API implementation
- **Database First**: Schema (T041-T051) before any data operations
- **Interface Separation**: Host → Player → TV (dependency flow)
- **Parallelization**: Mark [P] for independent files (tests, components, utilities)

**Estimated Output**: 130 numbered, dependency-ordered tasks in tasks.md

**Dependencies**:
- T034-T040 (utilities) must complete before T052-T076 (API implementation)
- T041-T051 (database) must complete before T052-T076 (API implementation)
- T052-T076 (API) must complete before T077-T108 (components)
- T109-T125 (E2E tests) require T077-T108 (components) completion

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md with 130 numbered tasks)
**Phase 4**: Implementation (execute tasks.md following TDD + constitutional principles)
**Phase 5**: Validation (contract tests pass, E2E tests pass, quickstart validation, Lighthouse ≥90)

## Complexity Tracking

*No constitutional violations identified - section left intentionally empty*

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - All technical decisions documented
- [x] Phase 1: Design complete (/plan command) - All artifacts generated
- [x] Phase 2: Task planning complete (/plan command - strategy described above)
- [ ] Phase 3: Tasks generated (/tasks command) - Ready for execution
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - Full alignment with static React + Supabase
- [x] Post-Design Constitution Check: PASS - No deviations introduced
- [x] All NEEDS CLARIFICATION resolved - All technical decisions finalized
- [x] Complexity deviations documented - None (N/A)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*