import { test, expect } from '../fixtures/multi-client'
import { PlayerGamePage } from '../page-objects'
import { NetworkConditions } from '../utils/network-conditions'

test.describe('Player Reconnection', () => {
  test('player session persists after disconnect and reconnect', async ({
    playerClients,
    supabase,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Display question and submit answer
    await player1Game.waitForQuestionDisplay()
    await player1Game.selectAnswer(0)

    // Verify answer submitted
    const isSubmitted = await player1Game.isAnswerSubmitted()
    expect(isSubmitted).toBe(true)
    console.log('✓ Answer submitted before disconnect')

    // Get current question number
    const questionNumBeforeDisconnect = await player1Game.getCurrentQuestionNumber()

    // Simulate player disconnect
    const player1Network = new NetworkConditions(playerClients[0].page)
    await player1Network.initialize()

    console.log('Simulating player disconnect...')
    await player1Network.goOffline()
    await playerClients[0].page.waitForTimeout(3000)

    // Reconnect
    console.log('Reconnecting player...')
    await player1Network.goOnline()
    await playerClients[0].page.waitForTimeout(2000)

    // Verify session still valid (page should still be on game screen)
    const currentUrl = playerClients[0].page.url()
    expect(currentUrl).toContain('/player/games/')
    console.log('✓ Player session persisted after reconnect')

    // Verify previously submitted answer is still marked as submitted
    const isStillSubmitted = await player1Game.isAnswerSubmitted()
    expect(isStillSubmitted).toBe(true)
    console.log('✓ Previously submitted answer preserved')

    // Verify player is on same question
    const questionNumAfterReconnect = await player1Game.getCurrentQuestionNumber()
    expect(questionNumAfterReconnect).toBe(questionNumBeforeDisconnect)
    console.log('✓ Current question state preserved')

    await player1Network.cleanup()
  })

  test('player can continue gameplay after reconnection', async ({
    playerClients,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Wait for question
    await player1Game.waitForQuestionDisplay()

    // Disconnect and reconnect
    const player1Network = new NetworkConditions(playerClients[0].page)
    await player1Network.initialize()
    await player1Network.simulateDisconnect(3000)

    // Wait for reconnection to stabilize
    await playerClients[0].page.waitForTimeout(2000)

    // Submit answer after reconnection
    await player1Game.selectAnswer(0)

    // Verify answer submission works
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible({
      timeout: 5000,
    })

    console.log('✓ Player can submit answers after reconnection')

    await player1Network.cleanup()
  })

  test('multiple players reconnect simultaneously', async ({
    playerClients,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    // Both players submit answers
    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    await player1Game.selectAnswer(0)
    await player2Game.selectAnswer(1)

    // Both disconnect
    const player1Network = new NetworkConditions(playerClients[0].page)
    const player2Network = new NetworkConditions(playerClients[1].page)

    await player1Network.initialize()
    await player2Network.initialize()

    console.log('Disconnecting both players...')
    await Promise.all([player1Network.goOffline(), player2Network.goOffline()])

    await playerClients[0].page.waitForTimeout(3000)

    // Both reconnect
    console.log('Reconnecting both players...')
    await Promise.all([player1Network.goOnline(), player2Network.goOnline()])

    await playerClients[0].page.waitForTimeout(2000)

    // Verify both sessions still valid
    expect(playerClients[0].page.url()).toContain('/player/games/')
    expect(playerClients[1].page.url()).toContain('/player/games/')

    console.log('✓ Both players reconnected successfully')

    // Verify both answers still marked as submitted
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    expect(await player2Game.isAnswerSubmitted()).toBe(true)

    console.log('✓ Both players\' submitted answers preserved')

    await player1Network.cleanup()
    await player2Network.cleanup()
  })
})
