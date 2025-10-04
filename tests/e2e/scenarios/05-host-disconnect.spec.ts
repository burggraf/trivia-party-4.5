import { test, expect } from '../fixtures/multi-client'
import { GameControlPage, PlayerGamePage } from '../page-objects'
import { NetworkConditions } from '../utils/network-conditions'

test.describe('Host Disconnection', () => {
  test('game auto-pauses when host disconnects, resumes on reconnect (FR-067, FR-068)', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    // Verify game is active
    const gameStatus = await gameControl.getGameStatus()
    expect(gameStatus).toBe('active')

    console.log('✓ Game initially active')

    // Host displays question
    await gameControl.displayQuestion()
    await player1Game.waitForQuestionDisplay()

    // Simulate host disconnect
    const hostNetwork = new NetworkConditions(hostClient.page)
    await hostNetwork.initialize()

    console.log('Simulating host disconnect...')
    await hostNetwork.goOffline()

    // Wait for auto-pause (should happen within ~5s per FR-067)
    await hostClient.page.waitForTimeout(5000)

    // Verify players see paused state
    const isPlayer1Paused = await player1Game.isGamePaused()
    const isPlayer2Paused = await player2Game.isGamePaused()

    expect(isPlayer1Paused).toBe(true)
    expect(isPlayer2Paused).toBe(true)

    console.log('✓ Game auto-paused after host disconnect')

    // Verify players cannot submit answers
    const player1AnswerButton = playerClients[0].page.getByTestId('answer-option-0')
    await expect(player1AnswerButton).toBeDisabled()

    console.log('✓ Players cannot submit answers while paused')

    // Verify players see "Waiting for host" message
    const isWaitingForHost = await player1Game.isWaitingForHost()
    expect(isWaitingForHost).toBe(true)

    console.log('✓ Players see "Waiting for host" message')

    // Restore host connection
    console.log('Restoring host connection...')
    await hostNetwork.goOnline()

    // Wait for reconnection
    await hostClient.page.waitForTimeout(3000)

    // Host resumes game
    await gameControl.resumeGame()

    // Verify game returns to active state
    const resumedStatus = await gameControl.getGameStatus()
    expect(resumedStatus).toBe('active')

    console.log('✓ Game resumed after host reconnection')

    // Verify players can now submit answers
    await expect(player1AnswerButton).toBeEnabled()

    console.log('✓ Players can submit answers after resume')

    // Cleanup
    await hostNetwork.cleanup()
  })

  test('repeated host disconnections are handled gracefully', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    const hostNetwork = new NetworkConditions(hostClient.page)
    await hostNetwork.initialize()

    // Disconnect and reconnect 3 times
    for (let i = 1; i <= 3; i++) {
      console.log(`\nDisconnection cycle ${i}/3...`)

      // Disconnect
      await hostNetwork.goOffline()
      await hostClient.page.waitForTimeout(5000)

      // Verify pause
      expect(await player1Game.isGamePaused()).toBe(true)
      console.log(`✓ Paused on disconnect ${i}`)

      // Reconnect
      await hostNetwork.goOnline()
      await hostClient.page.waitForTimeout(3000)
      await gameControl.resumeGame()

      // Verify resume
      expect(await gameControl.getGameStatus()).toBe('active')
      console.log(`✓ Resumed on reconnect ${i}`)
    }

    console.log('\n✓ All disconnection cycles handled successfully')

    await hostNetwork.cleanup()
  })
})
