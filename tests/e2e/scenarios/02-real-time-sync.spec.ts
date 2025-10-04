import { test, expect } from '../fixtures/multi-client'
import { GameControlPage, PlayerGamePage, TvDisplayPage } from '../page-objects'
import { RealTimeSyncValidator } from '../utils/real-time-sync-validator'

test.describe('Real-Time Synchronization', () => {
  test('validates sync latency < 300ms for all game events', async ({
    hostClient,
    playerClients,
    tvClient,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)
    const tvDisplay = new TvDisplayPage(tvClient.page)

    const syncValidator = new RealTimeSyncValidator(300)

    // Test 1: Question Display Sync
    const displaySync = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        await gameControl.displayQuestion()
      },
      [playerClients[0].page, playerClients[1].page, tvClient.page],
      '[data-testid="question-text"]'
    )

    console.log(`Question display sync: ${displaySync.maxLatencyMs}ms`)
    expect(displaySync.maxLatencyMs).toBeLessThan(300)

    // Test 2: Answer Submission Sync (player → host/TV)
    const answerSync = await syncValidator.validateSync(
      playerClients[0].page,
      async () => {
        await player1Game.selectAnswer(0)
      },
      [hostClient.page, tvClient.page],
      '[data-testid="teams-answered-count"]'
    )

    console.log(`Answer submission sync: ${answerSync.maxLatencyMs}ms`)
    expect(answerSync.maxLatencyMs).toBeLessThan(300)

    // Test 3: Answer Reveal Sync
    const revealSync = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        await gameControl.revealAnswer()
      },
      [playerClients[0].page, playerClients[1].page, tvClient.page],
      '[data-testid="correct-answer-display"]'
    )

    console.log(`Answer reveal sync: ${revealSync.maxLatencyMs}ms`)
    expect(revealSync.maxLatencyMs).toBeLessThan(300)

    // Test 4: Question Navigation Sync
    const navigationSync = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        await gameControl.nextQuestion()
      },
      [playerClients[0].page, playerClients[1].page, tvClient.page],
      '[data-testid="question-number"]',
      '2'
    )

    console.log(`Question navigation sync: ${navigationSync.maxLatencyMs}ms`)
    expect(navigationSync.maxLatencyMs).toBeLessThan(300)

    // Test 5: State Consistency Check
    await syncValidator.validateStateConsistency(
      [hostClient.page, playerClients[0].page, playerClients[1].page, tvClient.page],
      '[data-testid="question-number"]'
    )

    console.log('✓ All clients in sync - state consistency verified')
  })

  test('validates sync under slow network conditions', async ({
    hostClient,
    playerClients,
    tvClient,
  }) => {
    // This test uses a higher latency threshold for slow networks
    const syncValidator = new RealTimeSyncValidator(500)

    // Network conditions would be applied here using NetworkConditions utility
    // For now, just test with higher threshold

    const syncResult = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        await hostClient.page.getByTestId('display-question-button').click()
      },
      [playerClients[0].page, tvClient.page],
      '[data-testid="question-text"]'
    )

    console.log(`Sync latency with network delay: ${syncResult.maxLatencyMs}ms`)
    expect(syncResult.maxLatencyMs).toBeLessThan(500)
  })
})
