# Quickstart Guide: Multi-User Trivia Party Application

**Date**: 2025-09-30
**Feature**: 001-initial-game-setup
**Purpose**: Manual validation guide for acceptance scenarios

## Overview

This document provides step-by-step instructions for manually validating all acceptance scenarios from [spec.md](./spec.md). Execute these steps to verify the application meets all functional requirements.

**Prerequisites**:
- Application deployed and accessible
- Test host account created
- 2+ mobile devices or browser tabs for player testing
- Large screen or browser window for TV display testing

---

## Scenario 1-4: Host Setup Flow

### Step 1: Host Authentication
**Action**: Navigate to host login page
1. Open https://[app-url]/dashboard
2. Sign in with test host credentials (email/password)
**Expected**: Redirected to host dashboard

### Step 2: Create Game
**Action**: Create new game with configuration
1. Click "Create New Game" button
2. Fill form:
   - Name: "Monday Night Trivia"
   - Venue: "The Local Pub"
   - Rounds: 3
   - Questions per round: 5
   - Categories for Round 1: Select "Sports" and "History"
   - Time limit: 60 seconds per question
   - Team size: Min 1, Max 6
   - Sound effects: Enabled
3. Click "Create Game"

**Expected** (Scenario 1):
- Game created successfully
- System displays: "Selecting 15 questions from Sports and History..."
- If host has used questions before: See warning if <15 available (FR-007a)
- Questions displayed in preview mode

### Step 3: Preview Questions
**Action**: Review selected questions
1. Navigate through question list (15 questions total)
2. For each question, verify:
   - Question text displayed
   - 4 answer options displayed (randomized order)
   - Category badge shown

**Expected** (Scenario 2):
- All 15 questions visible
- Answer order is shuffled (not always A, B, C, D)
- Same shuffle order persists on page refresh (seeded randomization)

### Step 4: Modify Question Selection
**Action**: Remove and replace questions
1. Click "Remove" on question #3
2. System displays: "Select replacement question from History"
3. Choose replacement question from list
4. Click "Save Changes"

**Expected** (Scenario 3):
- Question #3 replaced with new question
- Question count remains 15
- New question has different randomization seed (different answer order)

### Step 5: Start Game
**Action**: Finalize setup and start game
1. Click "Start Game" button
2. System generates game code and QR code

**Expected** (Scenario 4):
- 6-character game code displayed (e.g., "ABC123")
- QR code displayed prominently
- Game status changes to "active"
- Host redirected to game control panel
- URL: `/games/[gameId]/control`

---

## Scenario 5-8: Player Join Flow

### Step 6: Player Entry (Device 1)
**Action**: Join game as Player 1
1. On mobile device or new browser tab, navigate to https://[app-url]/join
2. Enter game code "ABC123" (from Step 5)
3. Click "Join Game"

**Expected** (Scenario 5):
- Redirected to team selection screen
- Two options displayed:
  - "Create New Team"
  - "Join Existing Team" (empty list initially)

### Step 7: Create Team (Player 1)
**Action**: Player 1 creates team
1. Click "Create New Team"
2. Enter team name: "Quiz Wizards"
3. Click "Create Team"

**Expected** (Scenario 6):
- Team created successfully
- Player 1 redirected to lobby
- Lobby shows: "Quiz Wizards (1/6 players)"
- Status: "Waiting for other players..."

### Step 8: Join Team (Player 2)
**Action**: Join existing team as Player 2
1. On second device, navigate to https://[app-url]/join
2. Enter game code "ABC123"
3. Click "Join Game"
4. See "Quiz Wizards" in team list
5. Click "Join Quiz Wizards"

**Expected** (Scenario 7):
- Player 2 added to team
- Lobby updates: "Quiz Wizards (2/6 players)"
- Both Player 1 and Player 2 see updated count
- Real-time sync: <300ms delay

### Step 9: Host Advances to First Question
**Action**: Host starts first question
1. On host control panel, click "Start Round 1"
2. Click "Display Question 1"

**Expected** (Scenario 8):
- Host sees question preview with "Advance" button
- All player devices display Question 1 simultaneously
- TV display (if connected) shows Question 1
- Countdown timer starts (60 seconds)
- Real-time sync: <300ms across all devices

---

## Scenario 9-14: Gameplay Flow

### Step 10: Submit Answer (Player 1)
**Action**: Player 1 submits answer
1. Player 1 reads question on their device
2. Clicks answer option (e.g., "Paris")
3. Confirms submission

**Expected** (Scenario 9):
- Answer locked for Player 1
- Player 1 UI changes to "Your team has answered"
- Player 1 cannot change answer (buttons disabled)
- Player 2 sees "Your team has answered" (FR-044)
- Player 2 cannot submit answer (team lock enforced)

### Step 11: Duplicate Submission Attempt (Player 2)
**Action**: Player 2 tries to submit different answer
1. Player 2 clicks different answer option
2. Attempts to submit

**Expected** (Scenario 10):
- Error message displayed: "Your team has already answered"
- Submission rejected (409 Conflict)
- Player 1's answer remains locked
- Database unique constraint prevents duplicate

### Step 12: Timer Expiry
**Action**: Wait for countdown timer to reach zero
1. Do not advance question manually
2. Let timer expire (60 seconds)

**Expected** (Scenario 11):
- At 00:00, host view automatically reveals correct answer
- Host sees "Time's up!" message
- Teams that didn't answer receive 0 points
- Host can advance to next question

### Step 13: Reveal and Advance
**Action**: Host reveals answer and advances
1. Host clicks "Reveal Answer" (if not auto-revealed)
2. All devices show correct answer highlighted
3. Host clicks "Next Question"

**Expected** (Scenario 12):
- Correct answer displayed to all players
- Players see if their answer was correct (green/red indicator)
- Host advances to Question 2
- All devices sync to new question within 300ms
- Answer buttons re-enabled for new question

### Step 14: Complete Round and Display Scores
**Action**: Complete all 5 questions in Round 1
1. Repeat Steps 10-13 for questions 2-5
2. After question 5, host clicks "Show Scores"

**Expected** (Scenario 13):
- Scoreboard displayed on all devices and TV
- Shows: Team names, scores, rankings
- Quiz Wizards: X/5 correct answers

### Step 15: Complete Game
**Action**: Complete rounds 2-3 and finish game
1. Host clicks "Start Round 2"
2. Repeat gameplay for 5 more questions
3. Host clicks "Start Round 3"
4. Repeat gameplay for final 5 questions
5. Host clicks "End Game"

**Expected** (Scenario 14):
- Final scores calculated
- Winning team identified and highlighted
- All teams ranked by score
- Tie-breaking applied if needed (cumulative answer time)
- Game status changes to "completed"

---

## Scenario 15-18: Real-Time Synchronization

### Step 16: Measure Sync Latency (Host Advance)
**Action**: Test real-time sync speed
1. Open browser DevTools Network tab on player device
2. Host clicks "Next Question"
3. Measure time until player device updates

**Expected** (Scenario 15):
- Player device receives broadcast event
- UI updates within 300ms
- All players sync simultaneously
- TV display syncs within same window

### Step 17: Answer Count Updates
**Action**: Submit answers and verify TV display
1. TV display shows "0 of 2 teams have answered"
2. Player 1 (Quiz Wizards) submits answer
3. TV display updates to "1 of 2 teams have answered"
4. Player from second team submits answer
5. TV display updates to "2 of 2 teams have answered"

**Expected** (Scenario 16):
- TV display counter updates in real-time
- Broadcast on `tv:{game_id}` channel
- <300ms latency for each update

### Step 18: Pause Game
**Action**: Host pauses game mid-question
1. During active question, host clicks "Pause Game"
2. Observe all player devices

**Expected** (Scenario 17):
- All players see "Game Paused" overlay
- Answer buttons disabled
- Countdown timer stops
- Real-time sync: <300ms

### Step 19: Host Disconnection
**Action**: Simulate host disconnect
1. On host device, disable network or close browser tab
2. Observe player devices and TV display

**Expected** (Scenario 18):
- Game automatically pauses after ~5 seconds (presence timeout)
- All players see "Waiting for host..." message
- TV display shows "Game Paused" state
- Host reconnects: Game resumes from paused state

---

## Scenario 19-20: Scoring and Tie-Breaking

### Step 20: Tied Scores with Time-Based Tie-Breaking
**Action**: Create scenario with tied scores
1. Ensure two teams have identical scores (e.g., both 10/15 correct)
2. Host clicks "Show Final Scores"
3. Verify tie-breaking logic

**Expected** (Scenario 19):
- System compares cumulative_answer_time_ms for tied teams
- Team with lower total time ranked higher
- Scoreboard displays: "Quiz Wizards - 1st (10 pts, 45.2s avg)"

### Step 21: Verify Tie-Breaking Calculation
**Action**: Check database for tie-breaking data
1. Query `teams` table for both tied teams
2. Compare `cumulative_answer_time_ms` values

**Expected** (Scenario 20):
- Winning team has lower cumulative time
- Calculation: SUM(answer_time_ms) across all submissions
- Scoreboard accurately reflects database values

---

## Edge Case Validation

### Step 22: Question Reuse Prevention
**Action**: Create second game with same host
1. Host creates new game with identical configuration
2. Request 15 questions from Sports + History
3. Preview questions

**Expected**:
- None of the 15 questions match questions from first game
- `question_usage` table populated with all used questions
- Exclusion query working correctly (FR-006)

### Step 23: Anonymous Player Session
**Action**: Test anonymous authentication
1. New player navigates to /join (not logged in)
2. Enters game code
3. System prompts: "Sign in or Continue as Guest"
4. Clicks "Continue as Guest"
5. Enters display name: "Guest Player"
6. Joins team and plays game
7. Close browser and reopen within 30 days
8. Navigate to /join

**Expected**:
- Anonymous session created (Supabase anon auth)
- Player can join team and submit answers
- Session persists in localStorage
- After 30 days, session expires (FR-021a)

---

## Validation Checklist

- [ ] All 20 acceptance scenarios pass
- [ ] Real-time sync <300ms verified (Scenario 15-18)
- [ ] Tie-breaking logic correct (Scenario 19-20)
- [ ] Question reuse prevention working (Step 22)
- [ ] Anonymous auth 30-day session (Step 23)
- [ ] Answer lock enforced (Scenario 9-10)
- [ ] Multi-device support verified (Player login on 2+ devices)
- [ ] TV display reconnection silent (no host notification)
- [ ] RLS policies enforced (host can only see own games)

---

## Performance Validation

### Lighthouse Scores (Mobile)
- Run Lighthouse on player interface: https://[app-url]/game/[gameId]
- **Target**: Performance ≥ 90, Accessibility ≥ 90

### Load Testing
- Create game with 10 teams (60 players)
- All submit answers simultaneously
- **Target**: <300ms sync latency, no dropped messages

---

**Quickstart Guide Complete**: 2025-09-30
**Total Steps**: 23
**Estimated Execution Time**: 45-60 minutes
**Next Step**: Implement and execute tests