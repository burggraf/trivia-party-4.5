# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Multi-User Trivia Party Application** - Real-time trivia game for pub/restaurant venues with three distinct interfaces:

- **Host Interface** (desktop/tablet): Game setup, question preview, flow control, score display
- **Player Interface** (mobile-first): Team join, question answering, real-time feedback
- **TV Display** (large screens): Question display, scoreboard visualization, QR codes

**Development Methodology**: Spec-Driven Development (SDD) using the Specify workflow with slash commands.

**Current Phase**: Specification & Planning Complete → Ready for Implementation

## Technology Stack

- **Framework**: Next.js 14+ with App Router in **static export mode** (`output: 'export'`)
  - **IMPORTANT**: No server-side execution, no Server Components runtime
  - Next.js used as build tooling only - produces pure static HTML/CSS/JS
  - Deployed to Cloudflare Pages as static site
- **Database**: Supabase (PostgreSQL with 61,000+ questions)
- **Real-time**: Supabase Realtime broadcast channels (WebSocket-based)
- **Auth**: Supabase Auth (email/password for hosts, email/password OR anonymous for players)
- **UI**: Tailwind CSS + shadcn/ui components
- **Language**: TypeScript 5+ (strict mode, zero `any` types)
- **Validation**: Zod for runtime schema validation
- **State**: React Context + Zustand for host controls
- **Charts**: Recharts for score visualizations
- **Testing**: Vitest (unit), React Testing Library (component), Playwright (E2E)

**Constitutional Constraints**:

- Static client-side React application only (no Node.js runtime)
- All application logic runs in browser
- Supabase exclusive for all backend operations
- No server-side execution beyond build time

## Specification Workflow Commands

This repository follows Spec-Driven Development. The workflow uses slash commands:

### Active Feature: `001-game-setup-multi`

All specification documents are in `specs/001-game-setup-multi/`:

- `spec.md` - 113 functional requirements, 20 acceptance scenarios
- `plan.md` - Technical decisions, architecture, project structure
- `research.md` - Stack decisions with rationale
- `data-model.md` - 11 database tables + 2 materialized views, RLS policies
- `contracts/api-contracts.md` - 25 REST API endpoints with Zod schemas
- `quickstart.md` - 23-step validation guide for manual testing
- `tasks.md` - 130 numbered, dependency-ordered tasks (T001-T130)

## Architecture Patterns

### Three-Interface Architecture

The application uses Next.js App Router route groups to separate three distinct interfaces. **All routes are static client-side pages** - no Server Components, no server-side rendering:

```typescript
// Route Structure (all client-side React components)
app/
├── (host)/          // Host control interface (client-side only)
│   ├── dashboard/
│   └── games/[gameId]/
│       ├── setup/   // Game configuration & preview
│       ├── control/ // Active game controls
│       └── scores/  // Score display
├── (player)/        // Mobile player interface (client-side only)
│   ├── join/
│   ├── lobby/
│   └── game/[gameId]/
└── (tv)/            // TV display interface (client-side only)
    └── [gameCode]/
        ├── lobby/
        ├── question/
        └── scores/
```

**All pages must use `'use client'` directive** - this is a static site with client-side routing only.

### Key Architectural Decisions

**Answer Randomization Consistency**:

- Randomization seed generated client-side and stored in database when game is created
- All clients (host preview, players, TV displays) use the same seed for identical shuffle order
- Implemented via `lib/game/answer-shuffling.ts` with seeded random function (seedrandom library)
- Deterministic: same seed = same answer order across all devices

**Question Reuse Prevention**:

- `question_usage` table tracks every question used by each host across ALL their games
- Question selection queries exclude all questions in `question_usage` for that host
- Handles 61,000+ question database with efficient composite indexes
- Auto-supplements from all categories when selected categories exhausted

**Answer Submission Race Conditions**:

- First answer from ANY team member locks the team's answer
- Database unique constraint: `(game_question_id, team_id)` prevents duplicates
- API returns 409 Conflict for subsequent submissions with "Your team has already answered"
- Tie-breaking uses `cumulative_answer_time_ms` (sum of all answer times)

**Real-time Synchronization**:

- Three Supabase Realtime broadcast channels per game:
  - `game:{game_id}` - Question advances, reveals, state changes
  - `team:{team_id}:presence` - Team member online/offline status
  - `tv:{game_id}` - TV-specific updates (teams_answered_count)
- No table subscriptions (too heavy), only broadcast events
- Auto-reconnect with exponential backoff for connection drops

**Host Disconnection Handling**:

- Game auto-pauses when host loses connection (FR-067)
- Host reconnection resumes from paused state (FR-068)
- Players see "paused" state, cannot submit answers
- TV displays continue showing current state (no interruption)

**Row-Level Security (RLS)**:

- Hosts can only view/manage their own games
- Players can only view games they've joined via team membership
- TV displays have public read access (no auth required)
- All database operations enforce RLS via Supabase browser client (no server-side code)

### Database Schema Key Points

**Game State Machine**:

```
setup → active → paused ⇄ active → completed
             ↓
         completed (early termination)
```

**Materialized Views**:

- `game_history`: Completed games with full details (refresh on game completion)
- `leaderboard_entries`: Player statistics (refresh hourly via cron or manual API call)

**Critical Indexes** (for performance at scale):

- `idx_question_usage_host_question` on `(host_id, question_id)` - Reuse prevention queries
- `idx_games_game_code` on `game_code` - Fast player join lookups
- `idx_answer_submissions_game_question` on `game_question_id` - Answer retrieval

## Development Workflow

### TDD (Test-Driven Development) - MANDATORY

**Strictly enforced ordering** in tasks.md:

1. **Contract Tests First** (T017-T041): Write tests for all 25 API endpoints

   - Run `npm test -- tests/contract/`
   - **MUST FAIL** before implementation (verify 404/500 errors)

2. **API Implementation** (T048-T070): Implement endpoints to pass tests

   - One endpoint at a time
   - Run specific contract test: `npm test -- tests/contract/host/test_create_game.ts`
   - **MUST PASS** after implementation

3. **Component Development** (T071-T102): Build UI components

4. **Integration Tests** (T103-T125): Playwright E2E tests for user flows
   - Run: `npx playwright test`
   - Tests simulate full quickstart.md scenarios

### Parallel Execution Opportunities

Tasks marked `[P]` can run in parallel (different files, no dependencies):

```bash
# Example: Setup phase (T001-T008)
# Run all 8 tasks concurrently in separate terminals

# Example: Contract tests (T017-T041)
npm test -- tests/contract/ --maxWorkers=25

# Example: E2E tests (T103-T125)
npx playwright test --workers=23
```

### Key Utilities to Implement First

Before API implementation, create these utilities (T042-T047):

```typescript
// lib/game/question-selection.ts
// Selects questions excluding used ones, handles category exhaustion
export function selectQuestions(
	hostId: string,
	categories: string[],
	count: number
): Promise<Question[]>

// lib/game/answer-shuffling.ts
// Deterministic shuffle using stored seed
export function shuffleAnswers(answers: Answer[], seed: number): Answer[]

// lib/game/scoring.ts
// Calculates scores with tie-breaking
export function calculateScores(submissions: Submission[]): TeamScore[]

// lib/realtime/channels.ts
// Creates Supabase Realtime channel subscriptions
export function createGameChannel(gameId: string): RealtimeChannel
```

## Naming Conventions

**Domain Entities vs. Code** (documented in plan.md lines 186-198):

- **Spec/Documentation**: Business-friendly terms

  - "Question Instance" (not "Game Question")
  - "Real-Time" (hyphenated)

- **Database Tables**: `snake_case`

  - `game_questions` (not `question_instances`)
  - Column names: `time_limit_seconds`, `cumulative_answer_time_ms`

- **TypeScript/React**: `camelCase` or `PascalCase`

  - Types: `QuestionInstance`, `TeamScore`
  - Variables: `gameQuestions`, `cumulativeAnswerTime`

- **Supabase Realtime**: One word (per Supabase convention)
  - `Realtime` (not `Real-Time` or `RealTime`)

## Critical Requirements & Edge Cases

### Question Management

- **FR-006**: Question reuse prevention across ALL host's games (not just current game)
- **FR-007**: Auto-supplement from all categories when selected categories exhausted (no warning)
- **FR-009**: Answer shuffle preview must match player view (use stored seed)

### Authentication

- **FR-020a**: Registered players can login from multiple devices with synchronized state
- **FR-021a**: Anonymous sessions remain valid for game duration + reasonable period after

### Gameplay

- **FR-043**: First team member's answer locks the team (race condition handling)
- **FR-050**: Timer expiry auto-advances question (no host intervention)
- **FR-061**: Navigate back preserves previously submitted answers
- **FR-076**: Tie-breaking uses lowest cumulative answer time

### Real-time Sync

- **FR-101a**: TV displays can disconnect/reconnect without interrupting gameplay
- **FR-101b**: TV reconnection auto-resumes showing current state (no host notification)

### Data Privacy

- **FR-089**: Player game history MUST exclude question content (answers not shown)

### Performance Goals

- Real-time sync latency: <300ms
- Question selection query: <100ms
- Mobile First Contentful Paint: <3s on 3G

## Common Pitfalls to Avoid

❌ **Implementing before writing tests** - Contract tests T017-T041 MUST exist and FAIL before T048-T070

❌ **Not verifying test failures** - Run contract tests before implementation to confirm 404/500 errors

❌ **Forgetting RLS policies** - All database queries must use Supabase browser client with proper RLS policies configured in Supabase

❌ **Hardcoding database connection strings** - Use environment variables from `.env.local`

❌ **Including A/B/C/D labels on player answer buttons** - FR-038 specifies text-only (no labels)

❌ **Testing real-time sync with single client** - Must test with multiple browser tabs/devices

❌ **Not handling TV disconnect gracefully** - FR-101a requires silent reconnection (no host notification)

❌ **Reusing questions within host's history** - Must check `question_usage` table, not just current game

❌ **Showing question content in player history** - FR-089 explicitly excludes this

## File Organization Principles

**Keep components focused** - Delegate business logic to utilities in `lib/`:

```typescript
// ❌ Bad: Logic in component
'use client'
export default function GameSetup() {
  const handleCreate = async () => {
    const questions = await supabase.from('questions').select('*').eq(...)
    const shuffled = questions.sort(() => Math.random() - 0.5)
    // ... 50 more lines
  }
}

// ✅ Good: Thin component, logic in lib/
'use client'
export default function GameSetup() {
  const handleCreate = async () => {
    const questions = await selectQuestions(hostId, categories, count)
    // ... business logic delegated to lib/
  }
}
```

**Co-locate types with features**:

```
types/
├── database.types.ts    # Generated from Supabase
├── game.types.ts        # Game domain types
└── api.types.ts         # API request/response types
```

**Component organization by interface**:

```
components/
├── ui/           # shadcn/ui primitives (button, card, etc.)
├── host/         # Host-specific components
├── player/       # Player-specific components
├── tv/           # TV-specific components
└── shared/       # Cross-interface components
```

## Testing Strategy

### Contract Tests (T017-T041)

- Location: `tests/contract/`
- One file per endpoint
- Validates request/response schemas with Zod
- Tests all status codes (200, 201, 400, 403, 404, 409, 500)

### Unit Tests (T047)

- Location: `tests/unit/`
- Focus on pure functions in `lib/`
- Critical: `question-selection.ts`, `answer-shuffling.ts`, `scoring.ts`

### Integration Tests (T103-T125)

- Location: `tests/e2e/`
- Playwright tests covering quickstart.md scenarios
- Multi-client testing (host + 2 players + TV in separate browsers)

### Manual Validation (T130)

- Execute complete quickstart.md (23 steps)
- Verify all acceptance scenarios pass
- Test with production-like data volume

## Implementation Estimate

**Total Tasks**: 130 (T001-T130)

**Estimated Timeline**:

- 1 developer: 4-6 weeks
- Team of 3-4: 2-3 weeks

**Current Progress**: 0/130 tasks complete (ready to start T001)

**Next Step**: Begin Phase 3.1 (Setup tasks T001-T008) - all can run in parallel

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
