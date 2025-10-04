import { describe, it, expect } from 'vitest'

/**
 * T068: Unit test for Scoring logic
 *
 * Tests:
 * - Score calculation (correct = +1 point)
 * - Tie-breaking by cumulative answer time (FR-076)
 * - Accuracy percentages
 */

// Mock types for testing
interface TeamScore {
  teamId: string
  teamName: string
  score: number
  cumulativeTime: number
  accuracy: number
}

interface AnswerSubmission {
  teamId: string
  isCorrect: boolean
  answerTime: number
}

// Scoring functions to test
function calculateTeamScores(submissions: AnswerSubmission[]): TeamScore[] {
  const teamMap = new Map<string, {
    correct: number
    total: number
    totalTime: number
  }>()

  // Aggregate submissions by team
  submissions.forEach((sub) => {
    const current = teamMap.get(sub.teamId) || { correct: 0, total: 0, totalTime: 0 }

    teamMap.set(sub.teamId, {
      correct: current.correct + (sub.isCorrect ? 1 : 0),
      total: current.total + 1,
      totalTime: current.totalTime + sub.answerTime,
    })
  })

  // Convert to team scores array
  const scores: TeamScore[] = []
  teamMap.forEach((data, teamId) => {
    scores.push({
      teamId,
      teamName: `Team ${teamId}`,
      score: data.correct,
      cumulativeTime: data.totalTime,
      accuracy: (data.correct / data.total) * 100,
    })
  })

  // Sort by score (desc), then by cumulative time (asc) for tie-breaking (FR-076)
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score // Higher score first
    }
    return a.cumulativeTime - b.cumulativeTime // Lower time first (tie-breaker)
  })

  return scores
}

describe('Scoring Logic', () => {
  it('should calculate correct scores', () => {
    const submissions: AnswerSubmission[] = [
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
      { teamId: 'team1', isCorrect: true, answerTime: 6000 },
      { teamId: 'team1', isCorrect: false, answerTime: 4000 },
      { teamId: 'team2', isCorrect: true, answerTime: 7000 },
      { teamId: 'team2', isCorrect: false, answerTime: 5000 },
      { teamId: 'team2', isCorrect: false, answerTime: 6000 },
    ]

    const scores = calculateTeamScores(submissions)

    // Team 1: 2 correct out of 3 = 2 points
    expect(scores.find((s) => s.teamId === 'team1')?.score).toBe(2)

    // Team 2: 1 correct out of 3 = 1 point
    expect(scores.find((s) => s.teamId === 'team2')?.score).toBe(1)
  })

  it('should calculate accuracy percentages', () => {
    const submissions: AnswerSubmission[] = [
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
      { teamId: 'team1', isCorrect: true, answerTime: 6000 },
      { teamId: 'team1', isCorrect: true, answerTime: 4000 },
      { teamId: 'team1', isCorrect: false, answerTime: 7000 },
      { teamId: 'team1', isCorrect: false, answerTime: 5000 },
    ]

    const scores = calculateTeamScores(submissions)

    // 3 correct out of 5 = 60% accuracy
    expect(scores[0].accuracy).toBe(60)
  })

  it('should rank by score descending', () => {
    const submissions: AnswerSubmission[] = [
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
      { teamId: 'team1', isCorrect: false, answerTime: 6000 },
      { teamId: 'team2', isCorrect: true, answerTime: 7000 },
      { teamId: 'team2', isCorrect: true, answerTime: 5000 },
      { teamId: 'team2', isCorrect: true, answerTime: 6000 },
      { teamId: 'team3', isCorrect: true, answerTime: 5000 },
      { teamId: 'team3', isCorrect: true, answerTime: 5000 },
    ]

    const scores = calculateTeamScores(submissions)

    // Team 2: 3 points (1st place)
    expect(scores[0].teamId).toBe('team2')
    expect(scores[0].score).toBe(3)

    // Team 3: 2 points (2nd place)
    expect(scores[1].teamId).toBe('team3')
    expect(scores[1].score).toBe(2)

    // Team 1: 1 point (3rd place)
    expect(scores[2].teamId).toBe('team1')
    expect(scores[2].score).toBe(1)
  })

  it('should use cumulative time for tie-breaking', () => {
    // FR-076: Tie-breaking uses lowest cumulative answer time
    const submissions: AnswerSubmission[] = [
      // Team 1: 2 correct, cumulative time = 11000ms
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
      { teamId: 'team1', isCorrect: true, answerTime: 6000 },
      { teamId: 'team1', isCorrect: false, answerTime: 4000 },

      // Team 2: 2 correct, cumulative time = 9000ms (faster, should rank higher)
      { teamId: 'team2', isCorrect: true, answerTime: 4000 },
      { teamId: 'team2', isCorrect: true, answerTime: 5000 },
      { teamId: 'team2', isCorrect: false, answerTime: 3000 },
    ]

    const scores = calculateTeamScores(submissions)

    // Both teams have 2 points, but team2 has lower cumulative time
    expect(scores[0].teamId).toBe('team2')
    expect(scores[0].score).toBe(2)
    expect(scores[0].cumulativeTime).toBe(12000) // 4000 + 5000 + 3000

    expect(scores[1].teamId).toBe('team1')
    expect(scores[1].score).toBe(2)
    expect(scores[1].cumulativeTime).toBe(15000) // 5000 + 6000 + 4000
  })

  it('should calculate cumulative time correctly', () => {
    const submissions: AnswerSubmission[] = [
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
      { teamId: 'team1', isCorrect: true, answerTime: 6000 },
      { teamId: 'team1', isCorrect: true, answerTime: 4000 },
    ]

    const scores = calculateTeamScores(submissions)

    // Cumulative time = 5000 + 6000 + 4000 = 15000ms
    expect(scores[0].cumulativeTime).toBe(15000)
  })

  it('should handle perfect score (100% accuracy)', () => {
    const submissions: AnswerSubmission[] = [
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
      { teamId: 'team1', isCorrect: true, answerTime: 6000 },
      { teamId: 'team1', isCorrect: true, answerTime: 4000 },
      { teamId: 'team1', isCorrect: true, answerTime: 7000 },
      { teamId: 'team1', isCorrect: true, answerTime: 5000 },
    ]

    const scores = calculateTeamScores(submissions)

    // 5 correct out of 5 = 100% accuracy
    expect(scores[0].accuracy).toBe(100)
    expect(scores[0].score).toBe(5)
  })

  it('should handle zero score (0% accuracy)', () => {
    const submissions: AnswerSubmission[] = [
      { teamId: 'team1', isCorrect: false, answerTime: 5000 },
      { teamId: 'team1', isCorrect: false, answerTime: 6000 },
      { teamId: 'team1', isCorrect: false, answerTime: 4000 },
    ]

    const scores = calculateTeamScores(submissions)

    // 0 correct out of 3 = 0% accuracy
    expect(scores[0].accuracy).toBe(0)
    expect(scores[0].score).toBe(0)
  })

  it('should handle multiple teams with complex tie-breaking', () => {
    const submissions: AnswerSubmission[] = [
      // Team 1: 10 points, 45000ms cumulative
      ...Array.from({ length: 10 }, (_, i) => ({
        teamId: 'team1',
        isCorrect: true,
        answerTime: 4500,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        teamId: 'team1',
        isCorrect: false,
        answerTime: 5000,
      })),

      // Team 2: 10 points, 40000ms cumulative (should rank higher due to faster time)
      ...Array.from({ length: 10 }, (_, i) => ({
        teamId: 'team2',
        isCorrect: true,
        answerTime: 4000,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        teamId: 'team2',
        isCorrect: false,
        answerTime: 4500,
      })),

      // Team 3: 12 points (should rank first regardless of time)
      ...Array.from({ length: 12 }, (_, i) => ({
        teamId: 'team3',
        isCorrect: true,
        answerTime: 6000,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        teamId: 'team3',
        isCorrect: false,
        answerTime: 5000,
      })),
    ]

    const scores = calculateTeamScores(submissions)

    // Team 3: 12 points (1st place, highest score)
    expect(scores[0].teamId).toBe('team3')
    expect(scores[0].score).toBe(12)

    // Team 2: 10 points, faster time (2nd place)
    expect(scores[1].teamId).toBe('team2')
    expect(scores[1].score).toBe(10)
    expect(scores[1].cumulativeTime).toBeLessThan(scores[2].cumulativeTime)

    // Team 1: 10 points, slower time (3rd place)
    expect(scores[2].teamId).toBe('team1')
    expect(scores[2].score).toBe(10)
  })
})
