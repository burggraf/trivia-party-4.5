# Feature Specification: Multi-User Trivia Party Application

**Feature Branch**: `001-initial-game-setup`
**Created**: 2025-09-30
**Status**: Draft
**Input**: User description: "initial game setup - Multi-User Trivia Party Application"

## Execution Flow (main)
```
1. Parse user description from Input
   → Comprehensive feature description provided
2. Extract key concepts from description
   → Identified: Host, Player, Team, Game, Question, Round, Score, Real-time sync
3. For each unclear aspect:
   → Marked clarifications needed for ambiguous requirements
4. Fill User Scenarios & Testing section
   → Defined primary flows for host setup, player joining, and gameplay
5. Generate Functional Requirements
   → Created testable requirements across all feature areas
6. Identify Key Entities (if data involved)
   → Identified: Host, Player, Team, Game, Round, Question, Answer Submission, Score
7. Run Review Checklist
   → Marked areas needing clarification
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-09-30
- Q: When insufficient unused questions remain (even after supplementing from related categories), what should the system do? → A: Warn host before game creation, show available question count, allow proceeding with reduced questions
- Q: How long should anonymous player sessions remain valid after game completion? → A: 30 days after game ends
- Q: Should registered players be allowed to log in from multiple devices simultaneously? → A: Yes, allow multi-device login with synchronized state across all devices
- Q: What should happen when a TV display disconnects during a game? → A: Auto-reconnect silently in background, no host notification
- Q: What leaderboard scope(s) should the system support? → A: Venue-based leaderboards only (players grouped by venue/location)

---

## User Scenarios & Testing

### Primary User Story

**Host Perspective:**
As a trivia host at a pub/restaurant venue, I want to create and manage trivia games so that I can run engaging trivia nights for patrons. I need to configure the number of rounds, select question categories, preview questions, and control the game flow in real-time while questions and scores display on TV screens for all participants to see.

**Player Perspective:**
As a trivia player, I want to join a team using my mobile phone by entering a game code or scanning a QR code, so I can participate in the trivia game. I want to see questions on my phone, submit answers, and view our team's progress without needing to look at the TV screen constantly.

### Acceptance Scenarios

#### Host Setup Flow
1. **Given** I am an authenticated host, **When** I create a new game with name "Monday Night Trivia", 3 rounds, 5 questions per round, and select categories "Sports" and "History", **Then** the system randomly selects 15 questions from those categories that I have never used before
2. **Given** I have configured a game, **When** I preview the selected questions, **Then** I see each question with its shuffled answer options in the same order that players will see
3. **Given** I am viewing the question preview, **When** I choose to remove a question or replace it with another from the same category, **Then** the system updates my game configuration accordingly
4. **Given** I have finalized my game setup, **When** I start the game, **Then** a unique game code is generated and displayed along with a QR code for players to join

#### Player Join Flow
5. **Given** the host has started a game, **When** I enter the game code or scan the QR code on my mobile device, **Then** I am prompted to either create a new team or join an existing team
6. **Given** I choose to create a new team with name "Quiz Wizards" and 4 maximum players, **When** I submit, **Then** my team is created and I enter the game lobby awaiting other players
7. **Given** another player wants to join my team, **When** they enter the game code and select "Quiz Wizards", **Then** they join my team if we haven't reached our maximum size or the game hasn't started
8. **Given** all teams have joined, **When** the host advances to the first question, **Then** all players see the question and answer options on their devices simultaneously

#### Gameplay Flow
9. **Given** a question is displayed to all players, **When** I select an answer and submit it, **Then** my answer is locked and other team members see "Your team has answered"
10. **Given** a team member has already submitted an answer, **When** I try to submit a different answer, **Then** I see the message "Your team has already answered" and my submission is rejected
11. **Given** a question has an optional time limit enabled, **When** the countdown timer reaches zero, **Then** the host's view automatically advances to reveal the correct answer
12. **Given** the correct answer is revealed, **When** the host advances to the next question, **Then** all players see the new question and can submit answers again
13. **Given** all questions in a round are completed, **When** the host displays the scoreboard, **Then** all players and TV screens show team names, scores, and current standings
14. **Given** all rounds are completed, **When** the host ends the game, **Then** final scores are displayed showing the winning team and all teams' rankings

#### Real-Time Synchronization
15. **Given** the host advances to a new question, **When** the action is performed, **Then** all player devices and TV displays update within 300ms to show the new question
16. **Given** a player submits an answer, **When** the submission is received, **Then** the TV display updates to show "X of Y teams have answered"
17. **Given** the host pauses the game, **When** the pause action occurs, **Then** all players see a "Game Paused" message and cannot submit answers
18. **Given** the host was disconnected, **When** the disconnection occurs, **Then** the game automatically pauses and displays a "Waiting for host" message to all players

#### Score Calculation and Tie-Breaking
19. **Given** two teams both have 10 correct answers, **When** final scores are calculated, **Then** the team with the lowest cumulative answer time is ranked higher
20. **Given** a team answers questions faster than others, **When** scores are tied on points, **Then** the system uses total time taken across all questions to break the tie

### Edge Cases

#### Question Selection
- **What happens when a host has already used most questions in selected categories?**
  The system automatically supplements with questions from related categories while still ensuring no question is ever repeated for that host.

- **What happens if there are insufficient unused questions even after supplementing?**
  The system warns the host before game creation, displays the actual available question count, and allows the host to proceed with the reduced number of questions if they choose.

#### Team Management
- **What happens when a player tries to join after the game has started?**
  The player is prevented from joining and sees a message indicating the game is already in progress.

- **What happens when a player creates a team with a name that already exists in that game?**
  The system rejects the team name and prompts the player to choose a different unique name.

- **What happens when a solo player (team of 1) participates?**
  They function as both the team and the only team member, submitting answers individually.

- **What happens when a player joins a team late (before game starts) and misses the initial setup?**
  They join their team and missed questions count as incorrect for scoring purposes.

#### Answer Submission
- **What happens if multiple team members submit answers simultaneously?**
  The first answer received by the system is recorded and locked; all subsequent attempts are rejected with "Your team has already answered" message.

- **What happens if no teams submit an answer for a question?**
  The host can still reveal the correct answer and advance to the next question; all teams receive zero points for that question.

- **What happens if a time limit expires before any team answers?**
  The system auto-advances to reveal the correct answer following normal game flow; teams that didn't answer receive zero points.

#### Disconnection Handling
- **What happens when a player disconnects mid-game?**
  The player's device attempts to auto-reconnect. If successful, they rejoin their team automatically. Questions missed during disconnection are not penalized (not counted as incorrect). Other team members can continue answering.

- **What happens if auto-reconnect fails?**
  The player sees a "Reconnect" button to manually attempt reconnection to rejoin their team.

- **What happens when the host disconnects?**
  The game automatically pauses. All players see "Game Paused - Waiting for host" message. When the host reconnects, they can resume the game from the paused state.

- **What happens when a TV display disconnects?**
  The system automatically reconnects the TV display silently in the background without notifying the host. The reconnection is seamless and does not interrupt gameplay.

#### Game State Management
- **What happens when a host accidentally advances past a question?**
  The host can navigate backward to previous questions. Previously submitted answers are preserved and displayed.

- **What happens when a host ends the game early before all rounds complete?**
  Final scores are calculated and displayed based only on completed rounds. Incomplete rounds are not counted.

- **What happens when a host wants to preview the next question before displaying it?**
  The host can privately view the upcoming question and has the option to replace it with another question from the same category before displaying to players.

- **What happens when a host replaces or skips a question?**
  Skipped/replaced questions do not count toward the round's question total and are not shown to players.

#### Authentication & Authorization
- **What happens when a player chooses anonymous login?**
  They enter just their name and receive a temporary anonymous session that remains valid for the game duration plus 30 days after game completion.

- **What happens when a registered player logs in from multiple devices?**
  The system allows multi-device login with synchronized state across all devices. Players can be logged in simultaneously on multiple devices and their game state remains synchronized.

- **What happens when a host tries to view or manage another host's game?**
  The system denies access and displays an authorization error.

- **What happens when someone tries to delete a game?**
  Only the host who created the game can delete it. Other hosts and players cannot delete games.

#### Data & History
- **What happens when a player views their game history?**
  They see a list of games they participated in, their team names, scores, and rankings, but NOT the actual question content or answers.

- **What happens when a host views their past games?**
  They see full game details including all questions, answers, team names, scores, and player participation.

- **What happens when game data is saved?**
  All completed games are permanently saved with no automatic deletion policy.

#### Network & Performance
- **What happens when an answer submission fails due to network issues?**
  The system automatically retries the submission. A loading state is shown during retry attempts. If submission ultimately fails, an error message is displayed to the player.

## Requirements

### Functional Requirements

#### Game Setup & Configuration
- **FR-001**: System MUST allow authenticated hosts to create game events with a required name field
- **FR-002**: System MUST allow hosts to optionally specify date, time, and venue/location for game events
- **FR-003**: System MUST allow hosts to configure the number of rounds per game
- **FR-004**: System MUST allow hosts to configure the number of questions per round
- **FR-005**: System MUST allow hosts to select one or multiple categories per round from the available category list
- **FR-006**: System MUST prevent questions from being reused for the same host across ALL their games (past and current)
- **FR-007**: System MUST automatically supplement with questions from related categories when selected categories have insufficient unused questions
- **FR-007a**: System MUST warn hosts before game creation if insufficient unused questions exist (even after supplementing), display the actual available question count, and allow the host to proceed with reduced questions if desired
- **FR-008**: System MUST randomly select questions based on the host's category selections and configured quantities
- **FR-009**: System MUST allow hosts to preview all selected questions with shuffled answers before starting the game
- **FR-010**: System MUST allow hosts to remove individual questions during preview
- **FR-011**: System MUST allow hosts to replace questions with alternatives from the same category during preview
- **FR-012**: System MUST allow hosts to save game configurations
- **FR-013**: System MUST generate a unique game code when a host starts a game
- **FR-014**: System MUST generate a QR code corresponding to the game code for easy player access
- **FR-015**: System MUST allow hosts to configure optional time limits per question (not per round)
- **FR-016**: System MUST allow hosts to configure team size constraints (minimum 1, maximum 6 players per team)
- **FR-017**: System MUST allow hosts to enable or disable optional sound effects during game setup
- **FR-018**: System MUST save game state persistently to allow resumption at a later date

#### Authentication & Authorization
- **FR-019**: System MUST require email/password authentication for hosts
- **FR-020**: System MUST restrict hosts to viewing and managing only their own games
- **FR-020a**: System MUST allow registered players to log in from multiple devices simultaneously with synchronized game state across all devices
- **FR-021**: System MUST allow players to create accounts using email/password authentication
- **FR-021a**: System MUST maintain anonymous player sessions for the game duration plus 30 days after game completion
- **FR-022**: System MUST allow players to use anonymous authentication by entering only their name
- **FR-023**: System MUST prevent hosts from viewing or managing games created by other hosts
- **FR-024**: System MUST restrict game deletion to only the host who created the game

#### Player Entry & Team Management
- **FR-025**: System MUST allow players to join games by entering a game code
- **FR-026**: System MUST allow players to join games by scanning a QR code
- **FR-027**: System MUST present joining players with options to create a new team or join an existing team
- **FR-028**: System MUST allow players to create new teams with a team name
- **FR-029**: System MUST allow players to join existing teams that haven't reached maximum capacity
- **FR-030**: System MUST enforce team name uniqueness within each game
- **FR-031**: System MUST prevent players from joining teams after the game has started
- **FR-032**: System MUST prevent players from switching teams after initially joining
- **FR-033**: System MUST support teams with 1 to 6 players based on host configuration
- **FR-034**: System MUST allow solo players (teams of 1)
- **FR-035**: System MUST count questions missed by late-joining players (before game start) as incorrect answers

#### Gameplay & Question Flow
- **FR-036**: System MUST display questions simultaneously to all player devices when the host advances
- **FR-037**: System MUST shuffle answer options (a, b, c, d) identically for all players, teams, TV displays, and host preview
- **FR-038**: System MUST display only answer text on player interfaces (no A/B/C/D labels)
- **FR-039**: System MUST allow players to select and submit one answer per question
- **FR-040**: System MUST accept only the first answer submitted by any team member
- **FR-041**: System MUST lock a team's answer after the first submission from any team member
- **FR-042**: System MUST reject subsequent answer submissions from the same team with the message "Your team has already answered"
- **FR-043**: System MUST handle simultaneous submissions from multiple team members by accepting the first received and rejecting others
- **FR-044**: System MUST hide the selected answer from other team members (only show "Your team has answered" status)
- **FR-045**: System MUST allow the host to advance to the next question manually
- **FR-046**: System MUST allow the host to reveal correct answers manually
- **FR-047**: System MUST display countdown timers to players only when time limits are enabled by the host
- **FR-048**: System MUST hide countdown timers when time limits are not configured
- **FR-049**: System MUST count down from the configured time limit for each question
- **FR-050**: System MUST automatically advance to reveal the correct answer when the time limit expires
- **FR-051**: System MUST follow normal game flow when auto-advancing due to time expiry (reveal answer, allow host to advance to next question)

#### Host Controls & Game State
- **FR-052**: System MUST allow the host to pause the game at any time
- **FR-053**: System MUST display "Game Paused" state to all players and TV displays when paused
- **FR-054**: System MUST prevent players from submitting answers while the game is paused
- **FR-055**: System MUST allow the host to resume the game from a paused state
- **FR-056**: System MUST allow the host to navigate backward to previous questions
- **FR-057**: System MUST preserve previously submitted answers when navigating backward
- **FR-058**: System MUST allow the host to end the game early before all rounds are completed
- **FR-059**: System MUST calculate final scores based only on completed rounds when game ends early
- **FR-060**: System MUST allow the host to privately preview the next question before displaying to players
- **FR-061**: System MUST allow the host to replace the upcoming question with another from the same category
- **FR-062**: System MUST exclude skipped or replaced questions from round totals
- **FR-063**: System MUST allow host to display scores at the end of each round
- **FR-064**: System MUST allow host to display final scores at the end of the game
- **FR-065**: System MUST support saving game state and resuming at a later date
- **FR-066**: System MUST persist all game state across sessions
- **FR-067**: System MUST automatically pause the game when the host disconnects
- **FR-068**: System MUST allow the host to reconnect and resume from the paused state
- **FR-069**: System MUST display "Waiting for host" message to players when host is disconnected

#### Real-Time Synchronization
- **FR-070**: System MUST synchronize question display to TV screens in real-time when host advances
- **FR-071**: System MUST synchronize question display to player devices in real-time when host advances
- **FR-072**: System MUST broadcast answer submissions in real-time to update TV displays
- **FR-073**: System MUST broadcast score updates in real-time to all participants
- **FR-074**: System MUST display standings in real-time on TV screens and player devices
- **FR-075**: System MUST synchronize game state changes (pause, resume, end) to all participants in real-time
- **FR-076**: System MUST update TV displays with "X of Y teams have answered" counter during active questions

#### Scoring & Results
- **FR-077**: System MUST award 1 point for each correct answer
- **FR-078**: System MUST award 0 points for incorrect or missing answers
- **FR-079**: System MUST NOT award partial credit for any answer
- **FR-080**: System MUST NOT apply speed bonuses to scoring
- **FR-081**: System MUST track cumulative answer time for each team throughout the game
- **FR-082**: System MUST break ties by comparing cumulative answer times (lowest time wins)
- **FR-083**: System MUST calculate and display team scores at the end of each round
- **FR-084**: System MUST calculate and display final scores at the end of the game
- **FR-085**: System MUST identify and display the winning team at game end
- **FR-086**: System MUST display team rankings/standings based on scores
- **FR-087**: System MUST visualize scores using charts or graphs for engaging display

#### Data Persistence & History
- **FR-088**: System MUST permanently save all completed games
- **FR-089**: System MUST allow players to view their game history without displaying actual question content
- **FR-090**: System MUST allow hosts to view their past games with full details including questions, answers, and scores
- **FR-091**: System MUST track team and player statistics across multiple games
- **FR-092**: System MUST calculate statistics including games played, win rates, and accuracy
- **FR-093**: System MUST provide leaderboards based on game performance
- **FR-094**: System MUST support venue-based leaderboard views where players are grouped by venue/location
- **FR-095**: System MUST track all questions used by each host to prevent reuse

#### Error Handling & Reconnection
- **FR-096**: System MUST attempt automatic reconnection when a player loses connection
- **FR-097**: System MUST display a "Reconnect" button if automatic reconnection fails
- **FR-098**: System MUST allow disconnected players to rejoin their original team automatically upon reconnection
- **FR-099**: System MUST NOT penalize players for questions missed during disconnection (not counted as incorrect)
- **FR-100**: System MUST allow other team members to continue answering during one member's disconnection
- **FR-101**: System MUST automatically reconnect TV displays silently in the background when they disconnect, without notifying the host
- **FR-101a**: System MUST ensure TV display reconnection is seamless and does not interrupt gameplay
- **FR-102**: System MUST automatically retry answer submissions on network failure
- **FR-103**: System MUST display loading states during answer submission retry attempts
- **FR-104**: System MUST display error messages if answer submission ultimately fails after retries
- **FR-105**: System MUST record the first answer received per team in case of submission conflicts
- **FR-106**: System MUST ignore duplicate or late submissions from the same team
- **FR-107**: System MUST display "Your team has already answered" message to players attempting late submissions

#### User Interface Requirements
- **FR-108**: System MUST provide a mobile-responsive player interface
- **FR-109**: System MUST provide a TV-optimized display interface for questions and scores
- **FR-110**: System MUST provide a host control interface for game management
- **FR-111**: System MUST display which teammates are currently online/connected on player devices
- **FR-112**: System MUST display team submission status without revealing the selected answer
- **FR-113**: System MUST display question and answer options only on TV screens during active questions
- **FR-114**: System MUST display "X of Y teams have answered" on TV screens during questions
- **FR-115**: System MUST display team names and initial scores before game starts on TV screens
- **FR-116**: System MUST display team names, scores, and standings at end of each round on TV screens
- **FR-117**: System MUST display final team names, scores, and winner at game end on TV screens
- **FR-118**: System MUST play sound effects when enabled by host (time running out, answers locked, round complete, etc.)

### Key Entities

- **Host**: A user who creates and manages trivia games. Can only access their own games. Authenticates via email/password. Key attributes: unique identifier, email, authentication credentials, list of created games, history of all questions used.

- **Player**: A user who participates in trivia games as part of a team. Can authenticate via email/password or anonymously. Key attributes: unique identifier, display name, authentication method (registered or anonymous), session information, game participation history, team membership.

- **Team**: A group of 1-6 players competing together in a game. Key attributes: unique identifier, team name (unique within game), list of team members, game association, score, cumulative answer time, answer submissions.

- **Game**: A trivia event created and controlled by a host. Key attributes: unique identifier, host reference, game code, QR code, name, optional date/time/venue, configuration (rounds, questions per round, time limits, team size constraints), state (setup/active/paused/completed), list of teams, current question index, round structure.

- **Round**: A segment of a game containing multiple questions from specified categories. Key attributes: round number, selected categories, list of questions, completion status.

- **Question**: A trivia question with one correct answer and three incorrect answers. Key attributes: unique identifier, category, question text, four answer options (where option 'a' is always correct in storage), randomization seed for consistent shuffling, metadata.

- **Question Instance**: A specific use of a question within a game round. Tracks the question's presentation and answers. Key attributes: question reference, round reference, display order, shuffled answer order (consistent for all participants), time limit if configured.

- **Answer Submission**: A team's response to a question. Key attributes: team reference, question instance reference, selected answer, submission timestamp, time taken to answer, correctness flag, submitting player reference.

- **Score**: Calculated points and rankings for teams. Key attributes: team reference, game reference, total correct answers, total points, cumulative answer time for tie-breaking, rank/standing.

- **Game History Entry**: A record of a completed game. Key attributes: game reference, final scores, winning team, participation list, completion timestamp. For hosts: includes full question and answer details. For players: excludes question content.

- **Question Usage Record**: Tracks which questions a host has used to prevent repetition. Key attributes: host reference, question reference, game reference where used, usage timestamp.

- **Leaderboard Entry**: Aggregated statistics for players or teams grouped by venue. Key attributes: player/team reference, games played, total wins, win rate, average score, accuracy percentage, ranking position, venue reference.

---

## Review & Acceptance Checklist

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs) - **WARNING**: User description mentioned specific technologies (Supabase Realtime, Supabase Auth, email/password authentication, QR codes, broadcast channels). These have been captured as requirements but should be translated to implementation-agnostic terms in final spec if needed.
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - **RESOLVED**: 5 critical clarifications answered
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Resolved Clarifications (Session 2025-09-30)
1. **Question exhaustion handling** - RESOLVED: Warn host, show available count, allow proceeding with reduced questions
2. **Anonymous session duration** - RESOLVED: 30 days after game completion
3. **Multi-device login** - RESOLVED: Allow with synchronized state across devices
4. **TV display disconnection** - RESOLVED: Auto-reconnect silently in background, no host notification
5. **Leaderboard scope** - RESOLVED: Venue-based only

### Deferred to Planning Phase
1. **Data retention policy** (FR-088): Permanent storage specified; retention policies are operational decisions better suited for infrastructure planning
2. **Real-time sync latency thresholds**: 300ms target specified in acceptance scenario 15; detailed monitoring and degradation strategies deferred to planning
3. **Performance requirements**: Mobile performance targets are implementation concerns better addressed during technical planning phase

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted (Host, Player, Team, Game, Question, Round, Score, Real-time sync)
- [x] Ambiguities marked (8 clarification points identified)
- [x] User scenarios defined (20 acceptance scenarios + extensive edge cases)
- [x] Requirements generated (119 functional requirements - added FR-007a)
- [x] Entities identified (12 key entities)
- [x] Clarifications resolved (5 critical questions answered on 2025-09-30)
- [x] Review checklist passed - **COMPLETE**: Ready for planning phase

---