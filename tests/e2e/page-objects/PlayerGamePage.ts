import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class PlayerGamePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigate(gameId: string) {
    await this.goto(`/player/games/${gameId}`)
  }

  async getCurrentQuestion(): Promise<string | null> {
    return await this.getText('question-text')
  }

  async getCurrentQuestionNumber(): Promise<number> {
    const text = await this.getText('question-number')
    return parseInt(text || '0')
  }

  async getTimerValue(): Promise<number> {
    const text = await this.getText('timer-display')
    return parseInt(text || '0')
  }

  async selectAnswer(answerIndex: number) {
    await this.clickButton(`answer-option-${answerIndex}`)
  }

  async selectAnswerByText(answerText: string) {
    await this.page.getByText(answerText, { exact: true }).click()
  }

  async isAnswerSubmitted(): Promise<boolean> {
    return await this.isVisible('answer-submitted-indicator')
  }

  async getSubmittedAnswerMessage(): Promise<string | null> {
    return await this.getText('answer-submitted-message')
  }

  async isGamePaused(): Promise<boolean> {
    return await this.isVisible('game-paused-indicator')
  }

  async isWaitingForHost(): Promise<boolean> {
    return await this.isVisible('waiting-for-host-message')
  }

  async isQuestionVisible(): Promise<boolean> {
    return await this.isVisible('question-text')
  }

  async areAnswersVisible(): Promise<boolean> {
    return await this.isVisible('answer-option-0')
  }

  async getAnswerOptions() {
    return this.page.getByTestId(/^answer-option-\d+$/).all()
  }

  async isCorrectAnswerRevealed(): Promise<boolean> {
    return await this.isVisible('correct-answer-indicator')
  }

  async getTeamScore(): Promise<number> {
    const text = await this.getText('team-score')
    return parseInt(text || '0')
  }

  async waitForQuestionDisplay(timeout = 5000) {
    await this.waitForElement('question-text', timeout)
  }

  async waitForAnswerReveal(timeout = 5000) {
    await this.waitForElement('correct-answer-indicator', timeout)
  }
}
