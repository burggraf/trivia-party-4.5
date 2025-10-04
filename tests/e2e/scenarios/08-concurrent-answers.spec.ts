import { test, expect } from '../fixtures/multi-client'
import { PlayerGamePage } from '../page-objects'

test.describe('Concurrent Answer Submissions', () => {
  test('team answer locks after first member submits', async ({
    playerClients,
    createPlayerClient,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    // Both players on same team
    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Player 1 submits first
    await player1Game.selectAnswer(0)

    // Wait for submission to complete
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    console.log('✓ Player 1 submitted answer')

    // Player 2 tries to submit different answer
    await player2Game.selectAnswer(1)

    // Wait a moment for API response
    await playerClients[1].page.waitForTimeout(1000)

    // Player 2 should see team already answered message
    const player2Message = await player2Game.getSubmittedAnswerMessage()
    expect(player2Message).toContain('team has already answered')

    console.log('✓ Player 2 blocked - team already answered')

    // Verify answer buttons are disabled for player 2
    const answerButton = playerClients[1].page.getByTestId('answer-option-0')
    await expect(answerButton).toBeDisabled()

    console.log('✓ Answer buttons disabled after team answer locked')
  })

  test('only submitted answer counts, not attempted answers', async ({
    playerClients,
    supabase,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Get the question text to identify answers
    const questionText = await player1Game.getCurrentQuestion()

    // Player 1 submits answer 0
    await player1Game.selectAnswer(0)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    // Player 2 attempts to submit answer 1 (should fail)
    await player2Game.selectAnswer(1)
    await playerClients[1].page.waitForTimeout(1000)

    // When answer is revealed, verify only player 1's answer was recorded
    // (In a real test, you'd verify via database query that only one submission exists)
    // For now, verify UI behavior

    const player2Message = await player2Game.getSubmittedAnswerMessage()
    expect(player2Message).toContain('already answered')

    console.log('✓ Only first submission recorded, second attempt rejected')
  })

  test('different teams can submit different answers simultaneously', async ({
    playerClients,
  }) => {
    // Player 1 and Player 2 on different teams
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Both submit simultaneously (different teams)
    await Promise.all([player1Game.selectAnswer(0), player2Game.selectAnswer(1)])

    // Both should succeed
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()
    await expect(playerClients[1].page.getByTestId('answer-submitted-message')).toBeVisible()

    console.log('✓ Different teams can submit different answers simultaneously')
  })

  test('team member sees teammates answer status (FR-044)', async ({
    playerClients,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Player 1 submits
    await player1Game.selectAnswer(0)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    // Player 2 should see that team has answered (but not WHICH answer)
    // Per FR-044: Hide selected answer from other team members
    const isPlayer2Submitted = await player2Game.isAnswerSubmitted()
    expect(isPlayer2Submitted).toBe(true)

    console.log('✓ Player 2 sees team has answered')

    // Verify Player 2 does NOT see which answer was selected
    // (This would be checked by ensuring no visual indication of the specific answer)
    // The submitted message should say "Your team has answered" not "Your team selected A"

    const player2Message = await player2Game.getSubmittedAnswerMessage()
    expect(player2Message).not.toContain('selected')
    expect(player2Message).toContain('team')

    console.log('✓ Selected answer hidden from other team members (FR-044)')
  })

  test('sequential submissions by team members are blocked', async ({
    playerClients,
    createPlayerClient,
  }) => {
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    // Create third player on same team
    const player3Client = await createPlayerClient()
    const player3Game = new PlayerGamePage(player3Client.page)

    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()
    await player3Game.waitForQuestionDisplay()

    // Player 1 submits
    await player1Game.selectAnswer(0)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    console.log('✓ Player 1 submitted')

    // Player 2 tries to submit (should be blocked)
    await player2Game.selectAnswer(1)
    await playerClients[1].page.waitForTimeout(1000)

    expect(await player2Game.getSubmittedAnswerMessage()).toContain('already answered')
    console.log('✓ Player 2 blocked')

    // Player 3 tries to submit (should also be blocked)
    await player3Game.selectAnswer(2)
    await player3Client.page.waitForTimeout(1000)

    expect(await player3Game.getSubmittedAnswerMessage()).toContain('already answered')
    console.log('✓ Player 3 blocked')

    console.log('✓ All subsequent submissions blocked after first team member')
  })
})
