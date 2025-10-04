import { Page, Locator } from '@playwright/test'

/**
 * Base Page Object with common functionality
 * All page objects should extend this class
 */
export class BasePage {
  constructor(public page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path)
  }

  /**
   * Get a locator by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  /**
   * Wait for URL to match a pattern
   */
  async waitForURL(urlPattern: string | RegExp, timeout = 10000) {
    await this.page.waitForURL(urlPattern, { timeout })
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(testId: string, timeout = 10000) {
    await this.getByTestId(testId).waitFor({ state: 'visible', timeout })
  }

  /**
   * Fill an input field by test ID
   */
  async fillInput(testId: string, value: string) {
    await this.getByTestId(testId).fill(value)
  }

  /**
   * Click a button by test ID
   */
  async clickButton(testId: string) {
    await this.getByTestId(testId).click()
  }

  /**
   * Get text content of an element by test ID
   */
  async getText(testId: string): Promise<string | null> {
    return await this.getByTestId(testId).textContent()
  }

  /**
   * Check if element is visible
   */
  async isVisible(testId: string): Promise<boolean> {
    return await this.getByTestId(testId).isVisible()
  }

  /**
   * Select an option from a dropdown by test ID
   */
  async selectOption(testId: string, value: string) {
    await this.getByTestId(testId).selectOption(value)
  }

  /**
   * Check a checkbox by test ID
   */
  async check(testId: string) {
    await this.getByTestId(testId).check()
  }

  /**
   * Uncheck a checkbox by test ID
   */
  async uncheck(testId: string) {
    await this.getByTestId(testId).uncheck()
  }
}
