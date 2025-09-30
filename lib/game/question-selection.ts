/**
 * Question Selection Utility
 *
 * Handles question selection from database with reuse prevention (FR-006)
 * and category supplementation (FR-007).
 *
 * Uses Supabase RPC to call Postgres function defined in migration 012.
 */

import { createClient } from '@/lib/supabase/client'
import type { Question } from '@/types/game.types'

export interface QuestionSelectionResult {
  questions: Question[]
  available_in_selected_categories: number
  available_in_all_categories: number
  warning?: string
}

/**
 * Selects questions for a new game, excluding previously used questions
 *
 * @param hostId - UUID of the host
 * @param categories - Array of category names
 * @param count - Number of questions to select
 * @returns Selected questions with availability counts and optional warning
 *
 * Business logic (implemented in Postgres function):
 * - FR-006: Excludes questions in question_usage for this host
 * - FR-007: Auto-supplements from all categories if insufficient
 * - FR-007a: Returns warning if insufficient questions available
 */
export async function selectQuestions(
  hostId: string,
  categories: string[],
  count: number
): Promise<QuestionSelectionResult> {
  const supabase = createClient()

  // First, check available counts
  const { data: counts, error: countError } = await supabase.rpc(
    'count_available_questions',
    {
      p_host_id: hostId,
      p_categories: categories,
    }
  )

  if (countError) {
    throw new Error(`Failed to count available questions: ${countError.message}`)
  }

  const availableInSelected = counts.in_selected_categories
  const availableInAll = counts.in_all_categories

  // Check if we need to warn the host
  let warning: string | undefined

  if (availableInAll < count) {
    warning = `Only ${availableInAll} questions available (requested ${count}). You may see repeated questions soon.`
  } else if (availableInSelected < count) {
    const supplementCount = count - availableInSelected
    warning = `Only ${availableInSelected} questions available in selected categories. Supplemented with ${supplementCount} questions from other categories.`
  }

  // Select the questions
  const { data: questions, error: selectError } = await supabase.rpc(
    'select_questions_for_host',
    {
      p_host_id: hostId,
      p_categories: categories,
      p_count: count,
    }
  )

  if (selectError) {
    throw new Error(`Failed to select questions: ${selectError.message}`)
  }

  // Transform to Question type
  const transformedQuestions: Question[] = questions.map((q: any) => ({
    id: q.question_id,
    category: q.category,
    question: q.question,
    a: q.answer_a,
    b: q.answer_b,
    c: q.answer_c,
    d: q.answer_d,
  }))

  return {
    questions: transformedQuestions,
    available_in_selected_categories: availableInSelected,
    available_in_all_categories: availableInAll,
    warning,
  }
}

/**
 * Records question usage after game creation
 *
 * @param hostId - UUID of the host
 * @param gameId - UUID of the game
 * @param questionIds - Array of question UUIDs used in the game
 */
export async function recordQuestionUsage(
  hostId: string,
  gameId: string,
  questionIds: string[]
): Promise<void> {
  const supabase = createClient()

  const usageRecords = questionIds.map((questionId) => ({
    host_id: hostId,
    question_id: questionId,
    game_id: gameId,
  }))

  const { error } = await supabase.from('question_usage').insert(usageRecords)

  if (error) {
    throw new Error(`Failed to record question usage: ${error.message}`)
  }
}

/**
 * Gets all available categories from the questions table
 *
 * @returns Array of unique category names
 */
export async function getAvailableCategories(): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('category')
    .order('category')

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  // Get unique categories
  const uniqueCategories = [...new Set(data.map((row) => row.category))]

  return uniqueCategories
}