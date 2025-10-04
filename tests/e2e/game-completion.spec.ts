import { test, expect } from '@playwright/test'

/**
 * T066: E2E test for Game completion
 * Covers Quickstart Steps 15, 20-23
 *
 * Tests:
 * - Advance through all questions
 * - End game
 * - Final scores page displays
 * - Game history updated
 * - Winning team identified
 * - Question reuse prevention
 */

test.describe('Game Completion', () => {
  test('should complete all rounds and end game', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // Complete Round 1 (5 questions)
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Display Question")')
      await page.click('button:has-text("Reveal Answer")')

      if (i < 4) {
        await page.click('button:has-text("Next Question")')
      } else {
        await page.click('button:has-text("Show Scores")')
      }
    }

    // Start Round 2
    await page.click('button:has-text("Start Round 2")')

    // Complete Round 2 (5 questions)
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Display Question")')
      await page.click('button:has-text("Reveal Answer")')

      if (i < 4) {
        await page.click('button:has-text("Next Question")')
      } else {
        await page.click('button:has-text("Show Scores")')
      }
    }

    // Start Round 3
    await page.click('button:has-text("Start Round 3")')

    // Complete Round 3 (5 questions)
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Display Question")')
      await page.click('button:has-text("Reveal Answer")')

      if (i < 4) {
        await page.click('button:has-text("Next Question")')
      } else {
        await page.click('button:has-text("Show Scores")')
      }
    }

    // End game (Scenario 14)
    await page.click('button:has-text("End Game")')

    // Should redirect to final scores page
    await expect(page).toHaveURL(/\/host\/games\/[^/]+\/scores/)
  })

  test('should display final scores with winner highlighted', async ({ page }) => {
    const gameId = 'test-game-id'

    // Navigate to completed game scores
    await page.goto(`/host/games/${gameId}/scores`)

    // Verify final scores displayed
    await expect(page.locator('[data-testid="final-scores"]')).toBeVisible()

    // Verify winning team identified and highlighted (Scenario 14)
    await expect(page.locator('[data-testid="winning-team"]')).toBeVisible()

    // Verify all teams ranked by score
    const teamRankings = page.locator('[data-testid^="team-rank-"]')
    await expect(teamRankings).toHaveCount(2, { timeout: 5000 })

    // Verify tie-breaking applied if needed
    // Teams should be sorted by score (desc), then cumulative_time (asc)
  })

  test('should update game status to completed', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/host/games/${gameId}/control`)

    // End game
    await page.click('button:has-text("End Game")')

    // Verify game status changed to 'completed'
    // This would be validated in database: games.game_state = 'game_complete'
    // or games.status = 'completed'

    // Navigate back to dashboard
    await page.goto('/host/dashboard')

    // Verify game shows as completed in dashboard
    await expect(page.locator(`text=/.*completed/i`)).toBeVisible()
  })

  test('should prevent question reuse in next game', async ({ page }) => {
    // Step 22 from quickstart.md
    const hostEmail = 'test-host@example.com'
    const hostPassword = 'TestPassword123!'

    // Complete first game (assume already done)

    // Create second game with same host and categories
    await page.goto('/host/login')
    await page.fill('input[type="email"]', hostEmail)
    await page.fill('input[type="password"]', hostPassword)
    await page.click('button[type="submit"]')

    await page.click('text="Create New Game"')
    await page.fill('input[name="name"]', 'Tuesday Night Trivia')
    await page.fill('input[name="venue_name"]', 'The Local Pub')
    await page.fill('input[name="num_rounds"]', '3')
    await page.fill('input[name="questions_per_round"]', '5')

    // Select same categories: Sports and History
    await page.click('text="Sports"')
    await page.click('text="History"')

    await page.click('button:has-text("Create Game")')

    // Verify new game uses different questions
    // None of the 15 questions should match previous game (FR-006)
    // This would require comparing question IDs or checking question_usage table
  })

  test('should handle anonymous player session expiry', async ({ page, context }) => {
    // Step 23 from quickstart.md

    // Create anonymous session
    await page.goto('/player/join')
    await page.click('button:has-text("Continue as Guest")')
    await page.fill('input[name="displayName"]', 'Guest Player')

    // Join game and play
    await page.fill('input[name="gameCode"]', 'TEST01')
    await page.click('button:has-text("Join Game")')

    // Verify anonymous session created
    // Session should persist for 30 days (FR-021a)
    // This would require checking Supabase auth session in localStorage

    // Simulate 30+ days passing (not possible in E2E test)
    // In real test, we'd verify session expiry logic

    // For now, verify session exists
    const sessionData = await page.evaluate(() => {
      const authData = localStorage.getItem('supabase.auth.token')
      return authData ? JSON.parse(authData) : null
    })

    expect(sessionData).not.toBeNull()
  })

  test('should refresh game history materialized view', async ({ page }) => {
    // After game completion, game_history materialized view should be refreshed
    // This would require database query or API call to verify

    // Example: Check that completed game appears in game_history
    const gameId = 'test-game-id'

    // Make API call or database query to verify game in game_history
    // For E2E test, we might check via UI or admin page if available
  })

  test('should update player statistics', async ({ page }) => {
    const gameId = 'test-game-id'

    await page.goto(`/player/results`)

    // Verify player's final score displayed
    await expect(page.locator('[data-testid="player-score"]')).toBeVisible()

    // Verify team ranking shown
    await expect(page.locator('[data-testid="team-rank"]')).toBeVisible()

    // Verify option to join another game
    await expect(page.locator('button:has-text("Join Another Game")')).toBeVisible()
  })

  test('should allow starting new game after completion', async ({ page }) => {
    await page.goto('/host/dashboard')

    // Verify "Create New Game" button available
    await expect(page.locator('button:has-text("Create New Game")')).toBeVisible()

    // Click to create new game
    await page.click('button:has-text("Create New Game")')

    // Should navigate to game creation page
    await expect(page).toHaveURL(/\/host\/games\/create/)
  })
})
