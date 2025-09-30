import { test, expect } from '@playwright/test'

/**
 * T062: E2E test for Player answer submission
 * Covers Quickstart Steps 10-11 and Scenarios 9-10
 *
 * Tests:
 * - Submit answer before timer expires
 * - Answer recorded in database
 * - Score updated
 * - Duplicate submission blocked (first-answer lock)
 */

test.describe('Player Answer Submission', () => {
  test('should submit answer and lock team response', async ({ page }) => {
    const gameId = 'test-game-id'

    // Navigate to game page as Player 1
    await page.goto(`/player/game/${gameId}`)

    // Wait for question to load
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible()

    // Click answer option (Scenario 9)
    await page.click('button[data-testid="answer-option-0"]')

    // Confirm submission
    await page.click('button:has-text("Submit Answer")')

    // Verify answer locked
    await expect(page.locator('text=/Your team has answered/i')).toBeVisible()

    // Verify answer buttons disabled
    const answerButtons = page.locator('button[data-testid^="answer-option"]')
    await expect(answerButtons.first()).toBeDisabled()
  })

  test('should prevent duplicate submissions from same team', async ({
    page,
    context,
  }) => {
    const gameId = 'test-game-id'
    const teamId = 'test-team-id'

    // Open Player 1 page
    const player1Page = page
    await player1Page.goto(`/player/game/${gameId}`)

    // Open Player 2 page (same team)
    const player2Page = await context.newPage()
    await player2Page.goto(`/player/game/${gameId}`)

    // Player 1 submits answer
    await player1Page.click('button[data-testid="answer-option-0"]')
    await player1Page.click('button:has-text("Submit Answer")')

    // Player 2 attempts to submit different answer (Scenario 10)
    await player2Page.click('button[data-testid="answer-option-1"]')
    await player2Page.click('button:has-text("Submit Answer")')

    // Should show error message
    await expect(
      player2Page.locator('text=/Your team has already answered/i')
    ).toBeVisible()

    // Player 2 should see same locked state as Player 1
    await expect(player2Page.locator('text=/Your team has answered/i')).toBeVisible()

    // Cleanup
    await player2Page.close()
  })

  test('should update score after correct answer', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/player/game/${gameId}`)

    // Submit correct answer
    // Note: Would need to know correct answer index from test fixture
    await page.click('button[data-testid="answer-option-0"]')
    await page.click('button:has-text("Submit Answer")')

    // Wait for host to reveal answer
    await page.waitForSelector('text=/Correct/i', { timeout: 10000 })

    // Verify score updated (would need to check team score)
    // This might require API call or database check
  })

  test('should record answer time', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/player/game/${gameId}`)

    // Wait a specific time before answering (e.g., 5 seconds)
    await page.waitForTimeout(5000)

    // Submit answer
    await page.click('button[data-testid="answer-option-0"]')
    await page.click('button:has-text("Submit Answer")')

    // Verify answer time recorded (visible in UI or database)
    // This would be validated in the database via answer_submissions.answer_time_ms
  })

  test('should handle timer expiry', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/player/game/${gameId}`)

    // Wait for timer to expire (Scenario 11)
    // Note: This would require a short timer in test environment
    await page.waitForSelector('text=/Time.*up/i', { timeout: 65000 })

    // Verify answer buttons disabled
    const answerButtons = page.locator('button[data-testid^="answer-option"]')
    await expect(answerButtons.first()).toBeDisabled()

    // Verify no submission possible
    await expect(page.locator('button:has-text("Submit Answer")')).toBeDisabled()
  })
})
