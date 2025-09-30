import { z } from 'zod'

// ============================================================================
// Host API Schemas
// ============================================================================

// POST /api/host/games - Create Game
export const CreateGameRequestSchema = z.object({
  name: z.string().min(1).max(100),
  venue_name: z.string().min(1).max(100).optional(),
  venue_location: z.string().max(200).optional(),
  scheduled_at: z.string().datetime().optional(),
  num_rounds: z.number().int().min(1).max(10),
  questions_per_round: z.number().int().min(1).max(20),
  time_limit_seconds: z.number().int().min(10).max(300).optional(),
  min_players_per_team: z.number().int().min(1).max(6).default(1),
  max_players_per_team: z.number().int().min(1).max(6).default(6),
  sound_effects_enabled: z.boolean().default(false),
  rounds: z.array(
    z.object({
      round_number: z.number().int().min(1),
      categories: z.array(z.string()).min(1),
    })
  ).min(1),
})

export type CreateGameRequest = z.infer<typeof CreateGameRequestSchema>

export const CreateGameResponseSchema = z.object({
  game_id: z.string().uuid(),
  game_code: z.string().length(6),
  available_questions: z.number().int().min(0),
  warning: z.string().optional(),
})

export type CreateGameResponse = z.infer<typeof CreateGameResponseSchema>

// GET /api/host/games/:id - Get Game
export const GetGameResponseSchema = z.object({
  id: z.string().uuid(),
  host_id: z.string().uuid(),
  game_code: z.string().length(6),
  name: z.string(),
  venue_name: z.string().optional(),
  venue_location: z.string().optional(),
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['setup', 'active', 'paused', 'completed']),
  num_rounds: z.number().int(),
  questions_per_round: z.number().int(),
  time_limit_seconds: z.number().int().optional(),
  min_players_per_team: z.number().int(),
  max_players_per_team: z.number().int(),
  sound_effects_enabled: z.boolean(),
  current_question_index: z.number().int(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  rounds: z.array(
    z.object({
      id: z.string().uuid(),
      round_number: z.number().int(),
      categories: z.array(z.string()),
    })
  ),
  questions: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int(),
      question_id: z.string().uuid(),
      question_text: z.string(),
      category: z.string(),
      answers: z.array(
        z.object({
          letter: z.enum(['a', 'b', 'c', 'd']),
          text: z.string(),
        })
      ),
      randomization_seed: z.number().int(),
      revealed_at: z.string().datetime().optional(),
    })
  ),
})

export type GetGameResponse = z.infer<typeof GetGameResponseSchema>

// PUT /api/host/games/:id - Update Game
export const UpdateGameRequestSchema = CreateGameRequestSchema.partial()

export type UpdateGameRequest = z.infer<typeof UpdateGameRequestSchema>

export const UpdateGameResponseSchema = GetGameResponseSchema

export type UpdateGameResponse = z.infer<typeof UpdateGameResponseSchema>

// POST /api/host/games/:id/start - Start Game
export const StartGameResponseSchema = z.object({
  game_code: z.string().length(6),
  qr_code_url: z.string().url(),
  started_at: z.string().datetime(),
})

export type StartGameResponse = z.infer<typeof StartGameResponseSchema>

// POST /api/host/games/:id/pause - Pause Game
export const PauseGameResponseSchema = z.object({
  success: z.boolean(),
  status: z.literal('paused'),
})

export type PauseGameResponse = z.infer<typeof PauseGameResponseSchema>

// POST /api/host/games/:id/resume - Resume Game
export const ResumeGameResponseSchema = z.object({
  success: z.boolean(),
  status: z.literal('active'),
})

export type ResumeGameResponse = z.infer<typeof ResumeGameResponseSchema>

// POST /api/host/games/:id/advance - Advance Question
export const AdvanceQuestionResponseSchema = z.object({
  current_question_index: z.number().int(),
  question: z.object({
    id: z.string().uuid(),
    question_text: z.string(),
    category: z.string(),
    answers: z.array(
      z.object({
        letter: z.enum(['a', 'b', 'c', 'd']),
        text: z.string(),
      })
    ),
  }),
})

export type AdvanceQuestionResponse = z.infer<typeof AdvanceQuestionResponseSchema>

// POST /api/host/games/:id/reveal - Reveal Answer
export const RevealAnswerResponseSchema = z.object({
  correct_answer: z.enum(['a', 'b', 'c', 'd']),
  revealed_at: z.string().datetime(),
})

export type RevealAnswerResponse = z.infer<typeof RevealAnswerResponseSchema>

// POST /api/host/games/:id/navigate - Navigate to Question
export const NavigateQuestionRequestSchema = z.object({
  target_question_index: z.number().int().min(0),
})

export type NavigateQuestionRequest = z.infer<typeof NavigateQuestionRequestSchema>

export const NavigateQuestionResponseSchema = z.object({
  current_question_index: z.number().int(),
})

export type NavigateQuestionResponse = z.infer<typeof NavigateQuestionResponseSchema>

// POST /api/host/games/:id/end - End Game
export const EndGameResponseSchema = z.object({
  status: z.literal('completed'),
  completed_at: z.string().datetime(),
  final_scores: z.array(
    z.object({
      team_id: z.string().uuid(),
      team_name: z.string(),
      score: z.number().int(),
      rank: z.number().int(),
      cumulative_answer_time_ms: z.number().int(),
    })
  ),
})

export type EndGameResponse = z.infer<typeof EndGameResponseSchema>

// ============================================================================
// Player API Schemas
// ============================================================================

// POST /api/player/auth/register - Register Player
export const RegisterPlayerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  display_name: z.string().min(1).max(50),
})

export type RegisterPlayerRequest = z.infer<typeof RegisterPlayerRequestSchema>

export const RegisterPlayerResponseSchema = z.object({
  user_id: z.string().uuid(),
  session_token: z.string(),
})

export type RegisterPlayerResponse = z.infer<typeof RegisterPlayerResponseSchema>

// POST /api/player/auth/anonymous - Anonymous Auth
export const AnonymousAuthRequestSchema = z.object({
  display_name: z.string().min(1).max(50),
})

export type AnonymousAuthRequest = z.infer<typeof AnonymousAuthRequestSchema>

export const AnonymousAuthResponseSchema = z.object({
  user_id: z.string().uuid(),
  session_token: z.string(),
})

export type AnonymousAuthResponse = z.infer<typeof AnonymousAuthResponseSchema>

// GET /api/player/games/:code - Find Game by Code
export const FindGameResponseSchema = z.object({
  game_id: z.string().uuid(),
  name: z.string(),
  venue_name: z.string().optional(),
  status: z.enum(['setup', 'active', 'paused', 'completed']),
})

export type FindGameResponse = z.infer<typeof FindGameResponseSchema>

// POST /api/player/games/:id/teams - Create Team
export const CreateTeamRequestSchema = z.object({
  team_name: z.string().min(1).max(50),
})

export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>

export const CreateTeamResponseSchema = z.object({
  team_id: z.string().uuid(),
  team_name: z.string(),
})

export type CreateTeamResponse = z.infer<typeof CreateTeamResponseSchema>

// POST /api/player/games/:id/teams/:teamId/join - Join Team
export const JoinTeamResponseSchema = z.object({
  success: z.boolean(),
  team_id: z.string().uuid(),
})

export type JoinTeamResponse = z.infer<typeof JoinTeamResponseSchema>

// POST /api/player/games/:id/questions/:questionId/answers - Submit Answer
export const SubmitAnswerRequestSchema = z.object({
  selected_answer: z.enum(['a', 'b', 'c', 'd']),
  answer_time_ms: z.number().int().min(0),
})

export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>

export const SubmitAnswerResponseSchema = z.object({
  submission_id: z.string().uuid(),
  is_correct: z.boolean(),
  submitted_at: z.string().datetime(),
})

export type SubmitAnswerResponse = z.infer<typeof SubmitAnswerResponseSchema>

// GET /api/player/games/:id/status - Get Game Status
export const GetGameStatusResponseSchema = z.object({
  game_id: z.string().uuid(),
  status: z.enum(['setup', 'active', 'paused', 'completed']),
  current_question_index: z.number().int(),
  teams_answered_count: z.number().int(),
})

export type GetGameStatusResponse = z.infer<typeof GetGameStatusResponseSchema>

// GET /api/player/history - Get Player History
export const GetPlayerHistoryResponseSchema = z.object({
  games: z.array(
    z.object({
      game_id: z.string().uuid(),
      game_name: z.string(),
      venue_name: z.string().optional(),
      completed_at: z.string().datetime(),
      team_name: z.string(),
      team_score: z.number().int(),
      team_rank: z.number().int(),
      // Note: No question content per FR-089
    })
  ),
})

export type GetPlayerHistoryResponse = z.infer<typeof GetPlayerHistoryResponseSchema>

// ============================================================================
// TV Display API Schemas
// ============================================================================

// GET /api/tv/games/:code - Get Game for TV
export const GetTVGameResponseSchema = z.object({
  game_id: z.string().uuid(),
  name: z.string(),
  venue_name: z.string().optional(),
  status: z.enum(['setup', 'active', 'paused', 'completed']),
})

export type GetTVGameResponse = z.infer<typeof GetTVGameResponseSchema>

// GET /api/tv/games/:id/question - Get Current Question for TV
export const GetTVQuestionResponseSchema = z.object({
  question_text: z.string(),
  category: z.string(),
  answers: z.array(
    z.object({
      letter: z.enum(['a', 'b', 'c', 'd']),
      text: z.string(),
    })
  ),
  teams_answered_count: z.number().int(),
  total_teams: z.number().int(),
})

export type GetTVQuestionResponse = z.infer<typeof GetTVQuestionResponseSchema>

// GET /api/tv/games/:id/scores - Get Scores for TV
export const GetTVScoresResponseSchema = z.object({
  teams: z.array(
    z.object({
      team_id: z.string().uuid(),
      team_name: z.string(),
      score: z.number().int(),
      rank: z.number().int(),
    })
  ),
})

export type GetTVScoresResponse = z.infer<typeof GetTVScoresResponseSchema>

// ============================================================================
// Leaderboard API Schemas
// ============================================================================

// GET /api/leaderboard/:venueId - Get Venue Leaderboard
export const GetLeaderboardResponseSchema = z.object({
  venue_name: z.string(),
  players: z.array(
    z.object({
      player_id: z.string().uuid(),
      display_name: z.string(),
      games_played: z.number().int(),
      games_won: z.number().int(),
      win_rate: z.number(),
      avg_score: z.number(),
      accuracy: z.number(),
      rank: z.number().int(),
    })
  ),
})

export type GetLeaderboardResponse = z.infer<typeof GetLeaderboardResponseSchema>

// GET /api/leaderboard/:venueId/player/:playerId - Get Player Stats
export const GetPlayerStatsResponseSchema = z.object({
  player_id: z.string().uuid(),
  display_name: z.string(),
  games_played: z.number().int(),
  games_won: z.number().int(),
  win_rate: z.number(),
  avg_score: z.number(),
  accuracy: z.number(),
  rank: z.number().int(),
})

export type GetPlayerStatsResponse = z.infer<typeof GetPlayerStatsResponseSchema>

// ============================================================================
// Admin API Schemas
// ============================================================================

// POST /api/admin/leaderboard/refresh - Refresh Leaderboard
export const RefreshLeaderboardResponseSchema = z.object({
  success: z.boolean(),
  refreshed_at: z.string().datetime(),
})

export type RefreshLeaderboardResponse = z.infer<typeof RefreshLeaderboardResponseSchema>

// ============================================================================
// Common Error Schema
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  status: z.number().int(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>