import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class HostDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigate() {
    await this.goto('/host/dashboard')
  }

  async createGame() {
    await this.clickButton('create-game-button')
    await this.waitForURL(/\/host\/games\/.*\/setup/)
  }

  async getGamesList() {
    return this.page.getByTestId('game-item').all()
  }

  async openGame(gameId: string) {
    await this.page.getByTestId(`game-${gameId}`).click()
    await this.waitForURL(new RegExp(`/host/games/${gameId}`))
  }

  async isWelcomeMessageVisible(): Promise<boolean> {
    return await this.isVisible('welcome-message')
  }

  async logout() {
    await this.clickButton('user-menu')
    await this.clickButton('logout-button')
    await this.waitForURL('/')
  }
}
