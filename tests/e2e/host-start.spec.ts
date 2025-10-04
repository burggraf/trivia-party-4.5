import { test, expect } from '@playwright/test'

/**
 * T061: E2E test for Host start game
 * Covers Quickstart Step 9 and Scenario 8
 *
 * Tests:
 * - Host starts game from control page
 * - Game status changes to 'active'
 * - First question loads
 * - Real-time sync to player and TV displays
 */

test.describe('Host Start Game', () => {
  test('should start game and display first question', async ({ page }) => {
    // This assumes a game has been created
    // Navigate to control page (requires game ID)
    const gameId = 'test-game-id' // Would come from fixture

    await page.goto(`/host/games/${gameId}/control`)

    // Click "Start Round 1" button (Scenario 8)
    await page.click('button:has-text("Start")')

    // Verify game state updated
    await expect(page.locator('text=/Round 1/i')).toBeVisible()

    // Click "Display Question 1"
    await page.click('button:has-text("Display Question")')

    // Verify question is displayed
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible()

    // Verify countdown timer started
    await expect(page.locator('[data-testid="timer"]')).toBeVisible()

    // Verify answer options displayed
    const answerButtons = page.locator('[data-testid="answer-option"]')
    await expect(answerButtons).toHaveCount(4)

    // Verify correct answer is highlighted for host
    await expect(page.locator('[data-testid="correct-answer"]')).toBeVisible()
  })

  test('should sync game start to all players', async ({ page, context }) => {
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

    // Host starts game
    await hostPage.click('button:has-text("Start")')
    await hostPage.click('button:has-text("Display Question")')

    // Player page should auto-update to show question
    // Real-time sync latency target: <300ms
    await expect(playerPage.locator('[data-testid="question-text"]')).toBeVisible({
      timeout: 500,
    })

    // TV page should auto-update
    await expect(tvPage.locator('[data-testid="question-text"]')).toBeVisible({
      timeout: 500,
    })

    // Cleanup
    await playerPage.close()
    await tvPage.close()
  })

  test('should validate game status transitions', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // Initial state should be 'pending' or 'lobby'
    await expect(page.locator('text=/Waiting/i')).toBeVisible()

    // Start game
    await page.click('button:has-text("Start")')

    // Status should change to 'active'
    await expect(page.locator('[data-testid="game-status"]')).toHaveText(/active/i)
  })
})
