# Game State Machine Refactor

## Problem
Current game flow is overcomplicated:
- "Reveal Answer" button is confusing
- Correct answer shows immediately after advancing question
- Missing key screens: round intros, round scores, thanks screen
- Navigation doesn't follow a clear state machine

## Proposed State Machine

### States
1. **setup** - Game created, waiting to start
2. **game_intro** - Welcome screen with game title
3. **round_intro** - "Round [N]" title screen
4. **question_active** - Question displayed, teams can answer
5. **question_revealed** - Answer revealed, waiting for next
6. **round_scores** - Scores at end of round
7. **game_complete** - Final scores
8. **game_thanks** - "Thanks for playing"

### State Transitions (via single "Next" button)
```
setup
  → game_intro (Start Game)

game_intro
  → round_intro (Round 1)

round_intro
  → question_active (First question of round)

question_active
  → question_revealed (Reveal answer)

question_revealed
  → question_active (Next question in round)
  → round_scores (Last question in round)

round_scores
  → round_intro (Next round)
  → game_complete (Last round)

game_complete
  → game_thanks

game_thanks
  → (Navigate to final scores page)
```

## Database Changes

Add to `games` table:
```sql
ALTER TABLE games ADD COLUMN game_state TEXT NOT NULL DEFAULT 'setup';
ALTER TABLE games ADD COLUMN is_answer_revealed BOOLEAN NOT NULL DEFAULT false;

-- Constraint
ALTER TABLE games ADD CONSTRAINT games_game_state_check
  CHECK (game_state IN ('setup', 'game_intro', 'round_intro', 'question_active', 'question_revealed', 'round_scores', 'game_complete', 'game_thanks'));
```

## Implementation Plan

### Phase 1: Database Migration
- [ ] Create migration to add `game_state` and `is_answer_revealed` columns
- [ ] Update Supabase types

### Phase 2: Game Service
- [ ] Create `advanceGameState()` function to handle all transitions
- [ ] Update real-time events to broadcast state changes
- [ ] Remove separate `revealAnswer()` function

### Phase 3: Host Interface
- [ ] Simplify GameControlPage to single "Next" button
- [ ] Add screens for: game_intro, round_intro, round_scores, game_thanks
- [ ] Update question display to hide answer until revealed state

### Phase 4: Player Interface
- [ ] Add screens for all states (players should see same as TV)
- [ ] Disable answer submission except in question_active state
- [ ] Show revealed answers in question_revealed state

### Phase 5: TV Interface
- [ ] Add screens for all states
- [ ] Large format displays for title screens
- [ ] Animated score displays

### Phase 6: Testing
- [ ] Test full game flow through all states
- [ ] Test backward navigation (Previous button)
- [ ] Test pause/resume in different states

## Backward Navigation
Previous button logic:
- question_revealed → question_active (hide answer)
- question_active → question_revealed (previous question)
- round_scores → question_revealed (last question of round)
- round_intro → round_scores (previous round)
- game_intro → setup

## Notes
- Timer only runs in `question_active` state
- Answer submissions only accepted in `question_active` state
- State changes broadcast via real-time events
- All three interfaces (host, player, TV) sync on state changes
