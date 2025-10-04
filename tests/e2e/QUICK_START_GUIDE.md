# E2E Testing - Quick Start Guide

## 🚀 Running Your First Test (Step-by-Step)

### Prerequisites Checklist

Before running any tests, complete these steps:

#### 1. Create Test Users in Supabase

Go to your Supabase project → Authentication → Users → Add User

Create these 4 accounts:

```
✓ Host Account
Email: e2e-host@triviaparty.test
Password: TestHost123!
(Manually assign host role if needed)

✓ Player 1 Account
Email: e2e-player1@triviaparty.test
Password: TestPlayer123!

✓ Player 2 Account
Email: e2e-player2@triviaparty.test
Password: TestPlayer123!

✓ Player 3 Account
Email: e2e-player3@triviaparty.test
Password: TestPlayer123!
```

#### 2. Verify Test Environment Variables

Check that `.env.test` exists and has correct values:

```bash
cat .env.test
```

Should show:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
TEST_HOST_EMAIL=e2e-host@triviaparty.test
TEST_HOST_PASSWORD=TestHost123!
# ... etc
```

#### 3. Start Development Server

```bash
npm run dev
```

Wait for output:
```
VITE v7.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

**IMPORTANT:** Keep this terminal window open!

#### 4. Verify UI Has Test IDs

Before running tests, ensure your UI components have `data-testid` attributes.

**Example - Check Host Login Page:**
```bash
# Open browser to http://localhost:5173/host/login
# Right-click email input → Inspect
# Should see: <input data-testid="email-input" ...>
```

**Required Test IDs (partial list):**
- Host: `email-input`, `password-input`, `login-button`, `create-game-button`
- Player: `game-code-input`, `join-game-button`, `question-text`
- See `IMPLEMENTATION_STATUS.md` for complete list

---

## ✅ Run Your First Test

### Option 1: Debug Mode (Recommended for First Run)

**See tests execute step-by-step with Playwright Inspector:**

```bash
npm run test:e2e:debug -- tests/e2e/scenarios/01-complete-game-flow.spec.ts
```

**What happens:**
1. Playwright Inspector window opens
2. Browser window opens (headed mode)
3. Click "Play" button or step through with "Step Over"
4. Watch the test login as host, create game, join players, etc.
5. If test fails, you'll see exactly where and why

**Controls:**
- **Play** (▶️) - Run test
- **Step Over** (⤵) - Execute next action
- **Resume** - Continue after breakpoint
- **Close** - Stop test

### Option 2: Headed Mode (Watch Without Debugging)

**Run test with visible browser:**

```bash
npm run test:e2e:headed -- tests/e2e/scenarios/01-complete-game-flow.spec.ts
```

Test runs automatically, you just watch.

### Option 3: Headless Mode (Fastest)

**Run test in background (no browser UI):**

```bash
npm run test:e2e -- tests/e2e/scenarios/01-complete-game-flow.spec.ts
```

**View results:**
```bash
npm run test:e2e:report
```

Opens HTML report in browser with screenshots/videos of failures.

---

## 📝 Run All Tests

### Run All 10 Scenario Tests

```bash
# All scenarios
npm run test:e2e:scenarios

# Or just:
npm run test:e2e
```

**Expected output:**
```
Running 10 tests using 2 workers

  ✓ [desktop-chromium] › 01-complete-game-flow.spec.ts:XX:XX (45s)
  ✓ [desktop-chromium] › 02-real-time-sync.spec.ts:XX:XX (12s)
  ✓ [desktop-chromium] › 03-race-conditions.spec.ts:XX:XX (8s)
  ...

  10 passed (2m)
```

### Run Specific Test Categories

```bash
# Real-time sync tests only
npm run test:e2e -- tests/e2e/scenarios/02-real-time-sync.spec.ts

# Network resilience tests
npm run test:e2e -- tests/e2e/scenarios/04-network-resilience.spec.ts

# All disconnect/reconnect tests
npm run test:e2e -- tests/e2e/scenarios/0[567]-*.spec.ts
```

---

## 🎯 Common Test Scenarios

### Test 1: Complete Game Flow (Recommended First Test)

**What it tests:**
- Host creates game → Players join → Play 5 questions → View scores
- Real-time sync validation (<300ms)
- Multi-user coordination

**Run:**
```bash
npm run test:e2e:debug -- tests/e2e/scenarios/01-complete-game-flow.spec.ts
```

**Duration:** ~45 seconds
**Coverage:** FR-001 to FR-102 (majority of features)

### Test 2: Real-Time Sync

**What it tests:**
- Question display sync (<300ms)
- Answer submission sync
- Answer reveal sync
- State consistency across clients

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/02-real-time-sync.spec.ts
```

**Duration:** ~12 seconds
**Coverage:** FR-095 to FR-102

### Test 3: Race Conditions

**What it tests:**
- 4 team members submit simultaneously
- First-write-wins validation
- 409 Conflict for losers

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/03-race-conditions.spec.ts
```

**Duration:** ~8 seconds
**Coverage:** FR-043, FR-044, FR-046

### Test 4: Network Resilience

**What it tests:**
- Slow-3G gameplay (2000ms latency)
- 3G sync validation (300ms)
- Mobile FCP <3s on 3G

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/04-network-resilience.spec.ts
```

**Duration:** ~20 seconds
**Coverage:** Performance requirements

### Test 5: Host Disconnect

**What it tests:**
- Game auto-pause on disconnect (FR-067)
- Resume on reconnect (FR-068)
- Players cannot submit while paused

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/05-host-disconnect.spec.ts
```

**Duration:** ~25 seconds
**Coverage:** FR-067, FR-068

### Test 6: Player Reconnect

**What it tests:**
- Session persistence after disconnect
- Previously submitted answers preserved
- Gameplay continues after reconnect

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/06-player-reconnect.spec.ts
```

**Duration:** ~15 seconds
**Coverage:** FR-020a (multi-device)

### Test 7: TV Disconnect

**What it tests:**
- Silent reconnection (FR-101a)
- Auto-resume current state (FR-101b)
- No host notification
- Multiple TVs reconnect independently

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/07-tv-disconnect.spec.ts
```

**Duration:** ~18 seconds
**Coverage:** FR-101a, FR-101b

### Test 8: Concurrent Answers

**What it tests:**
- Team answer locks after first member
- Subsequent submissions blocked
- Selected answer hidden from teammates (FR-044)

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/08-concurrent-answers.spec.ts
```

**Duration:** ~10 seconds
**Coverage:** FR-043, FR-044

### Test 9: Question Navigation

**What it tests:**
- Navigate backward preserves answers (FR-061)
- Navigate forward preserves lock
- Individual answer states preserved

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/09-question-navigation.spec.ts
```

**Duration:** ~14 seconds
**Coverage:** FR-061

### Test 10: Scoring Tie-Break

**What it tests:**
- Tie-breaking uses cumulative time (FR-076)
- Cumulative time calculation
- Three-way tie resolution

**Run:**
```bash
npm run test:e2e -- tests/e2e/scenarios/10-scoring-tiebreak.spec.ts
```

**Duration:** ~16 seconds
**Coverage:** FR-076

---

## 🔍 Viewing Test Results

### HTML Report (After Test Run)

```bash
npm run test:e2e:report
```

Opens interactive HTML report showing:
- ✓ Passed tests (green)
- ✗ Failed tests (red)
- Screenshots of failures
- Videos of failed tests
- Trace files (timeline of actions)

### Trace Viewer (Deep Dive)

If a test fails, view detailed trace:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

Shows:
- Every action taken
- Network requests
- Console logs
- Screenshots at each step
- Timing information

---

## 🐛 Troubleshooting

### Test Fails: "Timeout waiting for element"

**Cause:** UI element missing `data-testid` attribute

**Fix:**
1. Check which element failed (error message shows test ID)
2. Add `data-testid="xxx"` to that element in your React component
3. Re-run test

**Example:**
```tsx
// Before
<input type="email" />

// After
<input type="email" data-testid="email-input" />
```

### Test Fails: "Authentication failed"

**Cause:** Test users don't exist in Supabase

**Fix:**
1. Go to Supabase → Authentication → Users
2. Create test users (see Prerequisites above)
3. Re-run test

### Test Fails: "Connection refused"

**Cause:** Dev server not running

**Fix:**
```bash
# In separate terminal:
npm run dev
```

### Test Hangs: "Waiting for http://localhost:5173"

**Cause:** Dev server not started or wrong port

**Fix:**
1. Check dev server is running on port 5173
2. Check `TEST_BASE_URL` in `.env.test`
3. Restart dev server

### Multiple Tests Fail: "Database cleanup error"

**Cause:** `TEST_CLEANUP_ENABLED=false` or RLS policies blocking cleanup

**Fix:**
```bash
# Edit .env.test
TEST_CLEANUP_ENABLED=true
```

### Race Condition Test Fails: "Expected 3 conflicts, got X"

**Cause:** Timing issue - submissions not truly simultaneous

**This is expected** - race conditions are probabilistic. Run test 2-3 times.

---

## 🎨 Visual Test Runner (UI Mode)

**Best for exploring and debugging tests:**

```bash
npm run test:e2e:ui
```

**Features:**
- See all tests in sidebar
- Click to run individual tests
- Watch tests execute in embedded browser
- Time-travel debugging (step backward!)
- Filter by passing/failing
- Re-run failed tests only

**Perfect for:**
- Exploring test suite
- Debugging flaky tests
- Developing new tests

---

## ⚙️ Advanced Usage

### Run Specific Test by Name

```bash
npm run test:e2e -- -g "tie-breaking"
```

Runs only tests with "tie-breaking" in the name.

### Run with Different Browser

```bash
# Desktop Chromium (default)
npm run test:e2e:chromium

# Mobile viewport
npm run test:e2e:mobile
```

### Parallel Execution

```bash
# Run with 4 workers (4 tests in parallel)
npm run test:e2e -- --workers=4

# Run with 1 worker (sequential - useful for debugging)
npm run test:e2e -- --workers=1
```

### Generate Test Code

**Record actions and generate test code:**

```bash
npm run test:e2e:codegen
```

1. Browser opens at http://localhost:5173
2. Perform actions (click, type, navigate)
3. Playwright generates test code
4. Copy code to create new tests

---

## 📊 Performance Benchmarks

**Expected test durations on modern dev machine:**

| Test | Duration | Notes |
|------|----------|-------|
| 01-complete-game-flow | ~45s | Full E2E, 5 questions |
| 02-real-time-sync | ~12s | Multiple sync validations |
| 03-race-conditions | ~8s | Concurrent submissions |
| 04-network-resilience | ~20s | Includes 3G throttling |
| 05-host-disconnect | ~25s | Multiple disconnect cycles |
| 06-player-reconnect | ~15s | Disconnect/reconnect scenarios |
| 07-tv-disconnect | ~18s | Multiple TV scenarios |
| 08-concurrent-answers | ~10s | Team locking tests |
| 09-question-navigation | ~14s | Navigation scenarios |
| 10-scoring-tiebreak | ~16s | Tie-break calculations |
| **Total** | **~3 minutes** | All 10 scenarios |

---

## 🎓 Next Steps

### 1. Run Complete Test Suite

```bash
npm run test:e2e
```

### 2. View Report

```bash
npm run test:e2e:report
```

### 3. Add Missing Test IDs

If tests fail due to missing test IDs, add them to your UI components.

### 4. Create Custom Tests

Use test scenarios as templates to create your own tests.

### 5. Integrate with CI/CD

See `README.md` for GitHub Actions integration example.

---

## 📚 Additional Resources

- **Detailed Documentation:** `tests/e2e/README.md`
- **Implementation Status:** `tests/e2e/IMPLEMENTATION_STATUS.md`
- **Playwright Docs:** https://playwright.dev/docs/intro
- **Project Spec:** `specs/001-game-setup-multi/spec.md`

---

## ✅ Checklist: Ready to Test?

- [ ] Test users created in Supabase
- [ ] `.env.test` configured with correct credentials
- [ ] Dev server running on http://localhost:5173
- [ ] UI components have `data-testid` attributes
- [ ] Questions seeded in database (61k+ questions)

**If all checked:** You're ready to run tests! 🚀

**First command:**
```bash
npm run test:e2e:debug -- tests/e2e/scenarios/01-complete-game-flow.spec.ts
```

Good luck! 🎯
