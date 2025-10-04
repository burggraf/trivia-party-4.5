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

- **Framework**: **Vite 7+** with **React 19** and **React Router 7**
  - **IMPORTANT**: Pure static site generation - no server-side execution
  - Vite used for fast dev server and optimized production builds
  - Deployed to Cloudflare Pages as static site
- **Routing**: React Router 7 (client-side only, no SSR)
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

The application uses **React Router** for client-side navigation. Three distinct interfaces are organized as separate page components:

```typescript
// Route Structure (defined in src/App.tsx with React Router)
src/
├── pages/
│   ├── HomePage.tsx           // Landing page
│   ├── TestPage.tsx           // Architecture test page
│   ├── host/
│   │   ├── HostLoginPage.tsx
│   │   ├── HostDashboardPage.tsx
│   │   └── games/
│   │       ├── GameSetupPage.tsx
│   │       ├── GameControlPage.tsx
│   │       └── GameScoresPage.tsx
│   ├── player/
│   │   ├── PlayerLoginPage.tsx
│   │   ├── PlayerJoinPage.tsx
│   │   ├── PlayerLobbyPage.tsx
│   │   └── PlayerGamePage.tsx
│   └── tv/
│       ├── TvLobbyPage.tsx
│       ├── TvQuestionPage.tsx
│       └── TvScoresPage.tsx
├── lib/             // Services, hooks, utilities
├── types/           // TypeScript type definitions
└── components/      // Reusable UI components
```

**All pages are standard React components** - no special directives needed. Routing is handled by React Router's `<Routes>` and `<Route>` components in `src/App.tsx`.

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

## UI Design System & Component Standards

### Mandatory Use of shadcn/ui Components

**CRITICAL**: ALL UI components MUST use shadcn/ui primitives. Never create custom buttons, cards, inputs, etc.

**Installing shadcn/ui components**:
```bash
# Install a component (example: button)
npx shadcn@latest add button

# Components are added to src/components/ui/
# Import and use in your pages
```

**Available shadcn/ui components** (install as needed):
- `button` - All buttons (primary, secondary, ghost, outline)
- `card` - Content containers with header/footer
- `input` - Form text inputs
- `label` - Form labels
- `select` - Dropdowns
- `textarea` - Multi-line text inputs
- `checkbox` - Checkbox inputs
- `radio-group` - Radio button groups
- `dialog` - Modal dialogs
- `alert` - Alert messages
- `badge` - Status badges
- `table` - Data tables
- `skeleton` - Loading skeletons
- `toast` - Toast notifications

### Design System Principles

**Color Palette** (muted, minimalistic):
- Background: `bg-background` (light gray/white)
- Cards/surfaces: `bg-card` (slightly elevated)
- Primary actions: `bg-primary` (subtle blue/gray)
- Text: `text-foreground` (dark gray, not pure black)
- Muted text: `text-muted-foreground`
- Borders: `border` (light gray)
- Destructive actions: `bg-destructive` (muted red)

**Typography**:
- Headings: Use semantic HTML (`h1`, `h2`, `h3`) with Tailwind classes
- Body text: `text-sm` or `text-base` with `text-muted-foreground` for secondary text
- Keep it minimal - avoid excessive font sizes or weights

**Spacing & Layout**:
- Use consistent spacing: `space-y-4`, `gap-4`, `p-4`, `p-6`
- Cards should have `rounded-lg border bg-card text-card-foreground shadow-sm`
- Page containers: `max-w-7xl mx-auto p-6`
- Forms: Use `space-y-4` for form fields

**Component Usage Examples**:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ✅ Good: Using shadcn/ui components
export default function GameSetup() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>Configure your trivia game settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameName">Game Name</Label>
            <Input id="gameName" placeholder="Friday Night Trivia" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Create Game</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// ❌ Bad: Creating custom styled elements
export default function GameSetup() {
  return (
    <div>
      <div style={{ border: '1px solid gray', padding: '20px' }}>
        <h1>Create Game</h1>
        <input type="text" />
        <button style={{ background: 'blue', color: 'white' }}>Create</button>
      </div>
    </div>
  )
}
```

**Avoid**:
- ❌ Emojis (unless explicitly requested)
- ❌ Bright, vibrant colors
- ❌ Heavy gradients or shadows
- ❌ Custom styled elements instead of shadcn/ui components
- ❌ Inconsistent spacing or typography
- ❌ Overly complex layouts

**Interface-Specific Considerations**:
- **Host Interface**: Professional, desktop-optimized, data-dense tables and controls
- **Player Interface**: Mobile-first, large touch targets, simple navigation
- **TV Display**: High contrast, large text, minimal UI chrome

## Common Pitfalls to Avoid

❌ **CRITICAL: Not using shadcn/ui components** - ALL buttons, inputs, cards, etc. MUST use shadcn/ui. Never create custom styled elements.

❌ **CRITICAL: Creating server-side code** - This is a pure static site. NO server-side routes, API endpoints, or server-side rendering. All Supabase operations MUST happen client-side using the browser client (`src/lib/supabase/client.ts`)

❌ **CRITICAL: Using Next.js patterns** - We use Vite + React Router, not Next.js. Use React Router's `<Link to="/path">`, `useNavigate()`, and `useParams()` - NOT Next.js equivalents

❌ **Using lib/supabase/server.ts** - This file should NOT be used. Always use `lib/supabase/client.ts` for browser-based operations

❌ **Forgetting RLS policies** - All database queries run as authenticated user via browser client. RLS policies are the ONLY authorization mechanism

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
export default function GameSetup() {
  const handleCreate = async () => {
    const questions = await supabase.from('questions').select('*').eq(...)
    const shuffled = questions.sort(() => Math.random() - 0.5)
    // ... 50 more lines
  }
}

// ✅ Good: Thin component, logic in lib/
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
