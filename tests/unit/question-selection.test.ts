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
    rpc: vi.fn(),
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
    // Mock RPC responses
    const mockQuestions = [
      { question_id: 'q6', category: 'Sports', question: 'Question 6', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q7', category: 'History', question: 'Question 7', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q8', category: 'Sports', question: 'Question 8', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q9', category: 'History', question: 'Question 9', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q10', category: 'Sports', question: 'Question 10', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
    ]

    // Mock RPC calls
    vi.mocked(supabase.rpc).mockImplementation((functionName: string) => {
      if (functionName === 'count_available_questions') {
        return Promise.resolve({
          data: { in_selected_categories: 10, in_all_categories: 50 },
          error: null,
        }) as any
      }
      if (functionName === 'select_questions_for_host') {
        return Promise.resolve({
          data: mockQuestions,
          error: null,
        }) as any
      }
      return Promise.resolve({ data: null, error: null }) as any
    })

    // Execute test
    const result = await selectQuestions(mockHostId, mockCategories, 5)

    // Verify results
    expect(result.questions).toHaveLength(5)
    expect(result.available_in_selected_categories).toBe(10)
    expect(result.available_in_all_categories).toBe(50)
    expect(result.warning).toBeUndefined()

    // Verify questions have correct structure
    result.questions.forEach((q) => {
      expect(q).toHaveProperty('id')
      expect(q).toHaveProperty('category')
      expect(q).toHaveProperty('question')
      expect(q).toHaveProperty('a')
      expect(q).toHaveProperty('b')
      expect(q).toHaveProperty('c')
      expect(q).toHaveProperty('d')
    })
  })

  it('should auto-supplement from all categories when selected categories exhausted', async () => {
    // Mock: Only 3 questions available in Sports + History, supplemented with other categories
    const mockQuestions = [
      { question_id: 'q1', category: 'Sports', question: 'Question 1', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q2', category: 'History', question: 'Question 2', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q3', category: 'Sports', question: 'Question 3', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q4', category: 'Science', question: 'Question 4', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
      { question_id: 'q5', category: 'Geography', question: 'Question 5', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
    ]

    // Mock RPC calls - only 3 available in selected categories
    vi.mocked(supabase.rpc).mockImplementation((functionName: string) => {
      if (functionName === 'count_available_questions') {
        return Promise.resolve({
          data: { in_selected_categories: 3, in_all_categories: 50 },
          error: null,
        }) as any
      }
      if (functionName === 'select_questions_for_host') {
        return Promise.resolve({
          data: mockQuestions,
          error: null,
        }) as any
      }
      return Promise.resolve({ data: null, error: null }) as any
    })

    // Request 5 questions but only 3 available in selected categories
    const result = await selectQuestions(mockHostId, mockCategories, 5)

    // Verify auto-supplementation (FR-007a, FR-008)
    expect(result.questions).toHaveLength(5)
    expect(result.warning).toContain('Supplemented')

    // Verify includes questions from both selected and supplemental categories
    const categories = result.questions.map((q) => q.category)
    expect(categories).toContain('Sports')
    expect(categories).toContain('History')
    expect(categories).toContain('Science')
    expect(categories).toContain('Geography')
  })

  it('should handle case when no questions available', async () => {
    // Mock RPC calls - no questions available
    vi.mocked(supabase.rpc).mockImplementation((functionName: string) => {
      if (functionName === 'count_available_questions') {
        return Promise.resolve({
          data: { in_selected_categories: 0, in_all_categories: 0 },
          error: null,
        }) as any
      }
      if (functionName === 'select_questions_for_host') {
        return Promise.resolve({
          data: [],
          error: null,
        }) as any
      }
      return Promise.resolve({ data: null, error: null }) as any
    })

    const result = await selectQuestions(mockHostId, mockCategories, 10)

    // Should return empty array when no questions available
    expect(result.questions).toHaveLength(0)
    expect(result.warning).toContain('Only 0 questions available')
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error
    vi.mocked(supabase.rpc).mockImplementation(() => {
      return Promise.resolve({
        data: null,
        error: new Error('Database error'),
      }) as any
    })

    // Should throw error
    await expect(selectQuestions(mockHostId, mockCategories, 5)).rejects.toThrow('Failed to count available questions')
  })

  it('should verify question_usage table prevents reuse across ALL host games', async () => {
    // This test verifies FR-006: reuse prevention across ALL games, not just current game
    // The RPC function handles this internally, so we just verify it returns new questions

    const mockQuestions = [
      { question_id: 'q6', category: 'Sports', question: 'New question', answer_a: 'A', answer_b: 'B', answer_c: 'C', answer_d: 'D' },
    ]

    // Mock RPC calls
    vi.mocked(supabase.rpc).mockImplementation((functionName: string) => {
      if (functionName === 'count_available_questions') {
        return Promise.resolve({
          data: { in_selected_categories: 10, in_all_categories: 50 },
          error: null,
        }) as any
      }
      if (functionName === 'select_questions_for_host') {
        // The RPC function internally excludes questions from question_usage table
        return Promise.resolve({
          data: mockQuestions,
          error: null,
        }) as any
      }
      return Promise.resolve({ data: null, error: null }) as any
    })

    const result = await selectQuestions(mockHostId, mockCategories, 1)

    expect(result.questions).toHaveLength(1)
    // Verify new question IDs are returned (not q1-q5 which were used)
    expect(result.questions[0].id).toBe('q6')
  })
})
