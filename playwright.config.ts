import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: './tests/e2e',

  // Parallel execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // Limit to 2 workers in CI for stability

  // Timeouts
  timeout: 60000, // 60s per test (multi-user tests take longer)
  expect: {
    timeout: 10000, // 10s for assertions
  },

  // Reporters
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output
  ],

  // Shared test settings
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: process.env.TEST_VIDEO_ON_FAILURE === 'true' ? 'retain-on-failure' : 'off',
    screenshot: process.env.TEST_SCREENSHOT_ON_FAILURE === 'true' ? 'only-on-failure' : 'off',
    actionTimeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  },

  // Multiple projects for different device types
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Auto-start dev server if not running
  webServer: {
    command: 'npm run dev',
    url: process.env.TEST_BASE_URL || 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
  },
})
