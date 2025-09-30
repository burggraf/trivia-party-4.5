/**
 * Game Service - Client-Side
 *
 * Handles all game-related operations using Supabase browser client.
 * Implements FR-001 through FR-018 (Game Management)
 */

'use client'

import { supabase } from '@/lib/supabase/client'
import { selectQuestions, recordQuestionUsage } from '@/lib/game/question-selection'
import { generateGameCode } from '@/lib/utils/game-code'
import type { CreateGameRequest, CreateGameResponse } from '@/types/api.types'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type GameInsert = Database['public']['Tables']['games']['Insert']
type GameUpdate = Database['public']['Tables']['games']['Update']

// ============================================================================
// Game Creation (FR-001 through FR-009)
// ============================================================================

export interface CreateGameResult {
  game: Game | null
  gameCode: string | null
  availableQuestions: number
  warning?: string
  error: Error | null
}

/**
 * Create a new game with selected questions
 * Implements FR-001 through FR-009
 */
export async function createGame(
  config: CreateGameRequest
): Promise<CreateGameResult> {
  try {
    // Get current user (must be host)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        game: null,
        gameCode: null,
        availableQuestions: 0,
        error: new Error('You must be logged in as a host to create a game'),
      }
    }

    // Calculate total questions needed
    const totalQuestions = config.num_rounds * config.questions_per_round

    // Collect all categories from rounds
    const allCategories = config.rounds.flatMap((r) => r.categories)
    const uniqueCategories = [...new Set(allCategories)]

    // Select questions using utility (implements FR-006, FR-007, FR-007a)
    const questionResult = await selectQuestions(
      user.id,
      uniqueCategories,
      totalQuestions
    )

    if (questionResult.questions.length < totalQuestions) {
      return {
        game: null,
        gameCode: null,
        availableQuestions: questionResult.available_in_selected_categories,
        warning: questionResult.warning,
        error: new Error(
          `Only ${questionResult.questions.length} questions available (requested ${totalQuestions})`
        ),
      }
    }

    // Generate unique game code
    let gameCode = generateGameCode()
    let attempts = 0

    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('games')
        .select('id')
        .eq('game_code', gameCode)
        .maybeSingle()

      if (!existing) break

      gameCode = generateGameCode()
      attempts++
    }

    if (attempts >= 10) {
      return {
        game: null,
        gameCode: null,
        availableQuestions: questionResult.available_in_selected_categories,
        error: new Error('Failed to generate unique game code'),
      }
    }

    // Create game record
    const gameData: GameInsert = {
      host_id: user.id,
      game_code: gameCode,
      name: config.name,
      venue_name: config.venue_name,
      venue_location: config.venue_location,
      scheduled_at: config.scheduled_at,
      status: 'setup',
      num_rounds: config.num_rounds,
      questions_per_round: config.questions_per_round,
      time_limit_seconds: config.time_limit_seconds,
      min_players_per_team: config.min_players_per_team,
      max_players_per_team: config.max_players_per_team,
      sound_effects_enabled: config.sound_effects_enabled,
      current_question_index: 0,
    }

    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single()

    if (gameError || !game) {
      console.error('Failed to create game:', gameError)
      return {
        game: null,
        gameCode: null,
        availableQuestions: questionResult.available_in_selected_categories,
        error: new Error('Failed to create game'),
      }
    }

    // Create rounds
    const roundInserts = config.rounds.map((round) => ({
      game_id: game.id,
      round_number: round.round_number,
      categories: round.categories,
    }))

    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .insert(roundInserts)
      .select()

    if (roundsError || !rounds) {
      console.error('Failed to create rounds:', roundsError)
      // Cleanup: delete the game
      await supabase.from('games').delete().eq('id', game.id)
      return {
        game: null,
        gameCode: null,
        availableQuestions: questionResult.available_in_selected_categories,
        error: new Error('Failed to create rounds'),
      }
    }

    // Create game questions with randomization seeds
    const gameQuestionsInserts = questionResult.questions.map((question, index) => {
      const roundIndex = Math.floor(index / config.questions_per_round)
      const round = rounds[roundIndex]

      return {
        game_id: game.id,
        round_id: round.id,
        question_id: question.id,
        display_order: index,
        randomization_seed: Math.floor(Math.random() * 1000000), // Seeded random for consistent shuffling
      }
    })

    const { error: questionsError } = await supabase
      .from('game_questions')
      .insert(gameQuestionsInserts)

    if (questionsError) {
      console.error('Failed to create game questions:', questionsError)
      // Cleanup: delete the game (cascades to rounds)
      await supabase.from('games').delete().eq('id', game.id)
      return {
        game: null,
        gameCode: null,
        availableQuestions: questionResult.available_in_selected_categories,
        error: new Error('Failed to create game questions'),
      }
    }

    // Record question usage (implements FR-006)
    const questionIds = questionResult.questions.map((q) => q.id)
    await recordQuestionUsage(user.id, game.id, questionIds)

    return {
      game,
      gameCode,
      availableQuestions: questionResult.available_in_selected_categories,
      warning: questionResult.warning,
      error: null,
    }
  } catch (error) {
    console.error('Unexpected error in createGame:', error)
    return {
      game: null,
      gameCode: null,
      availableQuestions: 0,
      error: error as Error,
    }
  }
}

// ============================================================================
// Game Retrieval
// ============================================================================

/**
 * Get game by ID with full details
 */
export async function getGame(gameId: string) {

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(
      `
      *,
      rounds (
        id,
        round_number,
        categories
      )
    `
    )
    .eq('id', gameId)
    .single()

  if (gameError) {
    return { game: null, error: gameError }
  }

  return { game, error: null }
}

/**
 * Find game by game code (for players joining)
 */
export async function findGameByCode(gameCode: string) {

  const { data: game, error } = await supabase
    .from('games')
    .select('id, name, venue_name, status')
    .eq('game_code', gameCode.toUpperCase())
    .single()

  if (error) {
    return { game: null, error }
  }

  return { game, error: null }
}

/**
 * Get games for current host
 */
export async function getHostGames() {

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { games: [], error: new Error('Not authenticated') }
  }

  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  return { games: games || [], error }
}

// ============================================================================
// Game Updates (FR-010)
// ============================================================================

/**
 * Update game configuration (only in 'setup' status)
 */
export async function updateGame(gameId: string, updates: Partial<CreateGameRequest>) {

  const { data: game, error } = await supabase
    .from('games')
    .update({
      name: updates.name,
      venue_name: updates.venue_name,
      venue_location: updates.venue_location,
      scheduled_at: updates.scheduled_at,
      time_limit_seconds: updates.time_limit_seconds,
      sound_effects_enabled: updates.sound_effects_enabled,
    })
    .eq('id', gameId)
    .eq('status', 'setup') // Can only update in setup mode
    .select()
    .single()

  return { game, error }
}

// ============================================================================
// Game Control (FR-011 through FR-018)
// ============================================================================

/**
 * Start game (FR-011)
 * Changes status from 'setup' to 'active'
 */
export async function startGame(gameId: string) {

  const { data: game, error } = await supabase
    .from('games')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .eq('status', 'setup')
    .select()
    .single()

  return { game, error }
}

/**
 * Pause game (FR-012)
 */
export async function pauseGame(gameId: string) {

  const { data: game, error } = await supabase
    .from('games')
    .update({ status: 'paused' })
    .eq('id', gameId)
    .eq('status', 'active')
    .select()
    .single()

  return { game, error }
}

/**
 * Resume game (FR-013)
 */
export async function resumeGame(gameId: string) {

  const { data: game, error } = await supabase
    .from('games')
    .update({ status: 'active' })
    .eq('id', gameId)
    .eq('status', 'paused')
    .select()
    .single()

  return { game, error }
}

/**
 * Advance to next question (FR-014)
 */
export async function advanceQuestion(gameId: string) {

  // Get current game state
  const { data: game } = await supabase
    .from('games')
    .select('current_question_index, questions_per_round, num_rounds')
    .eq('id', gameId)
    .single()

  if (!game) {
    return { game: null, error: new Error('Game not found') }
  }

  const totalQuestions = game.num_rounds * game.questions_per_round
  const nextIndex = game.current_question_index + 1

  if (nextIndex >= totalQuestions) {
    return { game: null, error: new Error('No more questions') }
  }

  const { data: updatedGame, error } = await supabase
    .from('games')
    .update({ current_question_index: nextIndex })
    .eq('id', gameId)
    .select()
    .single()

  return { game: updatedGame, error }
}

/**
 * Reveal answer for current question (FR-015)
 */
export async function revealAnswer(gameId: string) {

  // Get current question
  const { data: game } = await supabase
    .from('games')
    .select('current_question_index')
    .eq('id', gameId)
    .single()

  if (!game) {
    return { error: new Error('Game not found') }
  }

  // Mark question as revealed
  const { data: gameQuestion, error } = await supabase
    .from('game_questions')
    .update({ revealed_at: new Date().toISOString() })
    .eq('game_id', gameId)
    .eq('display_order', game.current_question_index)
    .select()
    .single()

  return { gameQuestion, error }
}

/**
 * Navigate to specific question (FR-016)
 */
export async function navigateToQuestion(gameId: string, targetIndex: number) {

  const { data: game, error } = await supabase
    .from('games')
    .update({ current_question_index: targetIndex })
    .eq('id', gameId)
    .select()
    .single()

  return { game, error }
}

/**
 * End game (FR-017, FR-018)
 */
export async function endGame(gameId: string) {

  const { data: game, error } = await supabase
    .from('games')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', gameId)
    .select()
    .single()

  // Refresh game history materialized view
  if (game) {
    await supabase.rpc('refresh_game_history', { p_game_id: gameId })
  }

  return { game, error }
}

/**
 * Get current question for game
 */
export async function getCurrentQuestion(gameId: string) {

  const { data: game } = await supabase
    .from('games')
    .select('current_question_index')
    .eq('id', gameId)
    .single()

  if (!game) {
    return { question: null, error: new Error('Game not found') }
  }

  const { data: gameQuestion, error } = await supabase
    .from('game_questions')
    .select(
      `
      *,
      question:questions (
        id,
        category,
        question,
        a,
        b,
        c,
        d
      )
    `
    )
    .eq('game_id', gameId)
    .eq('display_order', game.current_question_index)
    .single()

  return { question: gameQuestion, error }
}

// ============================================================================
// Answer Submission (FR-043)
// ============================================================================

export interface SubmitAnswerRequest {
  gameQuestionId: string
  teamId: string
  selectedAnswer: 'a' | 'b' | 'c' | 'd'
  answerTimeMs: number
}

export interface SubmitAnswerResult {
  submission: any | null
  isCorrect: boolean
  error: Error | null
}

/**
 * Submit answer for current question
 * First submission from any team member locks the answer (FR-043)
 * Returns 409 error if team has already answered
 */
export async function submitAnswer(
  request: SubmitAnswerRequest
): Promise<SubmitAnswerResult> {
  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        submission: null,
        isCorrect: false,
        error: new Error('You must be logged in to submit an answer'),
      }
    }

    // Determine if answer is correct (in DB, 'a' is always correct)
    const isCorrect = request.selectedAnswer === 'a'

    // Insert answer submission
    const { data: submission, error } = await supabase
      .from('answer_submissions')
      .insert({
        game_question_id: request.gameQuestionId,
        team_id: request.teamId,
        submitted_by: user.id,
        selected_answer: request.selectedAnswer,
        is_correct: isCorrect,
        answer_time_ms: request.answerTimeMs,
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation (team already answered)
      if (error.code === '23505') {
        return {
          submission: null,
          isCorrect: false,
          error: new Error('Your team has already answered this question'),
        }
      }

      console.error('Failed to submit answer:', error)
      return {
        submission: null,
        isCorrect: false,
        error: new Error('Failed to submit answer'),
      }
    }

    return {
      submission,
      isCorrect,
      error: null,
    }
  } catch (error) {
    console.error('Unexpected error in submitAnswer:', error)
    return {
      submission: null,
      isCorrect: false,
      error: error as Error,
    }
  }
}