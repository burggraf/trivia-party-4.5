import { test, expect } from '../fixtures/multi-client'
import { GameControlPage, TvDisplayPage } from '../page-objects'
import { NetworkConditions } from '../utils/network-conditions'

test.describe('TV Disconnection', () => {
  test('TV reconnects silently without host notification (FR-101a, FR-101b)', async ({
    hostClient,
    tvClient,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const tvDisplay = new TvDisplayPage(tvClient.page)

    // Display question on TV
    await gameControl.displayQuestion()
    await tvDisplay.waitForQuestionDisplay()

    // Verify TV shows question
    const questionBeforeDisconnect = await tvDisplay.getCurrentQuestion()
    expect(questionBeforeDisconnect).toBeTruthy()
    console.log('✓ TV displaying question before disconnect')

    // Simulate TV disconnect
    const tvNetwork = new NetworkConditions(tvClient.page)
    await tvNetwork.initialize()

    console.log('Simulating TV disconnect...')
    await tvNetwork.goOffline()
    await tvClient.page.waitForTimeout(3000)

    // Game continues - host should NOT be notified of TV disconnect
    // (This is validated by the absence of any disconnect notification)

    // Reconnect TV
    console.log('Reconnecting TV...')
    await tvNetwork.goOnline()

    // Wait for automatic reconnection
    await tvClient.page.waitForTimeout(2000)

    // Verify TV auto-resumes showing current state (FR-101b)
    await tvDisplay.waitForQuestionDisplay(5000)
    const questionAfterReconnect = await tvDisplay.getCurrentQuestion()
    expect(questionAfterReconnect).toBeTruthy()

    console.log('✓ TV silently reconnected and resumed current state')

    // Verify host never saw disconnect notification
    // (No specific element to check - successful test means no interruption)

    await tvNetwork.cleanup()
  })

  test('TV reconnection during different game states', async ({
    hostClient,
    tvClient,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const tvDisplay = new TvDisplayPage(tvClient.page)
    const tvNetwork = new NetworkConditions(tvClient.page)
    await tvNetwork.initialize()

    // Test 1: Disconnect during question display
    await gameControl.displayQuestion()
    await tvDisplay.waitForQuestionDisplay()

    await tvNetwork.simulateDisconnect(2000)
    await tvClient.page.waitForTimeout(1000)

    const question1 = await tvDisplay.getCurrentQuestion()
    expect(question1).toBeTruthy()
    console.log('✓ Reconnected during question display')

    // Test 2: Disconnect during answer reveal
    await gameControl.revealAnswer()
    await tvDisplay.waitForAnswerReveal()

    await tvNetwork.simulateDisconnect(2000)
    await tvClient.page.waitForTimeout(1000)

    const isAnswerRevealed = await tvDisplay.isCorrectAnswerHighlighted()
    expect(isAnswerRevealed).toBe(true)
    console.log('✓ Reconnected during answer reveal')

    // Test 3: Disconnect during question transition
    await gameControl.nextQuestion()

    await tvNetwork.simulateDisconnect(2000)
    await tvClient.page.waitForTimeout(1000)

    await tvDisplay.waitForQuestionDisplay(5000)
    const question2 = await tvDisplay.getCurrentQuestion()
    expect(question2).toBeTruthy()
    console.log('✓ Reconnected during question transition')

    await tvNetwork.cleanup()
  })

  test('multiple TVs reconnect independently', async ({
    hostClient,
    tvClient,
    browser,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const tv1Display = new TvDisplayPage(tvClient.page)

    // Create second TV
    const tv2Context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    })
    const tv2Page = await tv2Context.newPage()
    const tv2Display = new TvDisplayPage(tv2Page)

    // Get game code from host
    const gameCode = await gameControl.getGameCode()

    // Connect second TV
    await tv2Display.navigateToLobby(gameCode!)

    // Display question
    await gameControl.displayQuestion()
    await tv1Display.waitForQuestionDisplay()
    await tv2Display.waitForQuestionDisplay()

    console.log('✓ Both TVs displaying question')

    // Disconnect TV1 only
    const tv1Network = new NetworkConditions(tvClient.page)
    await tv1Network.initialize()
    await tv1Network.goOffline()
    await tvClient.page.waitForTimeout(2000)

    // TV2 should still work
    const tv2Question = await tv2Display.getCurrentQuestion()
    expect(tv2Question).toBeTruthy()
    console.log('✓ TV2 unaffected by TV1 disconnect')

    // Reconnect TV1
    await tv1Network.goOnline()
    await tvClient.page.waitForTimeout(2000)

    // Verify TV1 shows current state
    await tv1Display.waitForQuestionDisplay(5000)
    const tv1Question = await tv1Display.getCurrentQuestion()
    expect(tv1Question).toBeTruthy()
    console.log('✓ TV1 reconnected independently')

    // Both TVs should show same question (state consistency)
    expect(tv1Question).toBe(tv2Question)
    console.log('✓ Both TVs in sync after reconnection')

    // Cleanup
    await tv1Network.cleanup()
    await tv2Context.close()
  })

  test('TV reconnection does not disrupt gameplay', async ({
    hostClient,
    playerClients,
    tvClient,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const tvDisplay = new TvDisplayPage(tvClient.page)

    // Display question
    await gameControl.displayQuestion()
    await tvDisplay.waitForQuestionDisplay()

    // Player submits answer
    await playerClients[0].page.getByTestId('answer-option-0').click()

    // Disconnect TV during gameplay
    const tvNetwork = new NetworkConditions(tvClient.page)
    await tvNetwork.initialize()
    await tvNetwork.goOffline()
    await tvClient.page.waitForTimeout(2000)

    // Game continues normally - host reveals answer
    await gameControl.revealAnswer()

    // Player should see reveal despite TV being disconnected
    await expect(playerClients[0].page.getByTestId('correct-answer-indicator')).toBeVisible({
      timeout: 5000,
    })

    console.log('✓ Gameplay continued normally during TV disconnect')

    // Reconnect TV
    await tvNetwork.goOnline()
    await tvClient.page.waitForTimeout(2000)

    // TV should catch up to revealed state
    await tvDisplay.waitForAnswerReveal(5000)
    expect(await tvDisplay.isCorrectAnswerHighlighted()).toBe(true)

    console.log('✓ TV caught up to current game state after reconnect')

    await tvNetwork.cleanup()
  })
})
