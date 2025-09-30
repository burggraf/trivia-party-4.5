# Corrected Implementation Plan

## Architecture Error Corrected

**Issue**: Initial implementation incorrectly created server-side API routes (`app/api/`), violating the client-side-only architecture.

**Resolution**: All API routes deleted. Implementation restarted with correct client-side architecture.

## Correct Implementation Phases

### Phase 1: Foundation (COMPLETED ✅)

- ✅ Database migrations applied (11 tables, 2 views, 5 functions, 21 RLS policies)
- ✅ TypeScript types generated from schema (730 lines)
- ✅ Questions table seeded (61,254 questions across 10 categories)
- ✅ Core utilities implemented:
  - `lib/game/question-selection.ts`
  - `lib/game/answer-shuffling.ts`
  - `lib/game/scoring.ts`
  - `lib/realtime/channels.ts`
  - `lib/utils/game-code.ts`
- ✅ Type definitions in `types/api.types.ts` (request/response schemas)
- ✅ Type definitions in `types/game.types.ts` (domain entities)

### Phase 2: Client-Side Services (IN PROGRESS ⏳)

Create service modules that wrap Supabase browser client calls:

#### 2.1 Authentication Service

```typescript
// lib/services/auth-service.ts
'use client'
export async function signInHost(email: string, password: string)
export async function signUpHost(email: string, password: string, displayName: string)
export async function signInPlayer(email: string, password: string)
export async function signInAnonymous(displayName: string)
export async function signOut()
export async function getCurrentUser()
```

#### 2.2 Game Service

```typescript
// lib/services/game-service.ts
'use client'
export async function createGame(config: CreateGameRequest)
export async function getGame(gameId: string)
export async function updateGame(gameId: string, updates: UpdateGameRequest)
export async function startGame(gameId: string)
export async function pauseGame(gameId: string)
export async function resumeGame(gameId: string)
export async function advanceQuestion(gameId: string)
export async function revealAnswer(gameId: string)
export async function navigateToQuestion(gameId: string, index: number)
export async function endGame(gameId: string)
export async function findGameByCode(gameCode: string)
```

#### 2.3 Team Service

```typescript
// lib/services/team-service.ts
'use client'
export async function createTeam(gameId: string, teamName: string)
export async function joinTeam(teamId: string)
export async function getTeams(gameId: string)
export async function getTeamMembers(teamId: string)
```

#### 2.4 Question Service

```typescript
// lib/services/question-service.ts
'use client'
export async function getCurrentQuestion(gameId: string)
export async function submitAnswer(gameQuestionId: string, answer: SubmitAnswerRequest)
export async function getQuestionResults(gameQuestionId: string)
```

#### 2.5 Leaderboard Service

```typescript
// lib/services/leaderboard-service.ts
'use client'
export async function getVenueLeaderboard(venueId: string)
export async function getPlayerStats(venueId: string, playerId: string)
export async function refreshLeaderboard()
```

### Phase 3: React Hooks (TODO 📋)

Create hooks for state management and real-time subscriptions:

```typescript
// lib/hooks/use-auth.ts
export function useAuth()

// lib/hooks/use-game.ts
export function useGame(gameId: string)

// lib/hooks/use-realtime-game.ts
export function useRealtimeGame(gameId: string)

// lib/hooks/use-team.ts
export function useTeam(teamId: string)

// lib/hooks/use-leaderboard.ts
export function useLeaderboard(venueId: string)
```

### Phase 4: Host Interface Components (TODO 📋)

Client-side pages with `'use client'` directive:

```
app/(host)/
├── page.tsx                    # Host dashboard
├── login/page.tsx              # Host authentication
├── games/
│   ├── create/page.tsx         # Game setup form
│   └── [gameId]/
│       ├── setup/page.tsx      # Preview questions, configure
│       ├── control/page.tsx    # Active game controls
│       └── scores/page.tsx     # Score display
```

### Phase 5: Player Interface Components (TODO 📋)

```
app/(player)/
├── page.tsx                    # Player landing
├── login/page.tsx              # Player auth (email or anonymous)
├── join/page.tsx               # Enter game code
├── lobby/page.tsx              # Team selection/creation
└── game/[gameId]/
    ├── waiting/page.tsx        # Waiting for host to start
    ├── question/page.tsx       # Answer submission
    └── results/page.tsx        # Question results
```

### Phase 6: TV Display Components (TODO 📋)

```
app/(tv)/
└── [gameCode]/
    ├── lobby/page.tsx          # Show QR code, waiting teams
    ├── question/page.tsx       # Display question + answers
    └── scores/page.tsx         # Scoreboard visualization
```

### Phase 7: Testing (TODO 📋)

#### Unit Tests

```
tests/unit/
├── services/                   # Test service functions
│   ├── game-service.test.ts
│   ├── team-service.test.ts
│   └── auth-service.test.ts
└── utils/                      # Test utility functions
    ├── question-selection.test.ts
    ├── answer-shuffling.test.ts
    └── scoring.test.ts
```

#### Component Tests

```
tests/component/
├── host/
│   ├── GameSetupForm.test.tsx
│   └── GameControls.test.tsx
├── player/
│   ├── JoinGameForm.test.tsx
│   └── AnswerButtons.test.tsx
└── tv/
    ├── QuestionDisplay.test.tsx
    └── Scoreboard.test.tsx
```

#### E2E Tests

```
tests/e2e/
├── host-flow.spec.ts           # Host creates and runs game
├── player-flow.spec.ts         # Player joins and answers
├── tv-flow.spec.ts             # TV display sync
└── realtime-sync.spec.ts       # Multi-client synchronization
```

## Files Deleted (Incorrect Implementation)

- ❌ `app/api/host/games/route.ts` - Server-side API route
- ❌ `lib/supabase/server.ts` - Server Supabase client
- ❌ `tests/contract/host/create-game.test.ts` - API endpoint test
- ❌ `test-create-game-api.sh` - API test script

## Key Architectural Principles

1. **All pages use `'use client'` directive** - Every component is a client component
2. **All Supabase calls via browser client** - Use `lib/supabase/client.ts` exclusively
3. **RLS policies handle authorization** - Database enforces access control, not application code
4. **Realtime via WebSocket subscriptions** - Supabase Realtime broadcast channels in browser
5. **State management client-side** - React Context + Zustand for host controls
6. **Static deployment** - Build produces HTML/CSS/JS for Cloudflare Pages

## Testing Strategy

- **Service Tests**: Mock Supabase client, test business logic
- **Component Tests**: React Testing Library with mocked services
- **E2E Tests**: Playwright with real Supabase (local or staging)

## Next Steps

1. ✅ Delete API routes and server code
2. ✅ Update documentation (CLAUDE.md, ARCHITECTURE_CORRECTION.md)
3. ⏳ Implement authentication service (`lib/services/auth-service.ts`)
4. ⏳ Implement game service (`lib/services/game-service.ts`)
5. ⏳ Create React hooks (`lib/hooks/use-auth.ts`, `lib/hooks/use-game.ts`)
6. ⏳ Build host login page (`app/(host)/login/page.tsx`)
7. ⏳ Build game creation page (`app/(host)/games/create/page.tsx`)

## Estimated Timeline

- **Phase 2 (Services)**: 2-3 days
- **Phase 3 (Hooks)**: 1-2 days
- **Phase 4 (Host UI)**: 3-4 days
- **Phase 5 (Player UI)**: 3-4 days
- **Phase 6 (TV UI)**: 2-3 days
- **Phase 7 (Testing)**: 3-4 days

**Total**: 14-20 days for one developer

## References

- See `ARCHITECTURE_CORRECTION.md` for detailed wrong vs. right patterns
- See `CLAUDE.md` for updated common pitfalls
- See `DATABASE_SETUP.md` for local development setup
- See `supabase/SEED_README.md` for question data seeding