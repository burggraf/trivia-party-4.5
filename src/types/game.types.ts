// ============================================================================
// Domain Types for Multi-User Trivia Party Application
// ============================================================================

export type GameStatus = 'setup' | 'active' | 'paused' | 'completed'

export interface Game {
  id: string
  host_id: string
  game_code: string
  name: string
  venue_name?: string
  venue_location?: string
  scheduled_at?: string
  status: GameStatus
  num_rounds: number
  questions_per_round: number
  time_limit_seconds?: number
  min_players_per_team: number
  max_players_per_team: number
  sound_effects_enabled: boolean
  current_question_index: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Round {
  id: string
  game_id: string
  round_number: number
  categories: string[]
  created_at: string
}

export interface Question {
  id: string
  category: string
  question: string
  a: string // Correct answer
  b: string
  c: string
  d: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface GameQuestion {
  id: string
  game_id: string
  round_id: string
  question_id: string
  display_order: number
  randomization_seed: number
  revealed_at?: string
  created_at: string
}

export interface QuestionInstance extends GameQuestion {
  question: Question
}

export interface Team {
  id: string
  game_id: string
  team_name: string
  score: number
  cumulative_answer_time_ms: number
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  player_id: string
  joined_at: string
}

export interface AnswerSubmission {
  id: string
  game_question_id: string
  team_id: string
  submitted_by: string
  selected_answer: 'a' | 'b' | 'c' | 'd'
  is_correct: boolean
  answer_time_ms: number
  submitted_at: string
}

export interface QuestionUsage {
  id: string
  host_id: string
  question_id: string
  game_id: string
  used_at: string
}

export interface PlayerProfile {
  id: string
  display_name: string
  is_anonymous: boolean
  games_played: number
  games_won: number
  total_correct_answers: number
  total_questions_answered: number
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  venue_name: string
  player_id: string
  display_name: string
  games_played: number
  games_won: number
  win_rate: number
  avg_score: number
  accuracy: number
  rank: number
}

export interface TeamScore {
  team_id: string
  team_name: string
  score: number
  rank: number
  cumulative_answer_time_ms: number
}

export interface Answer {
  letter: 'a' | 'b' | 'c' | 'd'
  text: string
  is_correct?: boolean
}

// ============================================================================
// Realtime Event Types
// ============================================================================

export type GameEventType =
  | 'game_started'
  | 'game_paused'
  | 'game_resumed'
  | 'question_advanced'
  | 'answer_revealed'
  | 'game_completed'

export interface GameEvent {
  event_type: GameEventType
  game_id: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface QuestionAdvancedEvent extends GameEvent {
  event_type: 'question_advanced'
  metadata: {
    question_index: number
    question_id: string
  }
}

export interface AnswerRevealedEvent extends GameEvent {
  event_type: 'answer_revealed'
  metadata: {
    question_id: string
    correct_answer: 'a' | 'b' | 'c' | 'd'
  }
}

export interface GameCompletedEvent extends GameEvent {
  event_type: 'game_completed'
  metadata: {
    final_scores: TeamScore[]
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ShuffledQuestion extends Question {
  shuffled_answers: Answer[]
  randomization_seed: number
}

export interface GameConfig {
  name: string
  venue_name?: string
  venue_location?: string
  scheduled_at?: string
  num_rounds: number
  questions_per_round: number
  time_limit_seconds?: number
  min_players_per_team: number
  max_players_per_team: number
  sound_effects_enabled: boolean
  rounds: Array<{
    round_number: number
    categories: string[]
  }>
}

export interface GameWithDetails extends Game {
  rounds: Round[]
  questions: QuestionInstance[]
  teams: Team[]
}