import { test, expect } from '@playwright/test'

/**
 * T063: E2E test for Host reveal and advance
 * Covers Quickstart Step 13 and Scenario 12
 *
 * Tests:
 * - Reveal answer
 * - Advance to next question
 * - Question index incremented
 * - Real-time sync to all clients
 */

test.describe('Host Reveal and Advance', () => {
  test('should reveal correct answer', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // Click "Reveal Answer" button (Scenario 12)
    await page.click('button:has-text("Reveal Answer")')

    // Verify correct answer is highlighted
    await expect(page.locator('[data-testid="correct-answer-highlighted"]')).toBeVisible()

    // Verify reveal timestamp updated in database
    // This would be validated via game_questions.revealed_at
  })

  test('should advance to next question', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // Get current question number
    const currentQuestionText = await page.locator('[data-testid="question-number"]').textContent()
    const currentQuestion = parseInt(currentQuestionText?.match(/\d+/)?.[0] || '1')

    // Click "Next Question" button
    await page.click('button:has-text("Next Question")')

    // Verify question index incremented
    const newQuestionText = await page.locator('[data-testid="question-number"]').textContent()
    const newQuestion = parseInt(newQuestionText?.match(/\d+/)?.[0] || '1')

    expect(newQuestion).toBe(currentQuestion + 1)

    // Verify new question displayed
    await expect(page.locator('[data-testid="question-text"]')).not.toBeEmpty()
  })

  test('should sync reveal and advance to all clients', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open host page
    const hostPage = page
    await hostPage.goto(`/host/games/${gameId}/control`)

    // Open player page
    const playerPage = await context.newPage()
    await playerPage.goto(`/player/game/${gameId}`)

    // Open TV page
    const tvPage = await context.newPage()
    await tvPage.goto(`/tv/${gameId}/question`)

    // Host reveals answer
    await hostPage.click('button:has-text("Reveal Answer")')

    // All clients should show correct answer within 300ms
    await expect(playerPage.locator('[data-testid="correct-answer"]')).toBeVisible({
      timeout: 500,
    })
    await expect(tvPage.locator('[data-testid="correct-answer-highlighted"]')).toBeVisible({
      timeout: 500,
    })

    // Players should see if their answer was correct
    await expect(
      playerPage.locator('text=/Correct|Incorrect/i')
    ).toBeVisible()

    // Host advances to next question
    await hostPage.click('button:has-text("Next Question")')

    // All clients should update to new question
    await expect(playerPage.locator('[data-testid="question-text"]')).not.toBeEmpty({
      timeout: 500,
    })
    await expect(tvPage.locator('[data-testid="question-text"]')).not.toBeEmpty({
      timeout: 500,
    })

    // Answer buttons should be re-enabled for new question
    const answerButtons = playerPage.locator('button[data-testid^="answer-option"]')
    await expect(answerButtons.first()).toBeEnabled()

    // Cleanup
    await playerPage.close()
    await tvPage.close()
  })

  test('should navigate backward to previous question', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // Advance to question 2
    await page.click('button:has-text("Next Question")')

    // Verify on question 2
    await expect(page.locator('text=/Question 2/i')).toBeVisible()

    // Navigate backward (FR-061)
    await page.click('button:has-text("Previous Question")')

    // Verify on question 1
    await expect(page.locator('text=/Question 1/i')).toBeVisible()

    // Verify previously submitted answers are preserved
    // This would require checking answer_submissions table
  })

  test('should disable previous button on first question', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // On first question, "Previous" button should be disabled
    await expect(page.locator('button:has-text("Previous Question")')).toBeDisabled()
  })
})
