import { describe, it, expect, beforeEach, vi } from 'vitest'
import { selectQuestions } from '@/lib/game/question-selection'
import { supabase } from '@/lib/supabase/client'

/**
 * T067: Unit test for Question selection utility
 *
 * Tests:
 * - Reuse prevention across all host's games (FR-006)
 * - Category exhaustion handling (FR-007)
 * - Auto-supplementation from all categories (FR-007a, FR-008)
 */

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Question Selection', () => {
  const mockHostId = 'host-123'
  const mockCategories = ['Sports', 'History']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should select questions excluding previously used ones', async () => {
    // Mock question_usage query (host has used 5 questions)
    const mockUsedQuestions = [
      { question_id: 'q1' },
      { question_id: 'q2' },
      { question_id: 'q3' },
      { question_id: 'q4' },
      { question_id: 'q5' },
    ]

    // Mock available questions query (excluding used ones)
    const mockAvailableQuestions = [
      { id: 'q6', category: 'Sports', question_text: 'Question 6' },
      { id: 'q7', category: 'History', question_text: 'Question 7' },
      { id: 'q8', category: 'Sports', question_text: 'Question 8' },
      { id: 'q9', category: 'History', question_text: 'Question 9' },
      { id: 'q10', category: 'Sports', question_text: 'Question 10' },
    ]

    // Setup mocks
    const fromMock = vi.fn()
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const inMock = vi.fn()
    const notMock = vi.fn()
    const limitMock = vi.fn()

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'question_usage') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockUsedQuestions, error: null }),
          }),
        } as any
      }
      if (table === 'questions') {
        return {
          select: () => ({
            in: () => ({
              not: () => ({
                limit: () => Promise.resolve({ data: mockAvailableQuestions, error: null }),
              }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    // Execute test
    const result = await selectQuestions({
      hostId: mockHostId,
      categories: mockCategories,
      count: 5,
    })

    // Verify results
    expect(result.error).toBeNull()
    expect(result.questions).toHaveLength(5)

    // Verify none of the returned questions are in the used list
    const usedIds = mockUsedQuestions.map((q) => q.question_id)
    result.questions.forEach((q) => {
      expect(usedIds).not.toContain(q.id)
    })
  })

  it('should auto-supplement from all categories when selected categories exhausted', async () => {
    // Mock: Only 3 questions available in Sports + History
    const mockUsedQuestions = []
    const mockCategoryQuestions = [
      { id: 'q1', category: 'Sports', question_text: 'Question 1' },
      { id: 'q2', category: 'History', question_text: 'Question 2' },
      { id: 'q3', category: 'Sports', question_text: 'Question 3' },
    ]

    // Mock: 2 additional questions from other categories
    const mockSupplementQuestions = [
      { id: 'q4', category: 'Science', question_text: 'Question 4' },
      { id: 'q5', category: 'Geography', question_text: 'Question 5' },
    ]

    let queryCount = 0
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'question_usage') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockUsedQuestions, error: null }),
          }),
        } as any
      }
      if (table === 'questions') {
        queryCount++
        if (queryCount === 1) {
          // First query: selected categories (Sports + History)
          return {
            select: () => ({
              in: () => ({
                limit: () => Promise.resolve({ data: mockCategoryQuestions, error: null }),
              }),
            }),
          } as any
        } else {
          // Second query: supplement from all other categories
          return {
            select: () => ({
              not: () => ({
                limit: () => Promise.resolve({ data: mockSupplementQuestions, error: null }),
              }),
            }),
          } as any
        }
      }
      return {} as any
    })

    // Request 5 questions but only 3 available in selected categories
    const result = await selectQuestions({
      hostId: mockHostId,
      categories: mockCategories,
      count: 5,
    })

    // Verify auto-supplementation (FR-007a, FR-008)
    expect(result.error).toBeNull()
    expect(result.questions).toHaveLength(5)

    // Verify includes questions from both selected and supplemental categories
    const categories = result.questions.map((q) => q.category)
    expect(categories).toContain('Sports')
    expect(categories).toContain('History')
    expect(categories).toContain('Science')
    expect(categories).toContain('Geography')
  })

  it('should handle case when no questions available', async () => {
    // Mock: All questions have been used
    const mockUsedQuestions = Array.from({ length: 100 }, (_, i) => ({
      question_id: `q${i}`,
    }))

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'question_usage') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockUsedQuestions, error: null }),
          }),
        } as any
      }
      if (table === 'questions') {
        return {
          select: () => ({
            in: () => ({
              not: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
        } as any
      }
      return {} as any
    })

    const result = await selectQuestions({
      hostId: mockHostId,
      categories: mockCategories,
      count: 10,
    })

    // Should return empty array when no questions available
    expect(result.questions).toHaveLength(0)
    expect(result.error).toBeNull()
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error
    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: new Error('Database error') }),
        }),
      } as any
    })

    const result = await selectQuestions({
      hostId: mockHostId,
      categories: mockCategories,
      count: 5,
    })

    // Should return error
    expect(result.error).not.toBeNull()
    expect(result.questions).toEqual([])
  })

  it('should verify question_usage table prevents reuse across ALL host games', async () => {
    // This test verifies FR-006: reuse prevention across ALL games, not just current game

    const mockUsedQuestions = [
      { question_id: 'q1', game_id: 'game-1' },
      { question_id: 'q2', game_id: 'game-1' },
      { question_id: 'q3', game_id: 'game-2' }, // From different game
      { question_id: 'q4', game_id: 'game-2' },
      { question_id: 'q5', game_id: 'game-3' }, // From third game
    ]

    // All questions from ALL games should be excluded
    const usedIds = mockUsedQuestions.map((q) => q.question_id)

    // Mock implementation to verify exclusion works across games
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'question_usage') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockUsedQuestions, error: null }),
          }),
        } as any
      }
      if (table === 'questions') {
        return {
          select: () => ({
            in: () => ({
              not: (field: string, operator: string, value: string) => {
                // Verify that all used question IDs are excluded
                usedIds.forEach((id) => {
                  expect(value).toContain(id)
                })

                return {
                  limit: () =>
                    Promise.resolve({
                      data: [{ id: 'q6', category: 'Sports', question_text: 'New question' }],
                      error: null,
                    }),
                }
              },
            }),
          }),
        } as any
      }
      return {} as any
    })

    const result = await selectQuestions({
      hostId: mockHostId,
      categories: mockCategories,
      count: 1,
    })

    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].id).not.toContain('q1')
    expect(result.questions[0].id).not.toContain('q2')
    expect(result.questions[0].id).not.toContain('q3')
    expect(result.questions[0].id).not.toContain('q4')
    expect(result.questions[0].id).not.toContain('q5')
  })
})
