import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class PlayerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigate() {
    await this.goto('/player/login')
  }

  async loginWithCredentials(email: string, password: string) {
    await this.fillInput('email-input', email)
    await this.fillInput('password-input', password)
    await this.clickButton('login-button')
    await this.waitForURL('/player/join')
  }

  async switchToAnonymousTab() {
    await this.clickButton('anonymous-tab')
  }

  async loginAsAnonymous(displayName: string) {
    await this.switchToAnonymousTab()
    await this.fillInput('display-name-input', displayName)
    await this.clickButton('continue-anonymous-button')
    await this.waitForURL('/player/join')
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible('email-input')
  }

  async isAnonymousFormVisible(): Promise<boolean> {
    return await this.isVisible('display-name-input')
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.getText('error-message')
  }
}
