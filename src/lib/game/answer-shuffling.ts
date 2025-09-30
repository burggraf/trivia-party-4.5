/**
 * Answer Shuffling Utility
 *
 * Implements deterministic answer shuffling using seeded randomization (FR-037).
 * Ensures all clients (host preview, players, TV displays) see identical answer order.
 *
 * Algorithm: Fisher-Yates shuffle with seeded PRNG using seedrandom library
 */

import seedrandom from 'seedrandom'
import type { Answer } from '@/types/game.types'

/**
 * Shuffles answers deterministically using a seed
 *
 * @param answers - Array of answer objects to shuffle
 * @param seed - Randomization seed (stored in game_questions.randomization_seed)
 * @returns Shuffled array of answers (same seed = same order)
 *
 * @example
 * const answers = [
 *   { letter: 'a', text: 'Paris', is_correct: true },
 *   { letter: 'b', text: 'London' },
 *   { letter: 'c', text: 'Berlin' },
 *   { letter: 'd', text: 'Madrid' }
 * ]
 * const shuffled = shuffleAnswers(answers, 123456)
 * // Same seed always produces same shuffle order
 */
export function shuffleAnswers(answers: Answer[], seed: number): Answer[] {
  // Create seeded random number generator
  const rng = seedrandom(seed.toString())

  // Clone array to avoid mutating original
  const shuffled = [...answers]

  // Fisher-Yates shuffle algorithm with seeded RNG
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

/**
 * Converts question answers from database format to Answer objects
 *
 * @param question - Question object from database with a, b, c, d fields
 * @param correctAnswerLetter - Which answer is correct ('a' by default)
 * @returns Array of Answer objects
 */
export function answersFromQuestion(
  question: { a: string; b: string; c: string; d: string },
  correctAnswerLetter: 'a' | 'b' | 'c' | 'd' = 'a'
): Answer[] {
  return [
    { letter: 'a', text: question.a, is_correct: correctAnswerLetter === 'a' },
    { letter: 'b', text: question.b, is_correct: correctAnswerLetter === 'b' },
    { letter: 'c', text: question.c, is_correct: correctAnswerLetter === 'c' },
    { letter: 'd', text: question.d, is_correct: correctAnswerLetter === 'd' },
  ]
}

/**
 * Gets shuffled answers for display (without revealing correct answer)
 *
 * @param question - Question object from database
 * @param seed - Randomization seed
 * @param revealCorrect - Whether to include is_correct flag (default: false)
 * @returns Shuffled answers for display
 */
export function getShuffledAnswersForDisplay(
  question: { a: string; b: string; c: string; d: string },
  seed: number,
  revealCorrect: boolean = false
): Answer[] {
  const answers = answersFromQuestion(question, 'a')
  const shuffled = shuffleAnswers(answers, seed)

  // Remove is_correct flag unless revealing
  if (!revealCorrect) {
    return shuffled.map(({ letter, text }) => ({ letter, text }))
  }

  return shuffled
}