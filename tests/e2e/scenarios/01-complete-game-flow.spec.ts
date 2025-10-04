import { test, expect } from '../fixtures/multi-client'
import {
  HostLoginPage,
  HostDashboardPage,
  GameSetupPage,
  GameControlPage,
  PlayerLoginPage,
  PlayerJoinPage,
  PlayerGamePage,
  TvDisplayPage,
} from '../page-objects'
import { RealTimeSyncValidator } from '../utils/real-time-sync-validator'

test.describe('Complete Game Flow', () => {
  test('host creates game, players join teams, play through questions, view final scores', async ({
    hostClient,
    playerClients,
    tvClient,
    loginAsHost,
    loginAsPlayer,
    cleanupDatabase,
  }) => {
    // Cleanup before test
    await cleanupDatabase()

    // Initialize page objects
    const hostLogin = new HostLoginPage(hostClient.page)
    const hostDashboard = new HostDashboardPage(hostClient.page)
    const gameSetup = new GameSetupPage(hostClient.page)
    const gameControl = new GameControlPage(hostClient.page)

    const player1Login = new PlayerLoginPage(playerClients[0].page)
    const player1Join = new PlayerJoinPage(playerClients[0].page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    const player2Login = new PlayerLoginPage(playerClients[1].page)
    const player2Join = new PlayerJoinPage(playerClients[1].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    const tvDisplay = new TvDisplayPage(tvClient.page)

    const syncValidator = new RealTimeSyncValidator(
      parseInt(process.env.TEST_MAX_SYNC_LATENCY_MS || '300')
    )

    // STEP 1: Host Login and Create Game
    await hostLogin.navigate()
    await loginAsHost(
      hostClient.page,
      process.env.TEST_HOST_EMAIL,
      process.env.TEST_HOST_PASSWORD
    )

    await hostDashboard.createGame()

    // STEP 2: Configure Game
    await gameSetup.fillGameName('E2E Test Game - Complete Flow')
    await gameSetup.fillVenueName('Test Venue')
    await gameSetup.setQuestionCount(5)
    await gameSetup.selectCategory('Science')
    await gameSetup.selectCategory('History')
    await gameSetup.setTimeLimit(60)
    await gameSetup.setTeamSize(1, 6)

    // Preview questions
    await gameSetup.previewQuestions()
    const previewedQuestions = await gameSetup.getPreviewedQuestions()
    expect(previewedQuestions.length).toBe(5)

    // Start game and get game code
    await gameSetup.startGame()
    const gameCode = await gameControl.getGameCode()
    expect(gameCode).toBeTruthy()
    console.log(`Game code: ${gameCode}`)

    // STEP 3: Players Join Game
    // Player 1 - registered
    await player1Login.navigate()
    await loginAsPlayer(
      playerClients[0].page,
      process.env.TEST_PLAYER_1_EMAIL,
      process.env.TEST_PLAYER_1_PASSWORD
    )
    await player1Join.joinGame(gameCode!)
    await player1Join.createTeam('The Einsteins')

    // Player 2 - anonymous
    await player2Login.navigate()
    await player2Login.loginAsAnonymous('Anonymous Genius')
    await player2Join.joinGame(gameCode!)
    await player2Join.createTeam('Quiz Masters')

    // STEP 4: TV Display Connects
    await tvDisplay.navigateToLobby(gameCode!)
    await expect(tvDisplay.getByTestId('game-code-display')).toHaveText(gameCode!)

    // Verify teams appear in host control
    const teams = await gameControl.getTeamsList()
    expect(teams.length).toBe(2)

    // STEP 5: Host Displays First Question
    await gameControl.displayQuestion()

    // Verify real-time sync: Question appears on all clients within 300ms
    const syncResult = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        // Action already done above (displayQuestion)
      },
      [playerClients[0].page, playerClients[1].page, tvClient.page],
      '[data-testid="question-text"]'
    )

    console.log(`Sync latency: ${syncResult.maxLatencyMs}ms (avg: ${syncResult.avgLatencyMs}ms)`)
    expect(syncResult.maxLatencyMs).toBeLessThan(300)

    // STEP 6: Players Submit Answers
    await player1Game.waitForQuestionDisplay()
    await player1Game.selectAnswer(0) // Select first answer

    await player2Game.waitForQuestionDisplay()
    await player2Game.selectAnswer(1) // Select second answer

    // Verify answer submitted messages
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()
    await expect(playerClients[1].page.getByTestId('answer-submitted-message')).toBeVisible()

    // Verify host sees teams answered count
    const teamsAnswered = await gameControl.getTeamsAnsweredCount()
    expect(teamsAnswered).toBe(2)

    // STEP 7: Host Reveals Answer
    await gameControl.revealAnswer()

    // Verify answer revealed on all clients
    await player1Game.waitForAnswerReveal()
    await player2Game.waitForAnswerReveal()
    await tvDisplay.waitForAnswerReveal()

    expect(await gameControl.isAnswerRevealed()).toBe(true)
    expect(await player1Game.isCorrectAnswerRevealed()).toBe(true)
    expect(await tvDisplay.isCorrectAnswerHighlighted()).toBe(true)

    // STEP 8: Continue Through Remaining Questions
    for (let questionNum = 2; questionNum <= 5; questionNum++) {
      await gameControl.nextQuestion()

      // Wait for question to appear on player screens
      await player1Game.waitForQuestionDisplay()
      await player2Game.waitForQuestionDisplay()

      // Players answer
      await player1Game.selectAnswer(0)
      await player2Game.selectAnswer(1)

      // Host reveals
      await gameControl.revealAnswer()

      // Wait for reveal
      await player1Game.waitForAnswerReveal()
      await player2Game.waitForAnswerReveal()
    }

    // STEP 9: End Game and View Scores
    await gameControl.endGame()

    // Verify final scores page
    await expect(hostClient.page.getByTestId('final-scores')).toBeVisible()

    // Verify leaderboard on TV
    await expect(tvClient.page.getByTestId('leaderboard-entry')).toBeVisible()

    // STEP 10: Cleanup
    await cleanupDatabase()
  })
})
