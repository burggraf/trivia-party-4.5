import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class TvDisplayPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToLobby(gameCode: string) {
    await this.goto(`/tv?code=${gameCode}`)
    await this.waitForURL(/\/tv\/.*\/lobby/)
  }

  async navigateToQuestion(gameId: string) {
    await this.goto(`/tv/${gameId}/question`)
  }

  async navigateToScores(gameId: string) {
    await this.goto(`/tv/${gameId}/scores`)
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

  async getTeamsAnsweredCount(): Promise<number> {
    const text = await this.getText('teams-answered-count')
    return parseInt(text || '0')
  }

  async getAnswerOptions() {
    return this.page.getByTestId('answer-display').all()
  }

  async isCorrectAnswerHighlighted(): Promise<boolean> {
    return await this.isVisible('correct-answer-highlight')
  }

  async getCorrectAnswer(): Promise<string | null> {
    return await this.getText('correct-answer-display')
  }

  async getTeamsList() {
    return this.page.getByTestId('team-item').all()
  }

  async getTeamScore(teamName: string): Promise<number> {
    const text = await this.page.getByTestId(`team-${teamName}-score`).textContent()
    return parseInt(text || '0')
  }

  async getLeaderboard() {
    return this.page.getByTestId('leaderboard-entry').all()
  }

  async getWinningTeam(): Promise<string | null> {
    return await this.getText('winning-team')
  }

  async isQRCodeVisible(): Promise<boolean> {
    return await this.isVisible('game-qr-code')
  }

  async getGameCode(): Promise<string | null> {
    return await this.getText('game-code-display')
  }

  async waitForQuestionDisplay(timeout = 5000) {
    await this.waitForElement('question-text', timeout)
  }

  async waitForAnswerReveal(timeout = 5000) {
    await this.waitForElement('correct-answer-display', timeout)
  }

  async waitForScoreboard(timeout = 5000) {
    await this.waitForElement('leaderboard-entry', timeout)
  }
}
