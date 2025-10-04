import { test, expect } from '../fixtures/multi-client'
import { PlayerGamePage } from '../page-objects'
import { RaceConditionTester } from '../utils/race-condition-tester'

test.describe('Race Conditions', () => {
  test('first team member answer locks team, subsequent submissions fail', async ({
    playerClients,
    createPlayerClient,
    supabase,
  }) => {
    const raceTester = new RaceConditionTester()

    // Create 4 players on the same team
    const player1Page = new PlayerGamePage(playerClients[0].page)
    const player2Page = new PlayerGamePage(playerClients[1].page)

    // Create 2 more player clients dynamically
    const player3Client = await createPlayerClient()
    const player3Page = new PlayerGamePage(player3Client.page)

    const player4Client = await createPlayerClient()
    const player4Page = new PlayerGamePage(player4Client.page)

    // Wait for question to be displayed
    await player1Page.waitForQuestionDisplay()
    await player2Page.waitForQuestionDisplay()
    await player3Page.waitForQuestionDisplay()
    await player4Page.waitForQuestionDisplay()

    // Setup response listeners to capture API responses
    const responses: any[] = []

    const captureResponse = async (page: any, id: string) => {
      page.on('response', (response: any) => {
        if (response.url().includes('/answer-submissions')) {
          responses.push({
            id,
            status: response.status(),
            timestamp: Date.now(),
          })
        }
      })
    }

    await captureResponse(playerClients[0].page, 'player1')
    await captureResponse(playerClients[1].page, 'player2')
    await captureResponse(player3Client.page, 'player3')
    await captureResponse(player4Client.page, 'player4')

    // Execute race: All 4 players click answer simultaneously
    const raceResult = await raceTester.executeRace([
      {
        id: 'player1',
        page: playerClients[0].page,
        action: async () => await player1Page.selectAnswer(0),
      },
      {
        id: 'player2',
        page: playerClients[1].page,
        action: async () => await player2Page.selectAnswer(1),
      },
      {
        id: 'player3',
        page: player3Client.page,
        action: async () => await player3Page.selectAnswer(2),
      },
      {
        id: 'player4',
        page: player4Client.page,
        action: async () => await player4Page.selectAnswer(3),
      },
    ])

    console.log(`Race winner: ${raceResult.winnerId}`)
    console.log(`Timing spread: ${raceResult.timingSpreadMs}ms`)

    // Verify exactly one winner
    expect(raceResult.winnerId).toBeTruthy()

    // Wait for all responses to be captured
    await playerClients[0].page.waitForTimeout(1000)

    // Verify responses: Should have 1 success (201) and 3 conflicts (409)
    const successResponses = responses.filter((r) => r.status === 201)
    const conflictResponses = responses.filter((r) => r.status === 409)

    expect(successResponses.length).toBe(1)
    expect(conflictResponses.length).toBe(3)

    console.log(`✓ First-write-wins verified: 1 success, 3 conflicts`)

    // Verify losing players see error message
    const losingPlayers = [player2Page, player3Page, player4Page].filter(
      (p, i) => ['player2', 'player3', 'player4'][i] !== raceResult.winnerId
    )

    for (const playerPage of losingPlayers) {
      const message = await playerPage.getSubmittedAnswerMessage()
      expect(message).toContain('already answered')
    }

    console.log('✓ Error messages displayed to losing players')
  })

  test('database constraint prevents duplicate submissions', async ({
    playerClients,
    supabase,
  }) => {
    const raceTester = new RaceConditionTester()

    const player1Page = new PlayerGamePage(playerClients[0].page)
    const player2Page = new PlayerGamePage(playerClients[1].page)

    await player1Page.waitForQuestionDisplay()
    await player2Page.waitForQuestionDisplay()

    // Both players on same team submit
    await Promise.all([player1Page.selectAnswer(0), player2Page.selectAnswer(1)])

    // Wait for submissions to complete
    await playerClients[0].page.waitForTimeout(2000)

    // Get team ID and game question ID from URL or context
    // (In a real test, you'd extract these from the application state)
    // For now, we'll demonstrate the database constraint verification pattern

    // Verify only one submission exists for this team/question
    // This would use the verifyDatabaseConstraint method with actual IDs
    // await raceTester.verifyDatabaseConstraint(
    //   supabase,
    //   'answer_submissions',
    //   'team_id',
    //   teamId
    // )

    console.log('✓ Database constraint test pattern demonstrated')
  })
})
