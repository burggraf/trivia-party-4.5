import { test, expect } from '@playwright/test'

/**
 * T060: E2E test for Player join flow
 * Covers Quickstart Steps 6-8 and Scenarios 5-7
 *
 * Tests:
 * - Player entry with game code
 * - Team creation
 * - Join existing team
 * - Real-time lobby updates
 */

test.describe('Player Join Flow', () => {
  // This test requires a game to be created first
  // In real implementation, we'd use a fixture or setup
  const TEST_GAME_CODE = 'TEST01'

  test('should join game with valid code', async ({ page }) => {
    await page.goto('/player/join')

    // Enter game code (Scenario 5)
    await page.fill('input[name="gameCode"]', TEST_GAME_CODE)
    await page.click('button:has-text("Join Game")')

    // Should redirect to team selection or lobby
    await expect(page).toHaveURL(/\/player\//)
  })

  test('should create new team as Player 1', async ({ page }) => {
    // Navigate to join page
    await page.goto('/player/join')
    await page.fill('input[name="gameCode"]', TEST_GAME_CODE)
    await page.click('button:has-text("Join Game")')

    // Create new team (Scenario 6)
    await page.click('button:has-text("Create New Team")')
    await page.fill('input[name="teamName"]', 'Quiz Wizards')
    await page.click('button:has-text("Create Team")')

    // Should redirect to lobby
    await expect(page).toHaveURL(/\/player\/lobby/)

    // Verify team name and count displayed
    await expect(page.locator('text="Quiz Wizards"')).toBeVisible()
    await expect(page.locator('text=/1.*player/i')).toBeVisible()

    // Verify waiting status
    await expect(page.locator('text=/Waiting/i')).toBeVisible()
  })

  test('should join existing team as Player 2', async ({ page, context }) => {
    // Open first page (Player 1 creates team)
    const page1 = await context.newPage()
    await page1.goto('/player/join')
    await page1.fill('input[name="gameCode"]', TEST_GAME_CODE)
    await page1.click('button:has-text("Join Game")')
    await page1.click('button:has-text("Create New Team")')
    await page1.fill('input[name="teamName"]', 'Quiz Wizards')
    await page1.click('button:has-text("Create Team")')

    // Open second page (Player 2 joins team)
    const page2 = await context.newPage()
    await page2.goto('/player/join')
    await page2.fill('input[name="gameCode"]', TEST_GAME_CODE)
    await page2.click('button:has-text("Join Game")')

    // Should see "Quiz Wizards" in team list (Scenario 7)
    await expect(page2.locator('text="Quiz Wizards"')).toBeVisible()
    await page2.click('button:has-text("Join Quiz Wizards")')

    // Both pages should show updated count (real-time sync)
    // Real-time sync latency should be <300ms
    await expect(page1.locator('text=/2.*players?/i')).toBeVisible({ timeout: 500 })
    await expect(page2.locator('text=/2.*players?/i')).toBeVisible()

    // Cleanup
    await page1.close()
    await page2.close()
  })

  test('should reject invalid game code', async ({ page }) => {
    await page.goto('/player/join')

    // Enter invalid game code
    await page.fill('input[name="gameCode"]', 'INVALID')
    await page.click('button:has-text("Join Game")')

    // Should show error message
    await expect(page.locator('text=/Game not found/i')).toBeVisible()
  })

  test('should handle anonymous player login', async ({ page }) => {
    // Navigate to join page without being logged in
    await page.goto('/player/join')

    // Should see option to continue as guest
    await expect(page.locator('text=/Continue as Guest/i')).toBeVisible()

    // Click "Continue as Guest"
    await page.click('button:has-text("Continue as Guest")')

    // Should be able to enter game code
    await page.fill('input[name="gameCode"]', TEST_GAME_CODE)
    await page.click('button:has-text("Join Game")')

    // Anonymous session should be created (Supabase anon auth)
    // Verify in localStorage or session state
  })
})
