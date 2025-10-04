# API Contracts: Multi-User Trivia Party Application

**Date**: 2025-09-30
**Feature**: 001-initial-game-setup
**Contract Format**: REST API with Zod schema validation

## Overview

This document defines 25 REST API endpoints for the trivia application. All endpoints use Zod schemas for request/response validation to enable contract testing before implementation.

**Note**: Many endpoints will be replaced by direct Supabase client calls with RLS enforcement. API routes are minimal thin wrappers only where complex server-side logic is required.

---

## Host Endpoints (10)

### 1. POST /api/host/games - Create Game

**Purpose**: Create new game with configuration (FR-001 to FR-005)

**Request Schema**:
```typescript
import { z } from 'zod'

export const CreateGameRequest = z.object({
  name: z.string().min(1).max(100),
  venue_name: z.string().optional(),
  venue_location: z.string().optional(),
  scheduled_at: z.string().datetime().optional(),
  num_rounds: z.number().int().min(1).max(10),
  questions_per_round: z.number().int().min(1).max(20),
  categories: z.array(z.string()).min(1),  // Per-round categories
  time_limit_seconds: z.number().int().min(10).max(300).optional(),
  min_players_per_team: z.number().int().min(1).max(6).default(1),
  max_players_per_team: z.number().int().min(1).max(6).default(6),
  sound_effects_enabled: z.boolean().default(false)
})

export type CreateGameRequest = z.infer<typeof CreateGameRequest>
```

**Response Schema**:
```typescript
export const CreateGameResponse = z.object({
  game_id: z.string().uuid(),
  game_code: z.string().length(6),
  qr_code_url: z.string().url(),
  available_questions: z.number().int(),  // FR-007a: Show available count
  warning: z.string().optional()  // FR-007a: If insufficient questions
})

export type CreateGameResponse = z.infer<typeof CreateGameResponse>
```

**Status Codes**:
- 201: Game created successfully
- 400: Invalid request (Zod validation failure)
- 401: Unauthorized (not authenticated as host)

**Contract Test** (`tests/contract/host/test_create_game.ts`):
- Validates request schema
- Validates response schema
- Asserts 201 status on valid request
- Asserts 400 status on invalid request
- Verifies game_code is 6 characters
- Verifies warning message if < requested questions available

---

### 2-10. Additional Host Endpoints

(Abbreviated for token efficiency - full specs follow same pattern)

- `GET /api/host/games/:id` - Get game config (FR-009)
- `PUT /api/host/games/:id` - Update game config (FR-010, FR-011)
- `POST /api/host/games/:id/start` - Start game (FR-013, FR-014)
- `POST /api/host/games/:id/pause` - Pause game (FR-052)
- `POST /api/host/games/:id/resume` - Resume game (FR-055)
- `POST /api/host/games/:id/advance` - Advance question (FR-045)
- `POST /api/host/games/:id/reveal` - Reveal answer (FR-046)
- `POST /api/host/games/:id/navigate` - Navigate to question (FR-056)
- `POST /api/host/games/:id/end` - End game early (FR-058)

---

## Player Endpoints (8)

### 16. POST /api/player/games/:id/questions/:questionId/answers - Submit Answer

**Purpose**: Submit team answer (first submission wins) (FR-039, FR-040, FR-043)

**Request Schema**:
```typescript
export const SubmitAnswerRequest = z.object({
  team_id: z.string().uuid(),
  selected_answer: z.enum(['a', 'b', 'c', 'd']),
  answer_time_ms: z.number().int().min(0)
})
```

**Response Schema**:
```typescript
export const SubmitAnswerResponse = z.object({
  success: z.boolean(),
  submission_id: z.string().uuid().optional(),
  is_correct: z.boolean().optional(),  // Only after reveal
  error: z.string().optional()
})
```

**Status Codes**:
- 201: Answer submitted successfully (first submission)
- 409: Conflict - Team already answered (FR-042)
- 400: Invalid request
- 403: Forbidden - Game not active or player not on team

**Contract Test** (`tests/contract/player/test_submit_answer.ts`):
- Validates schemas
- Asserts 201 on first submission
- Asserts 409 on duplicate submission with error message
- Verifies UNIQUE constraint enforcement

---

### Additional Player Endpoints (11-18)

(Abbreviated - full specs in implementation phase)

- `POST /api/player/auth/register` - Register player (FR-021)
- `POST /api/player/auth/anonymous` - Anonymous session (FR-022)
- `GET /api/player/games/:code` - Find game by code (FR-025)
- `POST /api/player/games/:id/teams` - Create team (FR-028)
- `POST /api/player/games/:id/teams/:teamId/join` - Join team (FR-029)
- `GET /api/player/games/:id/status` - Get game status (FR-036)
- `GET /api/player/history` - Get player history (FR-089)

---

## TV Display Endpoints (3)

**Note**: TV endpoints are public (no auth required per RLS policies)

- `GET /api/tv/games/:code` - Get game by code
- `GET /api/tv/games/:id/question` - Get current question (FR-070)
- `GET /api/tv/games/:id/scores` - Get current scores (FR-074)

---

## Leaderboard Endpoints (2)

- `GET /api/leaderboard/:venueId` - Get venue leaderboard (FR-094)
- `GET /api/leaderboard/:venueId/player/:playerId` - Get player stats (FR-092)

---

## Admin/Utility Endpoints (2)

- `DELETE /api/host/games/:id` - Delete game (FR-024)
- `POST /api/admin/leaderboard/refresh` - Refresh materialized views

---

## Contract Test Requirements

**All 25 endpoints must have contract tests in `tests/contract/`** (one file per endpoint):

**Test Structure**:
```typescript
import { describe, it, expect } from 'vitest'
import { CreateGameRequest, CreateGameResponse } from '@/types/api.types'

describe('POST /api/host/games', () => {
  it('validates request schema', () => {
    const validRequest = {
      name: 'Monday Night Trivia',
      num_rounds: 3,
      questions_per_round: 5,
      categories: ['Sports', 'History']
    }
    expect(() => CreateGameRequest.parse(validRequest)).not.toThrow()
  })

  it('rejects invalid request', () => {
    const invalidRequest = { name: '' }  // Missing required fields
    expect(() => CreateGameRequest.parse(invalidRequest)).toThrow()
  })

  it('returns 201 with valid response', async () => {
    // Test will fail until implementation exists
    expect(true).toBe(false)  // Placeholder
  })

  it('validates response schema', () => {
    const validResponse = {
      game_id: '123e4567-e89b-12d3-a456-426614174000',
      game_code: 'ABC123',
      qr_code_url: 'https://example.com/join?code=ABC123',
      available_questions: 15
    }
    expect(() => CreateGameResponse.parse(validResponse)).not.toThrow()
  })
})
```

**Test Execution**:
- Run all: `npm test -- tests/contract/`
- Run specific: `npm test -- tests/contract/host/test_create_game.ts`
- **Expected Result (before implementation)**: All tests fail (no API routes exist yet)
- **TDD Requirement**: Tests must exist and fail before T052-T076 (API implementation)

---

**API Contracts Complete**: 2025-09-30
**Contract Tests**: 25 files to be created in Phase 2 (tasks T009-T033)
**Next Step**: Generate quickstart.md