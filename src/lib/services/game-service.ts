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
import { createGameChannel, broadcastGameEvent, createTVChannel } from '@/lib/realtime/channels'
import { answersFromQuestion, shuffleAnswers } from '@/lib/game/answer-shuffling'
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
    .select('*')
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

  // Broadcast game_started event
  if (game && !error) {
    try {
      const channel = createGameChannel(gameId)
      await channel.subscribe()
      await broadcastGameEvent(channel, 'game_started', { game })
      await channel.unsubscribe()
    } catch (broadcastError) {
      console.error('Failed to broadcast game_started:', broadcastError)
    }
  }

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

  // Broadcast game_paused event
  if (game && !error) {
    try {
      const channel = createGameChannel(gameId)
      await channel.subscribe()
      await broadcastGameEvent(channel, 'game_paused', { game })
      await channel.unsubscribe()
    } catch (broadcastError) {
      console.error('Failed to broadcast game_paused:', broadcastError)
    }
  }

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

  // Broadcast game_resumed event
  if (game && !error) {
    try {
      const channel = createGameChannel(gameId)
      await channel.subscribe()
      await broadcastGameEvent(channel, 'game_resumed', { game })
      await channel.unsubscribe()
    } catch (broadcastError) {
      console.error('Failed to broadcast game_resumed:', broadcastError)
    }
  }

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

  // Broadcast question_advanced event with new question data
  if (updatedGame && !error) {
    try {
      // Get the new question
      const { question: questionData } = await getCurrentQuestion(gameId)

      const channel = createGameChannel(gameId)
      await channel.subscribe()
      await broadcastGameEvent(channel, 'question_advanced', {
        game: updatedGame,
        question: questionData ? (questionData as any).question : null,
        gameQuestionId: questionData ? (questionData as any).id : null,
      })
      await channel.unsubscribe()
    } catch (broadcastError) {
      console.error('Failed to broadcast question_advanced:', broadcastError)
    }
  }

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

  // Broadcast answer_revealed event
  if (gameQuestion && !error) {
    try {
      const channel = createGameChannel(gameId)
      await channel.subscribe()
      await broadcastGameEvent(channel, 'answer_revealed', {
        game_question_id: gameQuestion.id,
      })
      await channel.unsubscribe()
    } catch (broadcastError) {
      console.error('Failed to broadcast answer_revealed:', broadcastError)
    }
  }

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

  return { game, error }
}

// ============================================================================
// Game State Machine
// ============================================================================

export type GameState =
  | 'setup'
  | 'game_intro'
  | 'round_intro'
  | 'question_active'
  | 'question_revealed'
  | 'round_scores'
  | 'game_complete'
  | 'game_thanks'

export interface AdvanceStateResult {
  game: Game | null
  nextState: GameState | null
  completed: boolean
  error: Error | null
}

/**
 * Advance game state according to state machine flow
 * Handles all state transitions and question advancement
 */
export async function advanceGameState(gameId: string): Promise<AdvanceStateResult> {
  try {
    // Get current game state
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (!game) {
      return {
        game: null,
        nextState: null,
        completed: false,
        error: new Error('Game not found'),
      }
    }

    const currentState = (game.game_state || 'setup') as GameState
    const totalQuestions = game.num_rounds * game.questions_per_round
    const questionsPerRound = game.questions_per_round
    const currentQuestionInRound = game.current_question_index % questionsPerRound
    const isLastQuestionInRound = currentQuestionInRound === questionsPerRound - 1
    const currentRound = Math.floor(game.current_question_index / questionsPerRound) + 1
    const isLastRound = currentRound === game.num_rounds

    let nextState: GameState
    let updates: GameUpdate = {}

    // State machine transitions
    switch (currentState) {
      case 'setup':
        nextState = 'game_intro'
        updates = {
          game_state: nextState,
          status: 'active',
          started_at: new Date().toISOString(),
        }
        break

      case 'game_intro':
        nextState = 'round_intro'
        updates = {
          game_state: nextState,
        }
        break

      case 'round_intro':
        nextState = 'question_active'
        updates = {
          game_state: nextState,
        }
        break

      case 'question_active':
        nextState = 'question_revealed'
        updates = {
          game_state: nextState,
        }
        // Mark current question as revealed
        await supabase
          .from('game_questions')
          .update({ revealed_at: new Date().toISOString() })
          .eq('game_id', gameId)
          .eq('display_order', game.current_question_index)
        break

      case 'question_revealed':
        if (isLastQuestionInRound) {
          nextState = 'round_scores'
          updates = {
            game_state: nextState,
          }
        } else {
          // Advance to next question
          nextState = 'question_active'
          updates = {
            game_state: nextState,
            current_question_index: game.current_question_index + 1,
          }
        }
        break

      case 'round_scores':
        if (isLastRound) {
          nextState = 'game_complete'
          updates = {
            game_state: nextState,
            status: 'completed',
            completed_at: new Date().toISOString(),
          }
        } else {
          // Advance to next round
          nextState = 'round_intro'
          updates = {
            game_state: nextState,
            current_question_index: game.current_question_index + 1,
          }
        }
        break

      case 'game_complete':
        nextState = 'game_thanks'
        updates = {
          game_state: nextState,
        }
        break

      case 'game_thanks':
        // Terminal state - navigation handled by page redirect
        return {
          game,
          nextState: null,
          completed: true,
          error: null,
        }

      default:
        return {
          game: null,
          nextState: null,
          completed: false,
          error: new Error(`Invalid game state: ${currentState}`),
        }
    }

    // Update game with new state
    const { data: updatedGame, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId)
      .select()
      .single()

    if (error || !updatedGame) {
      return {
        game: null,
        nextState: null,
        completed: false,
        error: error || new Error('Failed to update game state'),
      }
    }

    // Broadcast state change event
    try {
      const channel = createGameChannel(gameId)

      // Include question data for question_active state
      let eventPayload: any = {
        game: updatedGame,
        state: nextState,
      }

      if (nextState === 'question_active') {
        const { question: questionData } = await getCurrentQuestion(gameId)
        if (questionData) {
          const gameQuestion = questionData as any
          const q = gameQuestion.question

          // SECURITY: Shuffle answers server-side and only send shuffled array
          // Players receive pre-shuffled answers with NO indication of which is correct
          const answerObjects = answersFromQuestion(q, 'a')
          const shuffledAnswers = shuffleAnswers(answerObjects, gameQuestion.randomization_seed)

          eventPayload.question = {
            id: q.id,
            category: q.category,
            question: q.question,
            // Only send answer TEXT in shuffled order (no letters, no is_correct flags)
            answers: shuffledAnswers.map(a => a.text),
          }
          eventPayload.gameQuestionId = gameQuestion.id
          // Don't send randomization seed to players - it's only needed for server validation
        }
      } else if (nextState === 'question_revealed') {
        // Send correct answer index (0-3) when revealing
        const { question: questionData } = await getCurrentQuestion(gameId)
        if (questionData) {
          const gameQuestion = questionData as any
          const q = gameQuestion.question
          const answerObjects = answersFromQuestion(q, 'a')
          const shuffledAnswers = shuffleAnswers(answerObjects, gameQuestion.randomization_seed)
          const correctIndex = shuffledAnswers.findIndex(a => a.is_correct)

          eventPayload.correctAnswerIndex = correctIndex
        }
      }

      // Broadcast without subscribing - we only need to send, not receive
      await channel.send({
        type: 'broadcast',
        event: 'state_changed',
        payload: eventPayload,
      })
    } catch (broadcastError) {
      console.error('Failed to broadcast state_changed:', broadcastError)
    }

    return {
      game: updatedGame,
      nextState,
      completed: nextState === 'game_complete',
      error: null,
    }
  } catch (error) {
    console.error('Unexpected error in advanceGameState:', error)
    return {
      game: null,
      nextState: null,
      completed: false,
      error: error as Error,
    }
  }
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
  selectedAnswerIndex: number // SECURITY: Submit index (0-3), not letter
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

    // SECURITY: Validate answer index against shuffle seed server-side
    // Get question and randomization seed
    const { data: gameQuestion } = await supabase
      .from('game_questions')
      .select('*, question:questions(*)')
      .eq('id', request.gameQuestionId)
      .single()

    if (!gameQuestion) {
      return {
        submission: null,
        isCorrect: false,
        error: new Error('Question not found'),
      }
    }

    // Shuffle answers using seed to determine correct index
    const q = (gameQuestion.question as any)
    const answerObjects = answersFromQuestion(q, 'a')
    const shuffledAnswers = shuffleAnswers(answerObjects, gameQuestion.randomization_seed)
    const correctIndex = shuffledAnswers.findIndex(a => a.is_correct)

    // Check if submitted index matches correct index
    const isCorrect = request.selectedAnswerIndex === correctIndex

    // Map submitted index back to database letter for storage
    const selectedAnswerLetter = shuffledAnswers[request.selectedAnswerIndex]?.letter || 'a'

    // Insert answer submission
    const { data: submission, error } = await supabase
      .from('answer_submissions')
      .insert({
        game_question_id: request.gameQuestionId,
        team_id: request.teamId,
        submitted_by: user.id,
        selected_answer: selectedAnswerLetter,
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

    // Broadcast answer count update to TV display
    try {
      const gameId = gameQuestion.game_id

      // Get total teams in this game
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('game_id', gameId)

      // Get count of teams that have answered this question
      const { count: teamsAnsweredCount } = await supabase
        .from('answer_submissions')
        .select('team_id', { count: 'exact', head: true })
        .eq('game_question_id', request.gameQuestionId)

      // Broadcast to TV channel
      const tvChannel = createTVChannel(gameId)
      await tvChannel.subscribe()
      await tvChannel.send({
        type: 'broadcast',
        event: 'answer_count_updated',
        payload: {
          teams_answered_count: teamsAnsweredCount || 0,
          total_teams: totalTeams || 0,
        },
      })
      await tvChannel.unsubscribe()
    } catch (broadcastError) {
      // Don't fail the submission if broadcast fails
      console.error('Failed to broadcast answer count update:', broadcastError)
    }

    // Update team score if answer is correct
    if (isCorrect) {
      const { data: team } = await supabase
        .from('teams')
        .select('score, cumulative_answer_time_ms')
        .eq('id', request.teamId)
        .single()

      if (team) {
        await supabase
          .from('teams')
          .update({
            score: team.score + 1,
            cumulative_answer_time_ms: team.cumulative_answer_time_ms + request.answerTimeMs,
          })
          .eq('id', request.teamId)
      }
    } else {
      // Still update cumulative time for wrong answers (for tie-breaking)
      const { data: team } = await supabase
        .from('teams')
        .select('cumulative_answer_time_ms')
        .eq('id', request.teamId)
        .single()

      if (team) {
        await supabase
          .from('teams')
          .update({
            cumulative_answer_time_ms: team.cumulative_answer_time_ms + request.answerTimeMs,
          })
          .eq('id', request.teamId)
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

// ============================================================================
// Question Recycling
// ============================================================================

export interface RecycleQuestionResult {
  gameQuestion: any | null
  newQuestion: any | null
  error: Error | null
}

/**
 * Replace a question in a game with a new one from the same category
 * Maintains reuse prevention by updating question_usage table
 */
export async function recycleQuestion(
  gameId: string,
  gameQuestionId: string
): Promise<RecycleQuestionResult> {
  try {
    // Get current user (must be host)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        gameQuestion: null,
        newQuestion: null,
        error: new Error('You must be logged in as a host'),
      }
    }

    // Get the current game question with its question details
    const { data: gameQuestion, error: gqError } = await supabase
      .from('game_questions')
      .select(`
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
      `)
      .eq('id', gameQuestionId)
      .eq('game_id', gameId)
      .single()

    if (gqError || !gameQuestion) {
      return {
        gameQuestion: null,
        newQuestion: null,
        error: new Error('Question not found'),
      }
    }

    const oldQuestionId = gameQuestion.question_id
    const category = (gameQuestion.question as any).category

    // Select a new question from the same category (excluding used questions)
    const questionResult = await selectQuestions(user.id, [category], 1)

    if (questionResult.questions.length === 0) {
      return {
        gameQuestion: null,
        newQuestion: null,
        error: new Error(`No more unused questions available in category: ${category}`),
      }
    }

    const newQuestion = questionResult.questions[0]

    // Update game_questions with new question (keep same seed for consistency)
    const { data: updatedGameQuestion, error: updateError } = await supabase
      .from('game_questions')
      .update({ question_id: newQuestion.id })
      .eq('id', gameQuestionId)
      .select(`
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
      `)
      .single()

    if (updateError || !updatedGameQuestion) {
      return {
        gameQuestion: null,
        newQuestion: null,
        error: new Error('Failed to update question'),
      }
    }

    // Update question_usage: remove old question, add new question
    // Remove old question from usage
    const { error: deleteUsageError } = await supabase
      .from('question_usage')
      .delete()
      .eq('host_id', user.id)
      .eq('question_id', oldQuestionId)
      .eq('game_id', gameId)

    if (deleteUsageError) {
      console.error('Failed to remove old question from usage:', deleteUsageError)
    }

    // Add new question to usage
    await recordQuestionUsage(user.id, gameId, [newQuestion.id])

    return {
      gameQuestion: updatedGameQuestion,
      newQuestion: updatedGameQuestion.question,
      error: null,
    }
  } catch (error) {
    console.error('Unexpected error in recycleQuestion:', error)
    return {
      gameQuestion: null,
      newQuestion: null,
      error: error as Error,
    }
  }
}

// ============================================================================
// Game Scores (FR-076)
// ============================================================================

export interface TeamScore {
  teamId: string
  teamName: string
  playerCount: number
  score: number
  cumulativeTime: number
  accuracy: number
  rank: number
}

export interface GameScoresResult {
  game: Game | null
  scores: TeamScore[]
  totalQuestions: number
  error: Error | null
}

/**
 * Get final scores for a completed game
 * Teams ranked by score (correct answers), ties broken by cumulative time
 */
export async function getGameScores(gameId: string): Promise<GameScoresResult> {
  try {
    // Get game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return {
        game: null,
        scores: [],
        totalQuestions: 0,
        error: new Error('Game not found'),
      }
    }

    const totalQuestions = game.num_rounds * game.questions_per_round

    // Get teams with member counts
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        score,
        cumulative_answer_time_ms,
        team_members (
          id
        )
      `)
      .eq('game_id', gameId)

    if (teamsError || !teams) {
      return {
        game,
        scores: [],
        totalQuestions,
        error: new Error('Failed to load teams'),
      }
    }

    // Calculate scores and rankings
    const scores: TeamScore[] = teams.map((team: any) => ({
      teamId: team.id,
      teamName: team.team_name,
      playerCount: team.team_members?.length || 0,
      score: team.score,
      cumulativeTime: team.cumulative_answer_time_ms,
      accuracy: totalQuestions > 0 ? Math.round((team.score / totalQuestions) * 100) : 0,
      rank: 0, // Will be set after sorting
    }))

    // Sort by score (descending), then by time (ascending for tie-breaking)
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return a.cumulativeTime - b.cumulativeTime
    })

    // Assign ranks
    scores.forEach((team, index) => {
      team.rank = index + 1
    })

    return {
      game,
      scores,
      totalQuestions,
      error: null,
    }
  } catch (error) {
    console.error('Unexpected error in getGameScores:', error)
    return {
      game: null,
      scores: [],
      totalQuestions: 0,
      error: error as Error,
    }
  }
}