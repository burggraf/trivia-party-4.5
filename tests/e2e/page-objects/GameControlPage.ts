import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class GameControlPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigate(gameId: string) {
    await this.goto(`/host/games/${gameId}/control`)
  }

  async getCurrentQuestionNumber(): Promise<number> {
    const text = await this.getText('current-question-number')
    return parseInt(text || '0')
  }

  async getCurrentQuestion(): Promise<string | null> {
    return await this.getText('current-question-text')
  }

  async getTeamsAnsweredCount(): Promise<number> {
    const text = await this.getText('teams-answered-count')
    return parseInt(text || '0')
  }

  async getTimerValue(): Promise<number> {
    const text = await this.getText('timer-display')
    return parseInt(text || '0')
  }

  async displayQuestion() {
    await this.clickButton('display-question-button')
  }

  async revealAnswer() {
    await this.clickButton('reveal-answer-button')
  }

  async nextQuestion() {
    await this.clickButton('next-question-button')
  }

  async previousQuestion() {
    await this.clickButton('previous-question-button')
  }

  async pauseGame() {
    await this.clickButton('pause-game-button')
  }

  async resumeGame() {
    await this.clickButton('resume-game-button')
  }

  async endGame() {
    await this.clickButton('end-game-button')
    await this.waitForURL(/\/host\/games\/.*\/scores/)
  }

  async getGameStatus(): Promise<string | null> {
    return await this.getText('game-status')
  }

  async getTeamsList() {
    return this.page.getByTestId('team-item').all()
  }

  async getTeamScore(teamName: string): Promise<number> {
    const text = await this.page.getByTestId(`team-${teamName}-score`).textContent()
    return parseInt(text || '0')
  }

  async isAnswerRevealed(): Promise<boolean> {
    return await this.isVisible('correct-answer-display')
  }

  async getCorrectAnswer(): Promise<string | null> {
    return await this.getText('correct-answer-display')
  }

  async waitForTeamAnswer(timeout = 5000) {
    await this.page.waitForTimeout(timeout)
  }
}
