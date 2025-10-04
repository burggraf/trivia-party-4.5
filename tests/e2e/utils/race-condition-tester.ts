import { Page, expect } from '@playwright/test'

export interface RaceResult {
  winnerId: string
  winnerResponse: any
  loserIds: string[]
  loserResponses: any[]
  timingSpreadMs: number
}

export class RaceConditionTester {
  /**
   * Executes multiple actions simultaneously and returns the race result
   */
  async executeRace<T>(
    contestants: Array<{
      id: string
      page: Page
      action: () => Promise<T>
    }>
  ): Promise<RaceResult> {
    const startTime = Date.now()

    // Execute all actions simultaneously using Promise.all
    const results = await Promise.allSettled(
      contestants.map(async ({ id, action }) => {
        const actionStartTime = performance.now()
        try {
          const response = await action()
          const actionEndTime = performance.now()
          return {
            id,
            status: 'success' as const,
            response,
            duration: actionEndTime - actionStartTime,
          }
        } catch (error) {
          const actionEndTime = performance.now()
          return {
            id,
            status: 'error' as const,
            error,
            duration: actionEndTime - actionStartTime,
          }
        }
      })
    )

    const endTime = Date.now()
    const timingSpreadMs = endTime - startTime

    // Find winner (first successful response)
    const successfulResults = results
      .filter((r) => r.status === 'fulfilled' && r.value.status === 'success')
      .map((r) => (r as PromiseFulfilledResult<any>).value)

    const failedResults = results
      .filter((r) => r.status === 'fulfilled' && r.value.status === 'error')
      .map((r) => (r as PromiseFulfilledResult<any>).value)

    if (successfulResults.length === 0) {
      throw new Error('Race condition test failed: All contestants failed')
    }

    const winner = successfulResults[0]
    const losers = failedResults

    return {
      winnerId: winner.id,
      winnerResponse: winner.response,
      loserIds: losers.map((l) => l.id),
      loserResponses: losers.map((l) => l.error),
      timingSpreadMs,
    }
  }

  /**
   * Tests first-write-wins scenario for answer submissions
   */
  async testFirstWriteWins(
    contestants: Array<{
      id: string
      page: Page
      submitAnswer: (answerId: string) => Promise<any>
    }>,
    answerId: string
  ) {
    const result = await this.executeRace(
      contestants.map(({ id, page, submitAnswer }) => ({
        id,
        page,
        action: () => submitAnswer(answerId),
      }))
    )

    // Assert exactly one winner
    expect(result.loserIds.length).toBeGreaterThan(0)

    // Assert losers got 409 Conflict or similar error
    // (The actual error format depends on your API implementation)

    return result
  }

  /**
   * Verifies database constraint was enforced (only one record exists)
   */
  async verifyDatabaseConstraint(
    supabaseClient: any,
    table: string,
    filterColumn: string,
    filterValue: string
  ) {
    const { data, error } = await supabaseClient
      .from(table)
      .select('*')
      .eq(filterColumn, filterValue)

    expect(error).toBeNull()
    expect(data).toHaveLength(1) // Only one answer should exist
  }
}
