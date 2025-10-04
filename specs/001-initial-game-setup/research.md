# Technical Research: Multi-User Trivia Party Application

**Date**: 2025-09-30
**Feature**: 001-initial-game-setup
**Status**: Complete

## Overview

This document captures technical research and decisions for implementing the Multi-User Trivia Party Application. All decisions align with the project constitution (static React + Supabase exclusive architecture).

---

## 1. Vite + React Router for Static Site Generation

**Decision**: Use **Vite 7+ with React Router 7** for client-side routing and static builds

**Migration Note**: Originally planned with Next.js App Router, but migrated to Vite on 2025-09-30 for better static site performance and simpler client-side architecture. See `/VITE_MIGRATION.md` for details.

**Rationale**:
- **Perfect for SPAs**: Vite designed specifically for client-side single-page applications
- **Fast Dev Server**: Instant HMR, no compilation delays (unlike Next.js dev server)
- **Simple Routing**: React Router works perfectly for client-side navigation
- **Smaller Bundle**: No Next.js framework overhead (~376KB vs larger Next.js bundles)
- **Better DX**: No fighting against server-side features we don't need
- **Static Export**: Clean `dist/` output, perfect for Cloudflare Pages

**Why Not Next.js**:
- Route groups `(name)` don't work properly with `output: 'export'` mode
- Server Components features not needed for pure client-side app
- Added complexity fighting against framework's server-side defaults
- Slower dev server compared to Vite's instant HMR

**Implementation Notes**:
- Page components organized in `src/pages/` directory structure
- React Router in `src/App.tsx` with `<Routes>` and `<Route>` components
- Environment variables use `VITE_` prefix, accessed via `import.meta.env`
- Build output in `dist/` directory (not `.next/`)

---

## 2. Supabase Realtime: Broadcast Channels vs. Table Subscriptions

**Decision**: Use Supabase Realtime **broadcast channels** (not table subscriptions) for game state synchronization

**Rationale**:
- **Broadcast Performance**: Custom events sent only when needed (host actions), not on every database change
- **Payload Control**: Send exactly what clients need (e.g., "question advanced" with minimal data)
- **Three Channels Per Game**:
  1. `game:{game_id}` - Game state changes (question advances, reveals, pause/resume)
  2. `team:{team_id}:presence` - Team member online/offline status (Presence feature)
  3. `tv:{game_id}` - TV-specific updates (teams_answered_count for "X of Y" display)
- **No Database Overhead**: Table subscriptions would trigger on every `answer_submissions` insert (heavy load)
- **Authorization**: Broadcast channels can use RLS-like access control via channel-level permissions

**Alternatives Considered**:
- **Postgres Realtime (table subscriptions)**: Too heavy, broadcasts every row change including internal updates
- **Polling**: High latency (>1s), server load, doesn't meet 300ms requirement
- **WebSockets (custom)**: Violates constitution (Supabase exclusive), complex to scale

**Implementation Notes**:
```typescript
// Game state channel (host controls)
const gameChannel = supabase.channel(`game:${gameId}`)
  .on('broadcast', { event: 'question_advanced' }, (payload) => {
    // Update UI with new question
  })
  .subscribe()

// Presence channel (team members)
const presenceChannel = supabase.channel(`team:${teamId}:presence`, {
  config: { presence: { key: playerId } }
})

// TV channel (answer counts)
const tvChannel = supabase.channel(`tv:${gameId}`)
  .on('broadcast', { event: 'answer_count_updated' }, (payload) => {
    // Update "X of Y teams answered"
  })
```

**Reconnection Strategy**:
- Exponential backoff: 1s, 2s, 4s, 8s, max 30s
- Auto-subscribe on reconnection (Supabase client handles this)
- FR-101: TV displays reconnect silently (no host notification)
- FR-067: Host disconnection auto-pauses game (detected via presence)

---

## 3. Answer Shuffling with Seeded Randomization

**Decision**: Generate randomization seed on server when creating `game_questions` rows, use seeded shuffle client-side

**Rationale**:
- **Consistency**: All clients (host preview, players, TV) see identical answer order
- **Deterministic**: Given same seed, shuffle produces same output (testable)
- **Server Authority**: Seed generated once in Postgres function during game setup
- **Client Simplicity**: Clients use seed to shuffle locally (no network dependency)

**Implementation**:
```typescript
// Server (Postgres function during game creation)
CREATE FUNCTION create_game_questions(game_id UUID, question_ids UUID[])
RETURNS void AS $$
BEGIN
  INSERT INTO game_questions (game_id, question_id, randomization_seed)
  SELECT game_id, unnest(question_ids), floor(random() * 1000000)::int;
END;
$$ LANGUAGE plpgsql;

// Client (lib/game/answer-shuffling.ts)
export function shuffleAnswers(
  answers: Answer[],
  seed: number
): Answer[] {
  // Fisher-Yates shuffle with seeded PRNG
  const rng = seedrandom(seed.toString())
  const shuffled = [...answers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
```

**Alternatives Considered**:
- **Random shuffle per client**: Inconsistent display (violates FR-037)
- **Store shuffled order in DB**: Denormalization, harder to verify correctness
- **Shuffle once, send order**: Network overhead, doesn't explain preview consistency

**Library**: Use `seedrandom` npm package (MIT license, 4KB gzipped)

---

## 4. Question Reuse Prevention Query Patterns

**Decision**: Use Postgres function with `NOT IN` subquery excluding `question_usage` for host

**Rationale**:
- **Scale**: 61,000+ questions, need efficient exclusion query
- **Index**: Composite index on `(host_id, question_id)` for fast lookups
- **Supplementing**: If selected categories exhausted, expand to all categories (FR-007)
- **Warning**: Count available questions before selection, warn host if insufficient (FR-007a)

**Query Pattern**:
```sql
CREATE OR REPLACE FUNCTION select_questions_for_host(
  p_host_id UUID,
  p_categories TEXT[],
  p_count INT
)
RETURNS TABLE(question_id UUID, category TEXT, question TEXT, a TEXT, b TEXT, c TEXT, d TEXT) AS $$
DECLARE
  available_count INT;
BEGIN
  -- Count available questions in selected categories
  SELECT COUNT(*) INTO available_count
  FROM questions q
  WHERE q.category = ANY(p_categories)
    AND q.id NOT IN (
      SELECT question_id FROM question_usage WHERE host_id = p_host_id
    );

  -- If insufficient, expand to all categories
  IF available_count < p_count THEN
    SELECT COUNT(*) INTO available_count
    FROM questions q
    WHERE q.id NOT IN (
      SELECT question_id FROM question_usage WHERE host_id = p_host_id
    );
  END IF;

  -- Return random selection
  RETURN QUERY
  SELECT q.id, q.category, q.question, q.a, q.b, q.c, q.d
  FROM questions q
  WHERE (q.category = ANY(p_categories) OR available_count < p_count)
    AND q.id NOT IN (
      SELECT question_id FROM question_usage WHERE host_id = p_host_id
    )
  ORDER BY random()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql;
```

**Indexes Required**:
```sql
-- Composite index for fast exclusion lookups
CREATE INDEX idx_question_usage_host_question ON question_usage(host_id, question_id);

-- Existing index on questions (already present)
CREATE INDEX idx_questions_category ON questions(category);
```

**Alternatives Considered**:
- **Application-side filtering**: Fetch all 61k questions, filter in JavaScript (too slow, OOM risk)
- **LEFT JOIN with NULL check**: Slower than NOT IN with proper indexing
- **Materialized view of available questions per host**: Refresh overhead, stale data risk

---

## 5. Row-Level Security for Multi-Tenant Host Isolation

**Decision**: RLS policies on all tables with `host_id` or via `games.host_id` join

**Rationale**:
- **FR-020, FR-023**: Hosts can only access their own games
- **FR-024**: Only game creator can delete
- **Defense in Depth**: Even if client code has bug, database enforces isolation
- **Supabase Best Practice**: RLS is first-class feature, well-tested

**Policy Examples**:
```sql
-- Games table: Host can only see/modify their own games
CREATE POLICY games_host_access ON games
  FOR ALL
  USING (host_id = auth.uid());

-- Teams table: Access via game ownership
CREATE POLICY teams_game_access ON teams
  FOR SELECT
  USING (
    game_id IN (
      SELECT id FROM games WHERE host_id = auth.uid()
    )
  );

-- Players can see teams for games they've joined
CREATE POLICY teams_player_access ON teams
  FOR SELECT
  USING (
    game_id IN (
      SELECT game_id FROM team_members WHERE player_id = auth.uid()
    )
  );

-- TV displays have public read access (no auth required)
CREATE POLICY tv_public_read ON games
  FOR SELECT
  USING (status IN ('active', 'completed'));
```

**Alternatives Considered**:
- **Application-level filtering**: Bug-prone, easy to bypass
- **Separate databases per host**: Expensive, complex migrations
- **Schema-based tenancy**: Overkill for this scale

---

## 6. Anonymous Authentication Session Management

**Decision**: Use Supabase anonymous sign-in with 30-day session duration (FR-021a)

**Rationale**:
- **Built-in Feature**: Supabase Auth supports anonymous users natively
- **Session Persistence**: Stored in browser localStorage, survives page refresh
- **Upgrade Path**: Anonymous users can later create account (link identities)
- **Cleanup**: Supabase handles session expiry automatically

**Implementation**:
```typescript
// Anonymous sign-in
const { data, error } = await supabase.auth.signInAnonymously()

// Configure session duration in Supabase dashboard
// JWT expiry: 30 days (2592000 seconds)
```

**Session Storage**:
- Browser: `localStorage` (persists across tabs/windows)
- Mobile: Native secure storage via `@supabase/auth-helpers`

**Alternatives Considered**:
- **Session-only (no persistence)**: Loses game progress on refresh (bad UX)
- **Custom token system**: Reinventing Supabase Auth (violates constitution)
- **7-day expiry**: Too short per FR-021a clarification

---

## 7. QR Code Generation for Mobile Onboarding

**Decision**: Use `qrcode.react` library for client-side QR generation

**Rationale**:
- **React Component**: Clean API, integrates easily
- **Client-Side**: No server dependency, works with static site
- **Customizable**: Can style with logo, colors
- **Lightweight**: 15KB gzipped

**Implementation**:
```typescript
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG
  value={`https://trivia.example.com/join?code=${gameCode}`}
  size={256}
  level="M"
  includeMargin={true}
/>
```

**Alternatives Considered**:
- **QRCode.js**: Older API, less React-friendly
- **Server-side generation**: Violates static site constraint
- **Google Charts API**: External dependency, privacy concerns

---

## 8. Zustand for Host Control Panel State

**Decision**: Use Zustand for host control panel state (game controls, preview state)

**Rationale**:
- **Lightweight**: 1.3KB gzipped (vs. Redux 12KB)
- **React 18 Compatible**: Works with concurrent features
- **Simple API**: No boilerplate, just `create()` and `useStore()`
- **DevTools**: Browser extension for debugging
- **Constitutional Alignment**: Client-side only, no server state

**Use Cases**:
- Host control panel: current question index, paused state, reveal state
- Question preview: selected categories, preview mode
- Not needed for: Player game state (Supabase Realtime), form state (React Hook Form)

**Implementation**:
```typescript
import { create } from 'zustand'

interface HostControlStore {
  currentQuestionIndex: number
  isPaused: boolean
  isRevealed: boolean
  advanceQuestion: () => void
  pauseGame: () => void
  resumeGame: () => void
  revealAnswer: () => void
}

export const useHostControl = create<HostControlStore>((set) => ({
  currentQuestionIndex: 0,
  isPaused: false,
  isRevealed: false,
  advanceQuestion: () => set((state) => ({
    currentQuestionIndex: state.currentQuestionIndex + 1,
    isRevealed: false
  })),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  revealAnswer: () => set({ isRevealed: true })
}))
```

**Alternatives Considered**:
- **React Context**: More verbose, no DevTools, rerenders entire subtree
- **Redux Toolkit**: Overkill for this use case, larger bundle
- **Jotai**: Atom-based model is less intuitive for control panel state

---

## 9. Recharts for Score Visualization

**Decision**: Use Recharts library for score visualizations (FR-087)

**Rationale**:
- **React-Native**: Built for React, component-based API
- **Responsive**: Adapts to container size (mobile-first)
- **Types**: Full TypeScript support
- **Charts Needed**: Bar chart (scores), line chart (score progression)
- **Tailwind Compatible**: Can style with Tailwind classes

**Implementation**:
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={teamScores}>
    <XAxis dataKey="teamName" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="score" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

**Alternatives Considered**:
- **Chart.js**: Not React-native, uses canvas (harder to style)
- **Victory**: Larger bundle, more complex API
- **D3.js**: Too low-level, steep learning curve

---

## 10. Playwright Multi-Client Testing Strategy

**Decision**: Use Playwright with multiple browser contexts to simulate host + players + TV simultaneously

**Rationale**:
- **Real Browsers**: Tests use actual Chrome/Firefox/Safari (not JSDOM)
- **Multi-Context**: Single test can control 4+ browser tabs independently
- **WebSocket Support**: Tests Supabase Realtime channels
- **Video Recording**: Debugging test failures
- **Parallel Execution**: Tests run concurrently

**Test Pattern**:
```typescript
import { test, expect } from '@playwright/test'

test('host advances question, players see update within 300ms', async ({ browser }) => {
  // Create 3 contexts (host, player1, player2)
  const hostContext = await browser.newContext()
  const player1Context = await browser.newContext()
  const player2Context = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const player1Page = await player1Context.newPage()
  const player2Page = await player2Context.newPage()

  // Setup: Host creates game, players join
  await hostPage.goto('/dashboard')
  await hostPage.click('[data-testid="create-game"]')
  const gameCode = await hostPage.textContent('[data-testid="game-code"]')

  await player1Page.goto(`/join?code=${gameCode}`)
  await player2Page.goto(`/join?code=${gameCode}`)

  // Action: Host advances question
  const advanceTime = Date.now()
  await hostPage.click('[data-testid="advance-question"]')

  // Assert: Players see new question within 300ms
  await Promise.all([
    player1Page.waitForSelector('[data-testid="question-1"]', { timeout: 300 }),
    player2Page.waitForSelector('[data-testid="question-1"]', { timeout: 300 })
  ])

  const syncTime = Date.now() - advanceTime
  expect(syncTime).toBeLessThan(300)
})
```

**Alternatives Considered**:
- **Cypress**: Doesn't support multi-tab testing well
- **Puppeteer**: Lower-level API, less test-focused
- **Selenium**: Slower, flakier, less modern

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| **Framework** | Next.js 14+ App Router | Route groups, static export, layouts |
| **Real-time** | Supabase broadcast channels | Custom events, low overhead, 3 channels per game |
| **Answer Shuffling** | Seeded random (server seed) | Consistency across all clients |
| **Question Selection** | Postgres function + NOT IN | Efficient exclusion with 61k+ questions |
| **Security** | Row-Level Security (RLS) | Multi-tenant isolation, defense in depth |
| **Anonymous Auth** | Supabase anonymous sign-in | Built-in, 30-day sessions, upgrade path |
| **QR Codes** | qrcode.react | Client-side, React component API |
| **State Management** | Zustand | Lightweight (1.3KB), simple API |
| **Charts** | Recharts | React-native, responsive, TypeScript |
| **E2E Testing** | Playwright multi-context | Real browsers, multi-client, WebSocket support |

---

## Constitutional Compliance

✅ **All decisions align with constitution**:
- Static React app (no server runtime)
- Supabase exclusive (no other backend services)
- TypeScript strict mode
- shadcn/ui + Tailwind CSS
- Performance targets met (FCP < 1.5s with lazy loading, code splitting)

---

**Research Complete**: 2025-09-30
**Next Phase**: Phase 1 - Design & Contracts