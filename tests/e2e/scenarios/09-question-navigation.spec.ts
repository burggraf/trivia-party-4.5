import { test, expect } from '../fixtures/multi-client'
import { GameControlPage, PlayerGamePage } from '../page-objects'

test.describe('Question Navigation', () => {
  test('navigate backward preserves previously submitted answers (FR-061)', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Display question 1
    await gameControl.displayQuestion()
    await player1Game.waitForQuestionDisplay()

    // Player submits answer to question 1
    await player1Game.selectAnswer(0)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    console.log('✓ Submitted answer to question 1')

    // Host advances to question 2
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    // Verify question number changed
    const question2Num = await player1Game.getCurrentQuestionNumber()
    expect(question2Num).toBe(2)

    console.log('✓ Moved to question 2')

    // Player submits answer to question 2
    await player1Game.selectAnswer(1)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    console.log('✓ Submitted answer to question 2')

    // Host navigates back to question 1
    await gameControl.previousQuestion()
    await player1Game.waitForQuestionDisplay()

    // Verify back on question 1
    const question1NumAgain = await player1Game.getCurrentQuestionNumber()
    expect(question1NumAgain).toBe(1)

    console.log('✓ Navigated back to question 1')

    // Verify answer is still marked as submitted (FR-061)
    const isStillSubmitted = await player1Game.isAnswerSubmitted()
    expect(isStillSubmitted).toBe(true)

    console.log('✓ Previously submitted answer preserved on backward navigation')

    // Verify answer buttons are still disabled (answer locked)
    const answerButton = playerClients[0].page.getByTestId('answer-option-0')
    await expect(answerButton).toBeDisabled()

    console.log('✓ Answer remains locked on backward navigation')
  })

  test('navigate forward preserves answer lock', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Submit answer on question 1
    await gameControl.displayQuestion()
    await player1Game.waitForQuestionDisplay()
    await player1Game.selectAnswer(0)

    console.log('✓ Submitted answer to question 1')

    // Navigate to question 2
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    // Navigate back to question 1
    await gameControl.previousQuestion()
    await player1Game.waitForQuestionDisplay()

    // Navigate forward again to question 2
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    // Navigate back to question 1 again
    await gameControl.previousQuestion()
    await player1Game.waitForQuestionDisplay()

    // Verify answer still locked after multiple navigations
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    const answerButton = playerClients[0].page.getByTestId('answer-option-0')
    await expect(answerButton).toBeDisabled()

    console.log('✓ Answer remains locked after multiple back/forward navigations')
  })

  test('navigate to unanswered question allows submission', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Display question 1 - submit answer
    await gameControl.displayQuestion()
    await player1Game.waitForQuestionDisplay()
    await player1Game.selectAnswer(0)

    console.log('✓ Answered question 1')

    // Move to question 2 - DON'T answer
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    console.log('✓ On question 2 (not answered)')

    // Move to question 3
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    // Navigate back to question 2 (unanswered)
    await gameControl.previousQuestion()
    await player1Game.waitForQuestionDisplay()

    // Verify can still submit answer
    const isSubmitted = await player1Game.isAnswerSubmitted()
    expect(isSubmitted).toBe(false)

    const answerButton = playerClients[0].page.getByTestId('answer-option-0')
    await expect(answerButton).toBeEnabled()

    console.log('✓ Can submit answer on previously unanswered question')

    // Submit answer
    await player1Game.selectAnswer(1)
    await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

    console.log('✓ Successfully submitted answer on backward navigation to unanswered question')
  })

  test('host can review all questions with preserved answer states', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)

    // Answer questions 1, 2, 3
    for (let i = 1; i <= 3; i++) {
      if (i > 1) {
        await gameControl.nextQuestion()
      } else {
        await gameControl.displayQuestion()
      }

      await player1Game.waitForQuestionDisplay()
      await player1Game.selectAnswer(0)
      await expect(playerClients[0].page.getByTestId('answer-submitted-message')).toBeVisible()

      console.log(`✓ Answered question ${i}`)
    }

    // Navigate back to question 1
    await gameControl.previousQuestion()
    await gameControl.previousQuestion()
    await player1Game.waitForQuestionDisplay()

    expect(await player1Game.getCurrentQuestionNumber()).toBe(1)
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    console.log('✓ Question 1: Answer preserved')

    // Navigate forward to question 2
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    expect(await player1Game.getCurrentQuestionNumber()).toBe(2)
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    console.log('✓ Question 2: Answer preserved')

    // Navigate forward to question 3
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()

    expect(await player1Game.getCurrentQuestionNumber()).toBe(3)
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    console.log('✓ Question 3: Answer preserved')

    console.log('✓ All answer states preserved across navigation')
  })

  test('multiple players navigate independently with preserved answers', async ({
    hostClient,
    playerClients,
  }) => {
    const gameControl = new GameControlPage(hostClient.page)
    const player1Game = new PlayerGamePage(playerClients[0].page)
    const player2Game = new PlayerGamePage(playerClients[1].page)

    // Display question 1
    await gameControl.displayQuestion()
    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Both players answer question 1
    await player1Game.selectAnswer(0)
    await player2Game.selectAnswer(1)

    console.log('✓ Both players answered question 1')

    // Move to question 2
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Only player 1 answers question 2
    await player1Game.selectAnswer(0)

    console.log('✓ Player 1 answered question 2')

    // Navigate back to question 1
    await gameControl.previousQuestion()
    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Verify both players' answers preserved
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    expect(await player2Game.isAnswerSubmitted()).toBe(true)

    console.log('✓ Both players\' answers preserved on question 1')

    // Navigate forward to question 2
    await gameControl.nextQuestion()
    await player1Game.waitForQuestionDisplay()
    await player2Game.waitForQuestionDisplay()

    // Verify only player 1's answer preserved
    expect(await player1Game.isAnswerSubmitted()).toBe(true)
    expect(await player2Game.isAnswerSubmitted()).toBe(false)

    console.log('✓ Individual answer states preserved correctly')
  })
})
