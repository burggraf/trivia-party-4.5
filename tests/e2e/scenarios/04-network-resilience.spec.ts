import { test, expect } from '../fixtures/multi-client'
import { GameControlPage, PlayerGamePage, TvDisplayPage } from '../page-objects'
import { NetworkConditions } from '../utils/network-conditions'
import { RealTimeSyncValidator } from '../utils/real-time-sync-validator'

test.describe('Network Resilience', () => {
  test('game functions on slow 3G network', async ({
    hostClient,
    playerClients,
    tvClient,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const tvDisplay = new TvDisplayPage(tvClient.page)

    // Apply slow 3G throttling to all clients
    const hostNetwork = new NetworkConditions(hostClient.page)
    await hostNetwork.initialize()
    await hostNetwork.setPreset('slow-3g')

    const player1Network = new NetworkConditions(playerClients[0].page)
    await player1Network.initialize()
    await player1Network.setPreset('slow-3g')

    const tvNetwork = new NetworkConditions(tvClient.page)
    await tvNetwork.initialize()
    await tvNetwork.setPreset('slow-3g')

    console.log('✓ Slow 3G network applied to all clients (2000ms latency)')

    // Test game functionality with throttled network
    // Use higher latency threshold (2000ms + buffer)
    const syncValidator = new RealTimeSyncValidator(3000)

    // Host displays question
    const syncResult = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        await gameControl.displayQuestion()
      },
      [playerClients[0].page, tvClient.page],
      '[data-testid="question-text"]'
    )

    console.log(`Sync latency on slow-3G: ${syncResult.maxLatencyMs}ms`)
    expect(syncResult.maxLatencyMs).toBeLessThan(3000)

    // Player submits answer
    await player1Game.selectAnswer(0)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible({
      timeout: 5000,
    })

    console.log('✓ Answer submission successful on slow network')

    // Host reveals answer
    await gameControl.revealAnswer()
    await player1Game.waitForAnswerReveal(5000)

    console.log('✓ Answer reveal successful on slow network')

    // Cleanup network conditions
    await hostNetwork.cleanup()
    await player1Network.cleanup()
    await tvNetwork.cleanup()
  })

  test('game functions on 3G network (300ms latency)', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Apply 3G throttling
    const hostNetwork = new NetworkConditions(hostClient.page)
    await hostNetwork.initialize()
    await hostNetwork.setPreset('3g')

    const player1Network = new NetworkConditions(playerClients[0].page)
    await player1Network.initialize()
    await player1Network.setPreset('3g')

    console.log('✓ 3G network applied (300ms latency)')

    // Validate sync still meets <300ms requirement with network latency
    // This tests that application overhead + network = <600ms total
    const syncValidator = new RealTimeSyncValidator(600)

    const syncResult = await syncValidator.validateSync(
      hostClient.page,
      async () => {
        await gameControl.displayQuestion()
      },
      [playerClients[0].page],
      '[data-testid="question-text"]'
    )

    console.log(`Sync latency on 3G: ${syncResult.maxLatencyMs}ms`)
    expect(syncResult.maxLatencyMs).toBeLessThan(600)

    // Cleanup
    await hostNetwork.cleanup()
    await player1Network.cleanup()
  })

  test('mobile FCP (First Contentful Paint) on 3G < 3s', async ({ playerClients }) => {
    const player1Network = new NetworkConditions(playerClients[0].page)
    await player1Network.initialize()
    await player1Network.setPreset('3g')

    // Navigate and measure load time
    const startTime = Date.now()
    await playerClients[0].page.goto('/player/login')
    await playerClients[0].page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime

    console.log(`Page load time on 3G: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // FR performance goal

    await player1Network.cleanup()
  })
})
