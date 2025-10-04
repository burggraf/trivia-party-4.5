/**
 * Scoring Utility
 *
 * Calculates team scores with tie-breaking logic (FR-082).
 * Tie-breaking uses cumulative_answer_time_ms (lower is better).
 */

import type { AnswerSubmission, Team, TeamScore } from '@/types/game.types'

/**
 * Calculates final scores for all teams with rankings
 *
 * @param teams - Array of team objects with scores
 * @returns Sorted array of team scores with rankings (1st, 2nd, 3rd, etc.)
 *
 * Sorting rules:
 * 1. Higher score wins
 * 2. If tied on score, lower cumulative_answer_time_ms wins (FR-082)
 */
export function calculateScores(teams: Team[]): TeamScore[] {
  // Sort teams by score DESC, then by cumulative time ASC
  const sorted = [...teams].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score // Higher score first
    }
    // Tie-breaking: lower cumulative time wins
    return a.cumulative_answer_time_ms - b.cumulative_answer_time_ms
  })

  // Assign ranks (handle ties at same rank)
  let currentRank = 1
  let previousScore = -1
  let previousTime = -1

  return sorted.map((team, index) => {
    // Only increment rank if score or time is different
    if (
      team.score !== previousScore ||
      team.cumulative_answer_time_ms !== previousTime
    ) {
      currentRank = index + 1
    }

    previousScore = team.score
    previousTime = team.cumulative_answer_time_ms

    return {
      team_id: team.id,
      team_name: team.team_name,
      score: team.score,
      rank: currentRank,
      cumulative_answer_time_ms: team.cumulative_answer_time_ms,
    }
  })
}

/**
 * Updates team score and cumulative time after answer submission
 *
 * @param currentScore - Current team score
 * @param currentCumulativeTime - Current cumulative answer time in ms
 * @param submission - New answer submission
 * @returns Updated score and cumulative time
 */
export function updateTeamScoreFromSubmission(
  currentScore: number,
  currentCumulativeTime: number,
  submission: AnswerSubmission
): { score: number; cumulative_answer_time_ms: number } {
  return {
    score: currentScore + (submission.is_correct ? 1 : 0),
    cumulative_answer_time_ms: currentCumulativeTime + submission.answer_time_ms,
  }
}

/**
 * Calculates accuracy percentage for a team
 *
 * @param correctAnswers - Number of correct answers
 * @param totalAnswers - Total number of answers submitted
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(
  correctAnswers: number,
  totalAnswers: number
): number {
  if (totalAnswers === 0) return 0
  return Math.round((correctAnswers / totalAnswers) * 100 * 100) / 100
}

/**
 * Formats cumulative time for display
 *
 * @param milliseconds - Time in milliseconds
 * @returns Formatted string (e.g., "45.2s" or "1m 23.4s")
 */
export function formatCumulativeTime(milliseconds: number): string {
  const seconds = milliseconds / 1000

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}m ${remainingSeconds.toFixed(1)}s`
}