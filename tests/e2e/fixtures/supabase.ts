import { test as base } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../src/types/database.types'

type SupabaseFixture = {
  supabase: SupabaseClient<Database>
  cleanupDatabase: () => Promise<void>
  seedTestData: () => Promise<void>
}

export const test = base.extend<SupabaseFixture>({
  supabase: async ({}, use) => {
    const supabase = createClient<Database>(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )
    await use(supabase)
  },

  cleanupDatabase: async ({ supabase }, use) => {
    const cleanup = async () => {
      // Delete test data in reverse dependency order
      // Target games with 'e2e', 'test', or 'Test' in game_name
      // Database CASCADE deletes will handle related records

      try {
        // Get test games
        const { data: testGames } = await supabase
          .from('games')
          .select('id')
          .or('game_name.ilike.%e2e%,game_name.ilike.%test%')

        if (testGames && testGames.length > 0) {
          const testGameIds = testGames.map(g => g.id)

          console.log(`Cleaning up ${testGameIds.length} test game(s)...`)

          // Delete in dependency order
          // answer_submissions depends on game_questions and teams
          await supabase
            .from('answer_submissions')
            .delete()
            .in('game_question_id', (await supabase
              .from('game_questions')
              .select('id')
              .in('game_id', testGameIds)).data?.map(q => q.id) || [])

          // game_questions depends on games
          await supabase
            .from('game_questions')
            .delete()
            .in('game_id', testGameIds)

          // team_members depends on teams
          const { data: testTeams } = await supabase
            .from('teams')
            .select('id')
            .in('game_id', testGameIds)

          if (testTeams && testTeams.length > 0) {
            await supabase
              .from('team_members')
              .delete()
              .in('team_id', testTeams.map(t => t.id))
          }

          // teams depends on games
          await supabase
            .from('teams')
            .delete()
            .in('game_id', testGameIds)

          // Finally delete games
          await supabase
            .from('games')
            .delete()
            .in('id', testGameIds)

          console.log(`✓ Cleaned up ${testGameIds.length} test game(s)`)
        }
      } catch (error) {
        console.error('Error during database cleanup:', error)
        // Don't fail the test due to cleanup errors
      }
    }

    // Cleanup before test
    if (process.env.TEST_CLEANUP_ENABLED === 'true') {
      await cleanup()
    }

    await use(cleanup)

    // Cleanup after test with delay to ensure all operations complete
    if (process.env.TEST_CLEANUP_ENABLED === 'true') {
      const delay = parseInt(process.env.TEST_CLEANUP_DELAY_MS || '1000')
      await new Promise(resolve => setTimeout(resolve, delay))
      await cleanup()
    }
  },

  seedTestData: async ({ supabase }, use) => {
    const seed = async () => {
      // Verify test database has questions
      const { data: questionCount } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })

      if (!questionCount || questionCount === 0) {
        throw new Error('Test database has no questions. Please seed the questions table before running tests.')
      }

      console.log(`✓ Test database verified: ${questionCount} questions available`)
    }

    await seed()
    await use(seed)
  },
})

export { expect } from '@playwright/test'
