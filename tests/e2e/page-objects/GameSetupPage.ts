import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class GameSetupPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async fillGameName(name: string) {
    await this.fillInput('game-name-input', name)
  }

  async fillVenueName(name: string) {
    await this.fillInput('venue-name-input', name)
  }

  async setQuestionCount(count: number) {
    await this.fillInput('question-count-input', count.toString())
  }

  async setQuestionsPerRound(count: number) {
    await this.fillInput('questions-per-round-input', count.toString())
  }

  async selectCategory(category: string) {
    await this.check(`category-${category.toLowerCase()}`)
  }

  async unselectCategory(category: string) {
    await this.uncheck(`category-${category.toLowerCase()}`)
  }

  async setTimeLimit(seconds: number) {
    await this.fillInput('time-limit-input', seconds.toString())
  }

  async setTeamSize(min: number, max: number) {
    await this.fillInput('min-team-size-input', min.toString())
    await this.fillInput('max-team-size-input', max.toString())
  }

  async enableSoundEffects(enabled: boolean) {
    if (enabled) {
      await this.check('sound-effects-toggle')
    } else {
      await this.uncheck('sound-effects-toggle')
    }
  }

  async previewQuestions() {
    await this.clickButton('preview-questions-button')
    await this.waitForElement('question-preview-list')
  }

  async getPreviewedQuestions() {
    return this.page.getByTestId('preview-question-item').all()
  }

  async removeQuestion(index: number) {
    await this.page.getByTestId(`remove-question-${index}`).click()
  }

  async startGame() {
    await this.clickButton('start-game-button')
    await this.waitForURL(/\/host\/games\/.*\/control/)
  }

  async getGameCode(): Promise<string | null> {
    return await this.getText('game-code')
  }

  async getQRCode() {
    return this.getByTestId('game-qr-code')
  }
}
