import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class PlayerJoinPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigate() {
    await this.goto('/player/join')
  }

  async joinGame(gameCode: string) {
    await this.fillInput('game-code-input', gameCode)
    await this.clickButton('join-game-button')
    await this.waitForURL(/\/player\/games\/.*\/lobby/)
  }

  async createTeam(teamName: string) {
    await this.clickButton('create-team-button')
    await this.fillInput('team-name-input', teamName)
    await this.clickButton('confirm-create-team-button')
  }

  async joinTeam(teamName: string) {
    const teamSlug = teamName.toLowerCase().replace(/\s+/g, '-')
    await this.page.getByTestId(`team-${teamSlug}`).click()
    await this.clickButton('join-team-button')
  }

  async getAvailableTeams() {
    return this.page.getByTestId('team-item').all()
  }

  async isGameCodeInputVisible(): Promise<boolean> {
    return await this.isVisible('game-code-input')
  }

  async getErrorMessage(): Promise<string | null> {
    return await this.getText('error-message')
  }
}
