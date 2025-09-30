/**
 * Question Service - Client-Side
 *
 * Handles question and answer submission operations using Supabase browser client.
 * Implements FR-036 through FR-050 (Question Display & Answer Submission)
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { shuffleAnswers } from '@/lib/game/answer-shuffling'
import type { Database } from '@/types/database.types'
import type { SubmitAnswerRequest } from '@/types/api.types'

type GameQuestion = Database['public']['Tables']['game_questions']['Row']
type AnswerSubmission = Database['public']['Tables']['answer_submissions']['Row']

export interface QuestionWithAnswers {
  id: string
  gameQuestionId: string
  displayOrder: number
  category: string
  questionText: string
  answers: Array<{
    letter: 'a' | 'b' | 'c' | 'd'
    text: string
  }>
  randomizationSeed: number
  revealedAt: string | null
  correctAnswer?: 'a' | 'b' | 'c' | 'd' // Only included after reveal
}

// ============================================================================
// Question Display (FR-036 through FR-041)
// ============================================================================

/**
 * Get current question for game (for players and TV)
 * Implements FR-037 (consistent answer order via seeded shuffle)
 */
export async function getCurrentQuestion(gameId: string): Promise<{
  question: QuestionWithAnswers | null
  error: Error | null
}> {
  const supabase = createClient()

  try {
    // Get game's current question index
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('current_question_index')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return {
        question: null,
        error: new Error('Game not found'),
      }
    }

    // Get the game question with question details
    const { data: gameQuestion, error: questionError } = await supabase
      .from('game_questions')
      .select(
        `
        *,
        questions (
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

    if (questionError || !gameQuestion || !gameQuestion.questions) {
      return {
        question: null,
        error: new Error('Question not found'),
      }
    }

    const q = gameQuestion.questions

    // Shuffle answers using stored seed (FR-037)
    const shuffledAnswers = shuffleAnswers(
      [
        { letter: 'a' as const, text: q.a || '' },
        { letter: 'b' as const, text: q.b || '' },
        { letter: 'c' as const, text: q.c || '' },
        { letter: 'd' as const, text: q.d || '' },
      ],
      gameQuestion.randomization_seed
    )

    const question: QuestionWithAnswers = {
      id: q.id,
      gameQuestionId: gameQuestion.id,
      displayOrder: gameQuestion.display_order,
      category: q.category,
      questionText: q.question,
      answers: shuffledAnswers,
      randomizationSeed: gameQuestion.randomization_seed,
      revealedAt: gameQuestion.revealed_at,
    }

    // Include correct answer if revealed
    if (gameQuestion.revealed_at) {
      question.correctAnswer = 'a' // In database, 'a' is always correct
    }

    return { question, error: null }
  } catch (error) {
    console.error('Error fetching current question:', error)
    return {
      question: null,
      error: error as Error,
    }
  }
}

/**
 * Get question by game question ID
 */
export async function getQuestion(gameQuestionId: string): Promise<{
  question: QuestionWithAnswers | null
  error: Error | null
}> {
  const supabase = createClient()

  try {
    const { data: gameQuestion, error: questionError } = await supabase
      .from('game_questions')
      .select(
        `
        *,
        questions (
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
      .eq('id', gameQuestionId)
      .single()

    if (questionError || !gameQuestion || !gameQuestion.questions) {
      return {
        question: null,
        error: new Error('Question not found'),
      }
    }

    const q = gameQuestion.questions

    // Shuffle answers using stored seed
    const shuffledAnswers = shuffleAnswers(
      [
        { letter: 'a' as const, text: q.a || '' },
        { letter: 'b' as const, text: q.b || '' },
        { letter: 'c' as const, text: q.c || '' },
        { letter: 'd' as const, text: q.d || '' },
      ],
      gameQuestion.randomization_seed
    )

    const question: QuestionWithAnswers = {
      id: q.id,
      gameQuestionId: gameQuestion.id,
      displayOrder: gameQuestion.display_order,
      category: q.category,
      questionText: q.question,
      answers: shuffledAnswers,
      randomizationSeed: gameQuestion.randomization_seed,
      revealedAt: gameQuestion.revealed_at,
    }

    // Include correct answer if revealed
    if (gameQuestion.revealed_at) {
      question.correctAnswer = 'a'
    }

    return { question, error: null }
  } catch (error) {
    console.error('Error fetching question:', error)
    return {
      question: null,
      error: error as Error,
    }
  }
}

// ============================================================================
// Answer Submission (FR-042 through FR-050)
// ============================================================================

/**
 * Submit answer for a question
 * Implements FR-043 (first answer wins), FR-044 (duplicate prevention)
 */
export async function submitAnswer(
  gameQuestionId: string,
  teamId: string,
  answer: SubmitAnswerRequest
): Promise<{
  submission: AnswerSubmission | null
  isCorrect: boolean
  error: Error | null
}> {
  const supabase = createClient()

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

    // Verify user is on this team
    const { data: membership, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('player_id', user.id)
      .single()

    if (memberError || !membership) {
      return {
        submission: null,
        isCorrect: false,
        error: new Error('You are not a member of this team'),
      }
    }

    // Check if answer is correct (in database, 'a' is always correct)
    const isCorrect = answer.selected_answer === 'a'

    // Submit answer
    // Database has UNIQUE constraint on (game_question_id, team_id)
    // so duplicate submissions will fail (FR-043, FR-044)
    const { data: submission, error: submitError } = await supabase
      .from('answer_submissions')
      .insert({
        game_question_id: gameQuestionId,
        team_id: teamId,
        selected_answer: answer.selected_answer,
        answer_time_ms: answer.answer_time_ms,
        submitted_by: user.id,
        is_correct: isCorrect,
      })
      .select()
      .single()

    if (submitError) {
      // Check if it's a duplicate submission error
      if (submitError.message.includes('duplicate')) {
        return {
          submission: null,
          isCorrect: false,
          error: new Error('Your team has already answered this question'),
        }
      }

      console.error('Failed to submit answer:', submitError)
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

/**
 * Get all answer submissions for a question
 */
export async function getAnswerSubmissions(gameQuestionId: string) {
  const supabase = createClient()

  const { data: submissions, error } = await supabase
    .from('answer_submissions')
    .select(
      `
      *,
      teams (
        id,
        team_name
      )
    `
    )
    .eq('game_question_id', gameQuestionId)
    .order('submitted_at', { ascending: true })

  return { submissions: submissions || [], error }
}

/**
 * Get team's answer for a question
 */
export async function getTeamAnswer(gameQuestionId: string, teamId: string) {
  const supabase = createClient()

  const { data: submission, error } = await supabase
    .from('answer_submissions')
    .select('*')
    .eq('game_question_id', gameQuestionId)
    .eq('team_id', teamId)
    .single()

  return { submission, error }
}

/**
 * Check if team has answered a question
 */
export async function hasTeamAnswered(
  gameQuestionId: string,
  teamId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('answer_submissions')
    .select('id')
    .eq('game_question_id', gameQuestionId)
    .eq('team_id', teamId)
    .single()

  return !error && !!data
}

/**
 * Get count of teams that have answered
 */
export async function getAnswerCount(gameQuestionId: string): Promise<number> {
  const supabase = createClient()

  const { count } = await supabase
    .from('answer_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('game_question_id', gameQuestionId)

  return count || 0
}

/**
 * Get question results (after reveal)
 */
export async function getQuestionResults(gameQuestionId: string) {
  const supabase = createClient()

  // Get all submissions
  const { data: submissions, error } = await supabase
    .from('answer_submissions')
    .select(
      `
      *,
      teams (
        id,
        team_name
      )
    `
    )
    .eq('game_question_id', gameQuestionId)
    .order('answer_time_ms', { ascending: true })

  if (error) {
    return { results: null, error }
  }

  // Calculate statistics
  const totalSubmissions = submissions.length
  const correctSubmissions = submissions.filter((s) => s.is_correct).length
  const incorrectSubmissions = totalSubmissions - correctSubmissions

  const results = {
    totalSubmissions,
    correctSubmissions,
    incorrectSubmissions,
    correctPercentage:
      totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : 0,
    submissions,
  }

  return { results, error: null }
}