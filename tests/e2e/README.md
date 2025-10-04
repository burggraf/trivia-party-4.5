# E2E Testing Framework

## Overview

This E2E testing framework enables comprehensive testing of the Trivia Party application with **multi-user, real-time synchronization** validation. Built on Playwright, it supports parallel browser contexts to simulate hosts, players, and TV displays simultaneously.

## Architecture

### Key Components

**Fixtures** (`tests/e2e/fixtures/`):
- `supabase.ts` - Database setup, cleanup, and seeding
- `auth.ts` - Host/player/anonymous authentication helpers
- `multi-client.ts` - Multi-browser context orchestration

**Utilities** (`tests/e2e/utils/`):
- `network-conditions.ts` - Network throttling and offline simulation
- `real-time-sync-validator.ts` - Multi-client sync latency validation
- `race-condition-tester.ts` - Concurrent action testing

## Test Environment Setup

### 1. Prerequisites

```bash
# Install dependencies (already done)
npm install

# Ensure test environment variables are configured
cp .env.test.example .env.test  # If needed
```

### 2. Environment Variables

Edit `.env.test`:
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Test users (pre-seed these in Supabase)
TEST_HOST_EMAIL=e2e-host@triviaparty.test
TEST_HOST_PASSWORD=TestHost123!
TEST_PLAYER_1_EMAIL=e2e-player1@triviaparty.test
TEST_PLAYER_1_PASSWORD=TestPlayer123!
```

### 3. Pre-seed Test Users

Before running tests, create these users in Supabase:
- `e2e-host@triviaparty.test` (host role)
- `e2e-player1@triviaparty.test` (player role)
- `e2e-player2@triviaparty.test` (player role)
- `e2e-player3@triviaparty.test` (player role)

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (visual test runner)
npm run test:e2e:ui

# Run in debug mode (step-through)
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Targeted Testing

```bash
# Run scenario tests only
npm run test:e2e:scenarios

# Run with headed browser (see what's happening)
npm run test:e2e:headed

# Run on desktop Chrome only
npm run test:e2e:chromium

# Run on mobile viewport
npm run test:e2e:mobile
```

### Advanced Options

```bash
# Run specific test file
npx playwright test tests/e2e/scenarios/01-complete-game-flow.spec.ts

# Run tests matching pattern
npx playwright test --grep "real-time"

# Run in parallel with 4 workers
npx playwright test --workers=4

# Generate test code (record actions)
npm run test:e2e:codegen
```

## Writing Tests

### Example: Multi-User Test

```typescript
import { test, expect } from '../fixtures/multi-client'

test('host creates game, players join', async ({ hostClient, playerClients, loginAsHost, loginAsPlayer }) => {
  // Login host
  await loginAsHost(hostClient.page)

  // Create game
  await hostClient.page.getByTestId('create-game-button').click()
  const gameCode = await hostClient.page.getByTestId('game-code').textContent()

  // Login and join as player 1
  await loginAsPlayer(playerClients[0].page)
  await playerClients[0].page.getByTestId('game-code-input').fill(gameCode!)
  await playerClients[0].page.getByTestId('join-button').click()

  // Verify player appears in host's lobby
  await expect(hostClient.page.getByTestId('player-list')).toContainText('Player 1')
})
```

### Example: Real-Time Sync Test

```typescript
import { RealTimeSyncValidator } from '../utils/real-time-sync-validator'

test('host action syncs to players within 300ms', async ({ hostClient, playerClients }) => {
  const syncValidator = new RealTimeSyncValidator(300)

  const result = await syncValidator.validateSync(
    hostClient.page,
    async () => {
      await hostClient.page.getByTestId('next-question-button').click()
    },
    [playerClients[0].page, playerClients[1].page],
    '[data-testid="question-text"]'
  )

  console.log(`Max latency: ${result.maxLatencyMs}ms`)
  expect(result.maxLatencyMs).toBeLessThan(300)
})
```

### Example: Race Condition Test

```typescript
import { RaceConditionTester } from '../utils/race-condition-tester'

test('first team member answer locks team', async ({ playerClients }) => {
  const raceTester = new RaceConditionTester()

  const result = await raceTester.executeRace([
    {
      id: 'player1',
      page: playerClients[0].page,
      action: async () => {
        await playerClients[0].page.getByTestId('answer-0').click()
      }
    },
    {
      id: 'player2',
      page: playerClients[1].page,
      action: async () => {
        await playerClients[1].page.getByTestId('answer-1').click()
      }
    }
  ])

  expect(result.loserIds.length).toBe(1) // One player should fail
})
```

### Example: Network Condition Test

```typescript
import { NetworkConditions } from '../utils/network-conditions'

test('game works on slow 3G', async ({ hostClient, playerClients }) => {
  const hostNetwork = new NetworkConditions(hostClient.page)
  await hostNetwork.initialize()
  await hostNetwork.setPreset('slow-3g')

  // Perform actions with throttled network
  await hostClient.page.getByTestId('start-game-button').click()

  // Cleanup
  await hostNetwork.cleanup()
})
```

## Test Data Management

### Automatic Cleanup

The `supabase` fixture automatically cleans up test data before and after each test:
- Deletes games with 'e2e' or 'test' in `game_name`
- Cascades to teams, submissions, etc.
- Configurable via `TEST_CLEANUP_ENABLED` env var

### Manual Cleanup

```typescript
test('my test', async ({ cleanupDatabase }) => {
  // Test logic...

  // Manual cleanup if needed
  await cleanupDatabase()
})
```

## Configuration

### Playwright Config (`playwright.config.ts`)

- **Timeout**: 60s per test
- **Assertion Timeout**: 10s
- **Workers**: 2 in CI, unlimited locally
- **Retries**: 2 in CI, 0 locally
- **Reporters**: HTML, JSON, JUnit
- **Video**: Retained on failure
- **Screenshot**: Only on failure

### Test Environment (`.env.test`)

- `TEST_BASE_URL` - Application URL
- `TEST_TIMEOUT` - Action timeout
- `TEST_CLEANUP_ENABLED` - Auto cleanup (true/false)
- `TEST_MAX_SYNC_LATENCY_MS` - Max sync latency (300ms)

## Debugging

### Visual Debugging

```bash
# Run in UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Step-through with inspector
npm run test:e2e:debug
```

### Trace Viewer

When a test fails, traces are saved to `test-results/`. View them:

```bash
npx playwright show-trace test-results/.../trace.zip
```

### Common Issues

**Issue: "Timeout waiting for element"**
- Check data-testid attributes exist in UI
- Verify element is visible (not hidden by CSS)
- Increase timeout for slow operations

**Issue: "Test data not cleaning up"**
- Ensure `TEST_CLEANUP_ENABLED=true` in `.env.test`
- Check database permissions (RLS policies)
- Run manual cleanup: `await cleanupDatabase()`

**Issue: "Real-time sync failing"**
- Check Supabase Realtime is enabled
- Verify WebSocket connections in Network tab
- Increase sync latency threshold for slow networks

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          TEST_HOST_EMAIL: ${{ secrets.TEST_HOST_EMAIL }}
          TEST_HOST_PASSWORD: ${{ secrets.TEST_HOST_PASSWORD }}

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

## Next Steps

The foundation is complete! To continue:

1. **Create Page Objects** - `tests/e2e/page-objects/`
2. **Write Scenario Tests** - `tests/e2e/scenarios/`
3. **Add Config Schema** - `tests/e2e/config/test-scenarios.ts`
4. **Implement Config Runner** - `tests/e2e/config-driven-runner.spec.ts`

See the implementation plan in the research documentation for details.

## Resources

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Project Spec](../../specs/001-game-setup-multi/spec.md)
- [Test Tasks](../../specs/001-game-setup-multi/tasks.md)
