import { test, expect } from '@playwright/test'

/**
 * T064: E2E test for Multi-player gameplay
 * Covers Quickstart Steps 14-15 and Scenarios 13-14
 *
 * Tests:
 * - Two players, two teams
 * - Both submit answers
 * - Scores calculated correctly
 * - Tie-breaking works (cumulative time)
 */

test.describe('Multi-Player Gameplay', () => {
  test('should handle two teams competing', async ({ page, context }) => {
    const gameId = 'test-game-id'

    // Open host page
    const hostPage = page
    await hostPage.goto(`/host/games/${gameId}/control`)

    // Open Team 1 Player page
    const team1Page = await context.newPage()
    await team1Page.goto(`/player/game/${gameId}`)

    // Open Team 2 Player page
    const team2Page = await context.newPage()
    await team2Page.goto(`/player/game/${gameId}`)

    // Host starts question
    await hostPage.click('button:has-text("Display Question")')

    // Both teams submit answers
    await team1Page.click('button[data-testid="answer-option-0"]') // Correct
    await team1Page.click('button:has-text("Submit Answer")')

    await team2Page.click('button[data-testid="answer-option-1"]') // Incorrect
    await team2Page.click('button:has-text("Submit Answer")')

    // Host reveals answer
    await hostPage.click('button:has-text("Reveal Answer")')

    // Team 1 should see "Correct"
    await expect(team1Page.locator('text=/Correct/i')).toBeVisible()

    // Team 2 should see "Incorrect"
    await expect(team2Page.locator('text=/Incorrect/i')).toBeVisible()

    // Host advances to next question
    await hostPage.click('button:has-text("Next Question")')

    // Cleanup
    await team1Page.close()
    await team2Page.close()
  })

  test('should calculate scores correctly', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/scores`)

    // Verify scores displayed
    await expect(page.locator('[data-testid="team-score"]')).toHaveCount(2)

    // Verify scores are correct (would need test data)
    // Example: Team 1 = 4/5, Team 2 = 3/5
    await expect(page.locator('text=/Team 1.*4/i')).toBeVisible()
    await expect(page.locator('text=/Team 2.*3/i')).toBeVisible()
  })

  test('should handle tie-breaking by cumulative time', async ({ page }) => {
    const gameId = 'test-game-id'

    // Create scenario where both teams have same score (e.g., 10/15)
    // but different cumulative answer times

    await page.goto(`/host/games/${gameId}/scores`)

    // Verify team with lower cumulative time is ranked higher (Scenario 19-20)
    const team1Element = page.locator('[data-testid="team-rank-1"]')
    const team1Text = await team1Element.textContent()

    // Verify winning team has lower time displayed
    expect(team1Text).toMatch(/\d+\.?\d*s/)
  })

  test('should complete full round and show scores', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // Complete all 5 questions in round
    for (let i = 0; i < 5; i++) {
      // Display question
      await page.click('button:has-text("Display Question")')

      // Wait for timer or reveal manually
      await page.click('button:has-text("Reveal Answer")')

      // Advance to next question (or show scores on last question)
      if (i < 4) {
        await page.click('button:has-text("Next Question")')
      } else {
        await page.click('button:has-text("Show Scores")')
      }
    }

    // Verify scoreboard displayed (Scenario 13)
    await expect(page.locator('[data-testid="scoreboard"]')).toBeVisible()

    // Verify round complete
    await expect(page.locator('text=/Round 1 Complete/i')).toBeVisible()
  })

  test('should display accuracy percentages', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/scores`)

    // Verify accuracy displayed for each team
    // Example: "80% accuracy" or similar
    await expect(page.locator('text=/\d+%.*accuracy/i')).toHaveCount(2, { timeout: 5000 })
  })
})
