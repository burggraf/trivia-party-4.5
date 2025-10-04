import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class HostLoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigate() {
    await this.goto('/host/login')
  }

  async login(email: string, password: string) {
    await this.fillInput('email-input', email)
    await this.fillInput('password-input', password)
    await this.clickButton('login-button')
    await this.waitForURL('/host/dashboard')
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible('email-input')
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.getText('error-message')
  }
}
