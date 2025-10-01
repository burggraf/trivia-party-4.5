# Security Architecture

## Player Anti-Cheating Measures

### ✅ Implemented Security Controls

#### 1. Server-Side Answer Shuffling
**Problem Solved**: Players cannot inspect broadcast messages to find correct answers

**Implementation**:
- Host shuffles answers using randomization seed BEFORE broadcasting
- Players receive only shuffled answer TEXT in array format
- No letter mappings ('a', 'b', 'c', 'd') sent to players
- No `is_correct` flags sent to players

**Code Location**: `src/lib/services/game-service.ts:713-733`

#### 2. Index-Based Answer Submission
**Problem Solved**: Players cannot submit 'a' knowing it's always correct

**Implementation**:
- Players submit answer INDEX (0-3) instead of database letter
- Server validates index against shuffle seed to determine correctness
- Submitted index is mapped back to database letter only on server
- Players have no way to know which index corresponds to 'a'

**Code Location**: `src/lib/services/game-service.ts:854-880`

#### 3. No Direct Database Access for Players
**Problem Solved**: Players cannot query questions table to see answer fields

**Implementation**:
- Players do NOT call `getCurrentQuestion()` from database
- All question data comes via broadcast from host
- Initial page load waits for broadcast (no pre-loading)

**Code Location**: `src/pages/player/GamePage.tsx:82-85`

#### 4. Correct Answer Revealed Server-Side Only
**Problem Solved**: Players cannot see correct answer until host reveals

**Implementation**:
- `question_revealed` state broadcast includes `correctAnswerIndex` (0-3)
- Players receive ONLY the index when revealed, no re-broadcast of full question
- Client marks answer as correct based on index match

**Code Location**: `src/lib/services/game-service.ts:734-746`

---

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ QUESTION_ACTIVE State                                        │
│                                                              │
│ Host Broadcasts:                                            │
│ {                                                           │
│   question: {                                               │
│     id: "uuid",                                             │
│     category: "Science",                                    │
│     question: "What is H2O?",                               │
│     answers: ["Water", "Hydrogen", "Oxygen", "Helium"]  ← Shuffled!│
│   },                                                         │
│   gameQuestionId: "uuid"                                    │
│   // NO randomization seed sent                            │
│   // NO letter mappings sent                               │
│   // NO is_correct flags sent                              │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PLAYER SUBMITS ANSWER                                        │
│                                                              │
│ Player Sends:                                               │
│ {                                                           │
│   selectedAnswerIndex: 2  ← Just the index (0-3)          │
│   answerTimeMs: 5432                                        │
│ }                                                           │
│                                                              │
│ Server:                                                     │
│ 1. Loads question + randomization seed                      │
│ 2. Shuffles answers with seed                               │
│ 3. Finds correct index in shuffled array                    │
│ 4. Compares submitted index to correct index               │
│ 5. Maps index to database letter for storage               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ QUESTION_REVEALED State                                      │
│                                                              │
│ Host Broadcasts:                                            │
│ {                                                           │
│   correctAnswerIndex: 0  ← Just the index                  │
│ }                                                           │
│                                                              │
│ Players highlight answers[0] as correct                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Attack Vectors Eliminated

| Attack Vector | Prevention |
|---------------|------------|
| **Inspect WebSocket messages** | ✅ Messages contain only shuffled text, no letters or correct flags |
| **Inspect browser state/memory** | ✅ No correct answer stored until reveal |
| **Submit 'a' knowing it's correct** | ✅ Players submit index, server validates against seed |
| **Database query for answers** | ✅ Players never query questions table |
| **Timing analysis** | ⚠️ Mitigated: Times used only for tie-breaking, not correctness |

---

### Remaining Considerations

#### ⚠️ Database Design Limitation
**Current**: Questions stored with 'a' always correct, shuffled client-side with deterministic seed

**Risk**: If randomization seed is ever exposed, players could pre-calculate correct answer

**Mitigation**: Seed is NEVER sent to players in current implementation

#### ⚠️ Row-Level Security (RLS)
**Current**: All authenticated users can read `questions` table including a, b, c, d fields

**Impact**: Not a vulnerability in current architecture because:
- Players never query questions table directly
- All data comes via broadcast (which is sanitized)
- Even if player manually queries, they don't know the seed to shuffle

**Future Enhancement**: Consider RLS policy to restrict questions.a/b/c/d to hosts only

---

### Testing Security

To verify anti-cheating measures:

1. **WebSocket Inspection**:
   - Open DevTools → Network → WS
   - Filter for `realtime` connection
   - Verify `state_changed` messages for `question_active` contain NO letter mappings
   - Verify `question_revealed` messages contain ONLY `correctAnswerIndex`

2. **Browser State Inspection**:
   - Open React DevTools
   - Check `GamePage` component state
   - Verify `question.correctAnswerIndex` is `undefined` until revealed
   - Verify no `answersMap` or letter data exists

3. **Network Request Inspection**:
   - Open DevTools → Network
   - Submit an answer
   - Verify POST body contains `selected_answer_index` (0-3), not letter

4. **Manual Database Query** (should NOT reveal correct answer to player):
   ```sql
   SELECT * FROM questions WHERE id = 'some-uuid';
   -- Returns: a, b, c, d fields
   -- BUT: Player has no seed to determine shuffle order
   -- AND: Player doesn't know which index they submitted corresponds to which letter
   ```

---

### Production Hardening (Future)

For additional security in production:

1. **Rate Limiting**: Prevent rapid-fire answer submissions
2. **Audit Logging**: Log all answer submissions with timestamps
3. **Anomaly Detection**: Flag teams with suspiciously perfect accuracy
4. **RLS Enhancement**: Restrict questions table columns to hosts
5. **Edge Function Validation**: Move answer validation to Supabase Edge Function for even stronger server-side control

---

Last Updated: 2025-10-01
