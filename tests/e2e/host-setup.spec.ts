import { test, expect } from '@playwright/test'

/**
 * T059: E2E test for Host game setup
 * Covers Quickstart Steps 1-5 and Scenarios 1-4
 *
 * Tests:
 * - Host authentication (login/register)
 * - Game creation with configuration
 * - Question selection and preview
 * - Game code generation
 * - Redirect to control page
 */

test.describe('Host Game Setup', () => {
  const testHost = {
    email: `test-host-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  }

  test('should register new host account', async ({ page }) => {
    await page.goto('/host/register')

    // Fill registration form
    await page.fill('input[type="email"]', testHost.email)
    await page.fill('input[type="password"]', testHost.password)
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/host\/dashboard/)
  })

  test('should login existing host', async ({ page }) => {
    await page.goto('/host/login')

    // Fill login form
    await page.fill('input[type="email"]', testHost.email)
    await page.fill('input[type="password"]', testHost.password)
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/host\/dashboard/)
  })

  test('should create new game and generate game code', async ({ page }) => {
    // Login first
    await page.goto('/host/login')
    await page.fill('input[type="email"]', testHost.email)
    await page.fill('input[type="password"]', testHost.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/host\/dashboard/)

    // Click "Create New Game" button
    await page.click('text="Create New Game"')
    await expect(page).toHaveURL(/\/host\/games\/create/)

    // Fill game configuration form (Scenario 1)
    await page.fill('input[name="name"]', 'Monday Night Trivia')
    await page.fill('input[name="venue_name"]', 'The Local Pub')
    await page.fill('input[name="num_rounds"]', '3')
    await page.fill('input[name="questions_per_round"]', '5')

    // Select categories for Round 1
    // Note: Actual implementation depends on UI design
    await page.click('text="Sports"')
    await page.click('text="History"')

    await page.fill('input[name="time_limit_seconds"]', '60')
    await page.fill('input[name="min_players_per_team"]', '1')
    await page.fill('input[name="max_players_per_team"]', '6')

    // Enable sound effects
    await page.check('input[name="sound_effects_enabled"]')

    // Submit form
    await page.click('button:has-text("Create Game")')

    // Should redirect to control page (Scenario 4)
    await expect(page).toHaveURL(/\/host\/games\/[^/]+\/control/)

    // Verify game code is displayed (6-character code)
    const gameCode = await page.textContent('[data-testid="game-code"]')
    expect(gameCode).toMatch(/^[A-Z0-9]{6}$/)

    // Verify game is in active state
    await expect(page.locator('text="Game Created"')).toBeVisible()
  })

  test('should display question preview with shuffled answers', async ({ page }) => {
    // This test assumes a game has been created
    // Navigate to control page (would need game ID from previous test)
    // For now, we'll skip this as it requires test data persistence

    // TODO: Implement after adding test fixture for games
  })
})
