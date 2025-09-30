# Validation Checklist - Multi-User Trivia Party Application

**Date**: 2025-09-30
**Feature**: 001-initial-game-setup
**Progress**: Phase 3.7 - Validation & Polish

## T069: Quickstart.md Validation

This checklist tracks completion of all 23 steps from `specs/001-initial-game-setup/quickstart.md`.

### Scenario 1-4: Host Setup Flow

- [ ] **Step 1**: Host Authentication
  - Navigate to host login page
  - Sign in with test credentials
  - Verify redirect to dashboard

- [ ] **Step 2**: Create Game
  - Click "Create New Game"
  - Fill form with test data
  - Verify game created successfully
  - Check question selection message

- [ ] **Step 3**: Preview Questions
  - Navigate through 15 questions
  - Verify question text and 4 answers displayed
  - Verify answer shuffling (seeded randomization)
  - Verify same shuffle persists on refresh

- [ ] **Step 4**: Modify Question Selection
  - Remove question #3
  - Select replacement question
  - Verify question count remains 15
  - Verify new randomization seed

- [ ] **Step 5**: Start Game
  - Click "Start Game"
  - Verify 6-character game code generated
  - Verify QR code displayed
  - Verify redirect to control panel

### Scenario 5-8: Player Join Flow

- [ ] **Step 6**: Player Entry (Device 1)
  - Navigate to join page
  - Enter game code
  - Verify redirect to team selection

- [ ] **Step 7**: Create Team (Player 1)
  - Click "Create New Team"
  - Enter team name "Quiz Wizards"
  - Verify redirect to lobby
  - Verify player count shows "1/6 players"

- [ ] **Step 8**: Join Team (Player 2)
  - Join game on second device
  - See "Quiz Wizards" in team list
  - Join existing team
  - Verify both devices show "2/6 players"
  - Verify real-time sync <300ms

- [ ] **Step 9**: Host Advances to First Question
  - Host clicks "Start Round 1"
  - Host clicks "Display Question 1"
  - Verify all devices display question simultaneously
  - Verify countdown timer starts
  - Verify sync <300ms

### Scenario 9-14: Gameplay Flow

- [ ] **Step 10**: Submit Answer (Player 1)
  - Player 1 clicks answer option
  - Confirms submission
  - Verify answer locked
  - Verify Player 2 sees team answered

- [ ] **Step 11**: Duplicate Submission Attempt (Player 2)
  - Player 2 tries to submit different answer
  - Verify error: "Your team has already answered"
  - Verify 409 Conflict response
  - Verify Player 1's answer unchanged

- [ ] **Step 12**: Timer Expiry
  - Wait for countdown to reach 00:00
  - Verify auto-reveal of correct answer
  - Verify "Time's up!" message
  - Verify teams without answer receive 0 points

- [ ] **Step 13**: Reveal and Advance
  - Host clicks "Reveal Answer"
  - Verify correct answer highlighted on all devices
  - Verify players see correct/incorrect indicator
  - Host clicks "Next Question"
  - Verify all devices sync to Question 2

- [ ] **Step 14**: Complete Round and Display Scores
  - Complete all 5 questions in Round 1
  - Host clicks "Show Scores"
  - Verify scoreboard displayed
  - Verify team scores and rankings shown

- [ ] **Step 15**: Complete Game
  - Complete Rounds 2-3 (5 questions each)
  - Host clicks "End Game"
  - Verify final scores displayed
  - Verify winning team highlighted
  - Verify game status = "completed"

### Scenario 15-18: Real-Time Synchronization

- [ ] **Step 16**: Measure Sync Latency (Host Advance)
  - Open DevTools Network tab on player device
  - Host clicks "Next Question"
  - Measure time until player device updates
  - Verify latency <300ms

- [ ] **Step 17**: Answer Count Updates
  - TV display shows "0 of X teams have answered"
  - Player 1 submits answer
  - Verify TV updates to "1 of X teams"
  - Player 2 (different team) submits
  - Verify TV updates to "2 of X teams"
  - Verify <300ms latency

- [ ] **Step 18**: Pause Game
  - Host clicks "Pause Game" during active question
  - Verify all players see "Game Paused" overlay
  - Verify answer buttons disabled
  - Verify timer stopped

- [ ] **Step 19**: Host Disconnection
  - Close host browser tab
  - Verify game auto-pauses after ~5 seconds
  - Verify players see "Waiting for host..."
  - Reconnect host
  - Verify game resumes from paused state

### Scenario 19-20: Scoring and Tie-Breaking

- [ ] **Step 20**: Tied Scores with Time-Based Tie-Breaking
  - Create scenario with tied scores (both 10/15)
  - Host clicks "Show Final Scores"
  - Verify team with lower cumulative time ranked higher
  - Verify scoreboard shows avg time per team

- [ ] **Step 21**: Verify Tie-Breaking Calculation
  - Query `teams` table for tied teams
  - Compare `cumulative_answer_time_ms` values
  - Verify winning team has lower cumulative time
  - Verify scoreboard matches database

### Edge Cases

- [ ] **Step 22**: Question Reuse Prevention
  - Create second game with same host
  - Use same categories (Sports + History)
  - Preview questions
  - Verify no questions match first game
  - Check `question_usage` table

- [ ] **Step 23**: Anonymous Player Session
  - New player navigates to /join (not logged in)
  - Clicks "Continue as Guest"
  - Enters display name
  - Joins team and plays
  - Verify anonymous session created
  - Verify session persists (localStorage)
  - Verify 30-day expiry configured

---

## T070: Performance Optimization

### Lighthouse Audit Results

**Target Scores**:
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥80

**Host Interface** (`/host/dashboard`):
- [ ] Run Lighthouse audit
- [ ] Performance score: ___
- [ ] FCP (First Contentful Paint): ___ (target: <1.5s)
- [ ] TTI (Time to Interactive): ___ (target: <3.5s)
- [ ] Total Blocking Time: ___ (target: <300ms)

**Player Interface** (`/player/game/:gameId`):
- [ ] Run Lighthouse audit (mobile simulation)
- [ ] Performance score: ___
- [ ] FCP: ___ (target: <1.5s on 3G)
- [ ] TTI: ___ (target: <3.5s)
- [ ] Bundle size: ___ (target: <250KB gzipped)

**TV Display** (`/tv/:gameCode/question`):
- [ ] Run Lighthouse audit
- [ ] Performance score: ___
- [ ] FCP: ___
- [ ] Smooth animations (60fps)

### Optimizations Applied

- [ ] Code splitting implemented
  - [ ] Route-based splitting for each interface
  - [ ] Dynamic imports for heavy components

- [ ] Bundle size optimization
  - [ ] Run `npm run build` and check output
  - [ ] Verify total bundle <500KB gzipped
  - [ ] Lazy load QRCode, Recharts, heavy libraries

- [ ] Image optimization
  - [ ] Use WebP format where supported
  - [ ] Implement lazy loading

- [ ] Caching strategy
  - [ ] Service worker for static assets
  - [ ] Cache-first for immutable resources

---

## T071: Accessibility Audit

### Keyboard Navigation

- [ ] Host Dashboard
  - [ ] Tab through all interactive elements
  - [ ] Enter/Space activates buttons
  - [ ] Escape closes modals

- [ ] Player Game Page
  - [ ] Answer buttons accessible via keyboard
  - [ ] Focus visible on all elements
  - [ ] Tab order logical

- [ ] TV Display
  - [ ] No keyboard interaction required (display-only)

### ARIA Labels

- [ ] All buttons have aria-label or visible text
- [ ] Form inputs have associated labels
- [ ] Icon-only buttons have aria-label
- [ ] Loading states announced (aria-live)
- [ ] Error messages associated with inputs

### Screen Reader Compatibility

- [ ] Test with VoiceOver (macOS/iOS)
  - [ ] All content readable
  - [ ] Button purposes clear
  - [ ] Form validation errors announced

- [ ] Test with NVDA (Windows)
  - [ ] Navigation works correctly
  - [ ] All interactive elements identified

### Color Contrast

- [ ] All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] Error states distinguishable without color alone
- [ ] Focus indicators visible

### Semantic HTML

- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Button vs link usage correct
- [ ] Form elements properly structured

---

## T072: Cross-Browser Testing

### Desktop Browsers

**Chrome** (latest):
- [ ] Host interface functional
- [ ] Player interface functional
- [ ] TV display functional
- [ ] Real-time sync working
- [ ] No console errors

**Firefox** (latest):
- [ ] Host interface functional
- [ ] Player interface functional
- [ ] TV display functional
- [ ] Real-time sync working
- [ ] No console errors

**Safari** (latest):
- [ ] Host interface functional
- [ ] Player interface functional
- [ ] TV display functional
- [ ] Real-time sync working
- [ ] No console errors
- [ ] WebSocket compatibility verified

### Mobile Browsers

**iOS Safari** (iPhone):
- [ ] Player interface responsive
- [ ] Touch targets ≥44x44px
- [ ] Landscape mode works
- [ ] No layout issues

**Android Chrome** (Android):
- [ ] Player interface responsive
- [ ] Touch targets adequate
- [ ] Landscape mode works
- [ ] No layout issues

### WebSocket Support

- [ ] Supabase Realtime works in all browsers
- [ ] Reconnection logic tested
- [ ] No dropped messages

---

## T073: Documentation Updates

### README.md

- [ ] Project overview added
- [ ] Tech stack documented
- [ ] Prerequisites listed
- [ ] Setup instructions complete
- [ ] Development workflow explained
- [ ] Deployment guide included

### Environment Variables

- [ ] `.env.example` created with all required vars
- [ ] Variable descriptions documented
- [ ] Supabase credentials instructions
- [ ] Local vs production config explained

### Deployment Guide

- [ ] Cloudflare Pages deployment steps
- [ ] Environment variable setup
- [ ] Database migration instructions
- [ ] Supabase project linking
- [ ] Custom domain configuration (if applicable)

### Code Documentation

- [ ] Key files have inline comments
- [ ] Complex algorithms explained
- [ ] API service functions documented
- [ ] Type definitions complete

---

## Final Validation

- [ ] All 23 quickstart steps pass
- [ ] All acceptance scenarios validated
- [ ] Performance targets met
- [ ] Accessibility standards met
- [ ] Cross-browser compatibility confirmed
- [ ] Documentation complete

**Sign-off Date**: _______________
**Validated By**: _______________
