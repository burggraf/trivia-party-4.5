# Architecture Correction

## Critical Error: API Routes Were Implemented

During initial implementation, server-side API routes were incorrectly created in `app/api/`. This violates the fundamental architecture of this project.

## Correct Architecture

This is a **client-side-only static React application**:

- ✅ **Static Export Mode**: `output: 'export'` in next.config.ts
- ✅ **No Server Runtime**: Zero Node.js server-side execution
- ✅ **Browser-Only Logic**: All application logic runs in the browser
- ✅ **Direct Supabase Calls**: All database operations via Supabase browser client
- ✅ **Static Deployment**: Deployed to Cloudflare Pages as pure HTML/CSS/JS

## What This Means

### ❌ NEVER Use

- **API Routes** (`app/api/*`) - These require Node.js runtime
- **Server Components** with data fetching - Only client components
- **Server Actions** - Not supported in static export
- **`cookies()` or `headers()` from next/server** - Server-only APIs
- **Middleware** - Requires server runtime
- **ISR or SSR** - Static generation only

### ✅ ALWAYS Use

- **Client Components** (`'use client'` directive on all pages)
- **Supabase Browser Client** (`lib/supabase/client.ts`)
- **Client-Side State Management** (React Context, Zustand)
- **Supabase Realtime** (WebSocket subscriptions in browser)
- **Supabase Auth** (client-side authentication)
- **Client-Side Routing** (Next.js App Router client navigation)

## Corrected Implementation Pattern

### ❌ WRONG (What Was Implemented)

```typescript
// app/api/host/games/route.ts - DELETE THIS
export async function POST(request: NextRequest) {
  const supabase = await createClient() // Server client
  // ... server-side logic
}
```

### ✅ CORRECT (Client-Side Service)

```typescript
// lib/services/game-service.ts
'use client'
import { createClient } from '@/lib/supabase/client'

export async function createGame(config: CreateGameRequest) {
  const supabase = createClient() // Browser client

  // Get current user (client-side auth)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // All database operations via browser client
  const { data: game, error } = await supabase
    .from('games')
    .insert({...config, host_id: user.id})
    .select()
    .single()

  return { game, error }
}
```

### ✅ CORRECT (React Component Usage)

```typescript
// app/(host)/games/create/page.tsx
'use client'
import { createGame } from '@/lib/services/game-service'

export default function CreateGamePage() {
  const handleSubmit = async (config: CreateGameRequest) => {
    const { game, error } = await createGame(config)
    if (error) {
      // Handle error
    } else {
      // Navigate to game setup
    }
  }

  return <GameSetupForm onSubmit={handleSubmit} />
}
```

## Files Removed

- ❌ `app/api/host/games/route.ts` - Server-side API route
- ❌ `tests/contract/host/create-game.test.ts` - API contract tests
- ❌ `test-create-game-api.sh` - API endpoint test script

## Files to Create

- ✅ `lib/services/game-service.ts` - Client-side game operations
- ✅ `lib/services/team-service.ts` - Client-side team operations
- ✅ `lib/services/player-service.ts` - Client-side player operations
- ✅ `lib/services/question-service.ts` - Client-side question operations
- ✅ `lib/hooks/use-game.ts` - React hooks for game state
- ✅ `lib/hooks/use-auth.ts` - React hooks for authentication

## Testing Strategy Correction

### ❌ WRONG: API Contract Tests

```typescript
// Testing HTTP endpoints - NOT APPLICABLE
describe('POST /api/host/games', () => {
  it('should return 201', async () => {
    const response = await fetch('/api/host/games', {...})
    expect(response.status).toBe(201)
  })
})
```

### ✅ CORRECT: Service Function Tests

```typescript
// Testing client-side service functions
describe('createGame', () => {
  it('should create game in database', async () => {
    const mockSupabase = createMockSupabaseClient()
    const result = await createGame(validConfig)
    expect(result.game).toBeDefined()
  })
})
```

### ✅ CORRECT: Component Integration Tests

```typescript
// Testing React components with Supabase
describe('CreateGamePage', () => {
  it('should create game on form submit', async () => {
    render(<CreateGamePage />)
    // Fill form, submit, verify Supabase calls
  })
})
```

## Documentation Updates Needed

1. **tasks.md**: Remove all "API endpoint" tasks (T048-T070)
2. **tasks.md**: Replace with "Service module" tasks
3. **contracts/api-contracts.md**: Mark as reference for data shapes only, not HTTP endpoints
4. **types/api.types.ts**: Rename to `types/service.types.ts` or keep for data validation only
5. **CLAUDE.md**: Add explicit warning about API routes in "Common Pitfalls"

## Key Principle

**Every database operation happens in the browser using `lib/supabase/client.ts`**

The "API contracts" defined in the spec are really **client-side service contracts** - they define the data shapes and operations, but NOT HTTP endpoints.

## Supabase Row-Level Security (RLS)

This architecture relies heavily on RLS policies:

- **Authentication**: Supabase Auth in browser, JWT sent with every request
- **Authorization**: RLS policies enforce access control at database level
- **Security**: No server-side code to bypass RLS, all queries run as authenticated user

This is actually **more secure** than server-side API routes because:
1. Cannot bypass RLS policies
2. Cannot leak credentials in server code
3. Direct database connection secured by Supabase

## Next Steps

1. ✅ Delete all API routes
2. ✅ Update documentation to prevent recurrence
3. ⏳ Create client-side service modules in `lib/services/`
4. ⏳ Create React hooks in `lib/hooks/`
5. ⏳ Create page components in `app/(host)/`, `app/(player)/`, `app/(tv)/`
6. ⏳ Update tasks.md to reflect client-side architecture