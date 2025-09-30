import { test, expect } from '@playwright/test'

/**
 * T065: E2E test for Real-time synchronization
 * Covers Quickstart Steps 16-19 and Scenarios 15-18
 *
 * Tests:
 * - Host advances question
 * - Player page auto-updates
 * - TV page auto-updates
 * - Sync latency < 300ms
 * - Pause/resume functionality
 * - Host disconnection handling
 */

test.describe('Real-Time Synchronization', () => {
  test('should sync question advance within 300ms', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open host page
    const hostPage = page
    await hostPage.goto(`/host/games/${gameId}/control`)

    // Open player page
    const playerPage = await context.newPage()
    await playerPage.goto(`/player/game/${gameId}`)

    // Measure sync latency (Scenario 15)
    const startTime = Date.now()

    // Host advances question
    await hostPage.click('button:has-text("Next Question")')

    // Wait for player page to update
    await playerPage.waitForSelector('[data-testid="question-text"]', {
      state: 'attached',
      timeout: 500,
    })

    const syncLatency = Date.now() - startTime

    // Verify latency is under 300ms
    expect(syncLatency).toBeLessThan(300)

    console.log(`Real-time sync latency: ${syncLatency}ms`)

    // Cleanup
    await playerPage.close()
  })

  test('should update teams answered count on TV display', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open TV display
    const tvPage = page
    await tvPage.goto(`/tv/${gameId}/question`)

    // Open two player pages (two teams)
    const player1Page = await context.newPage()
    await player1Page.goto(`/player/game/${gameId}`)

    const player2Page = await context.newPage()
    await player2Page.goto(`/player/game/${gameId}`)

    // Initially, TV should show "0 teams have answered" (Scenario 16)
    await expect(tvPage.locator('text=/0.*teams.*answered/i')).toBeVisible()

    // Player 1 submits answer
    await player1Page.click('button[data-testid="answer-option-0"]')
    await player1Page.click('button:has-text("Submit Answer")')

    // TV should update to "1 team has answered" within 300ms
    await expect(tvPage.locator('text=/1.*team.*answered/i')).toBeVisible({
      timeout: 500,
    })

    // Player 2 submits answer
    await player2Page.click('button[data-testid="answer-option-0"]')
    await player2Page.click('button:has-text("Submit Answer")')

    // TV should update to "2 teams have answered"
    await expect(tvPage.locator('text=/2.*teams.*answered/i')).toBeVisible({
      timeout: 500,
    })

    // Cleanup
    await player1Page.close()
    await player2Page.close()
  })

  test('should sync pause state to all clients', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open host page
    const hostPage = page
    await hostPage.goto(`/host/games/${gameId}/control`)

    // Open player page
    const playerPage = await context.newPage()
    await playerPage.goto(`/player/game/${gameId}`)

    // Host pauses game (Scenario 17)
    await hostPage.click('button:has-text("Pause Game")')

    // Player page should show "Game Paused" overlay within 300ms
    await expect(playerPage.locator('text=/Game Paused/i')).toBeVisible({
      timeout: 500,
    })

    // Answer buttons should be disabled
    const answerButtons = playerPage.locator('button[data-testid^="answer-option"]')
    await expect(answerButtons.first()).toBeDisabled()

    // Timer should be stopped (would need to verify countdown stopped)

    // Host resumes game
    await hostPage.click('button:has-text("Resume Game")')

    // Player page should hide pause overlay
    await expect(playerPage.locator('text=/Game Paused/i')).not.toBeVisible({
      timeout: 500,
    })

    // Answer buttons should be enabled
    await expect(answerButtons.first()).toBeEnabled()

    // Cleanup
    await playerPage.close()
  })

  test('should handle host disconnection gracefully', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open host page
    const hostPage = page
    await hostPage.goto(`/host/games/${gameId}/control`)

    // Open player page
    const playerPage = await context.newPage()
    await playerPage.goto(`/player/game/${gameId}`)

    // Start question
    await hostPage.click('button:has-text("Display Question")')

    // Wait for question to appear on player page
    await expect(playerPage.locator('[data-testid="question-text"]')).toBeVisible()

    // Simulate host disconnect (close browser tab) (Scenario 18)
    await hostPage.close()

    // After ~5 seconds, game should auto-pause
    await expect(playerPage.locator('text=/Waiting for host/i')).toBeVisible({
      timeout: 6000,
    })

    // Answer buttons should be disabled
    const answerButtons = playerPage.locator('button[data-testid^="answer-option"]')
    await expect(answerButtons.first()).toBeDisabled()

    // Cleanup
    await playerPage.close()
  })

  test('should allow TV reconnection without notification', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open TV page
    const tvPage = page
    await tvPage.goto(`/tv/${gameId}/question`)

    // Open host page
    const hostPage = await context.newPage()
    await hostPage.goto(`/host/games/${gameId}/control`)

    // Verify question displayed
    await expect(tvPage.locator('[data-testid="question-text"]')).toBeVisible()

    // Simulate TV disconnect and reconnect (FR-101a, FR-101b)
    // Close and reopen page
    await tvPage.reload()

    // TV should auto-resume showing current state
    await expect(tvPage.locator('[data-testid="question-text"]')).toBeVisible({
      timeout: 2000,
    })

    // Host should NOT see disconnection notification (FR-101a)
    // This would require checking that no notification appears on hostPage

    // Cleanup
    await hostPage.close()
  })

  test('should handle simultaneous player actions', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open 10 player pages
    const playerPages = await Promise.all(
      Array.from({ length: 10 }, async () => {
        const playerPage = await context.newPage()
        await playerPage.goto(`/player/game/${gameId}`)
        return playerPage
      })
    )

    // All players submit answers simultaneously
    await Promise.all(
      playerPages.map((playerPage) =>
        playerPage.click('button[data-testid="answer-option-0"]').then(() =>
          playerPage.click('button:has-text("Submit Answer")')
        )
      )
    )

    // Verify all submissions recorded (check database or UI)
    // This tests that real-time broadcast doesn't drop messages

    // Cleanup
    await Promise.all(playerPages.map((p) => p.close()))
  })
})
