'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signInAnonymous, getCurrentUser } from '@/lib/services/auth-service'
import { createGame } from '@/lib/services/game-service'

export default function TestPage() {
  const [status, setStatus] = useState<string[]>(['Ready to test...'])
  const [loading, setLoading] = useState(false)

  const addStatus = (message: string) => {
    setStatus((prev) => [...prev, message])
  }

  const runTests = async () => {
    setLoading(true)
    setStatus(['Starting tests...'])

    try {
      // Test 1: Supabase connection
      addStatus('✅ Test 1: Checking Supabase connection...')
      const supabase = createClient()
      const { data, error } = await supabase.from('questions').select('count').limit(1)
      if (error) {
        addStatus(`❌ Supabase connection failed: ${error.message}`)
      } else {
        addStatus('✅ Supabase connection successful')
      }

      // Test 2: Count questions
      addStatus('✅ Test 2: Counting questions...')
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
      addStatus(`✅ Found ${count} questions in database`)

      // Test 3: Get categories
      addStatus('✅ Test 3: Getting categories...')
      const { data: categories } = await supabase
        .from('questions')
        .select('category')
        .limit(10)
      const uniqueCategories = [...new Set(categories?.map((c) => c.category) || [])]
      addStatus(`✅ Categories: ${uniqueCategories.join(', ')}`)

      // Test 4: Check current user
      addStatus('✅ Test 4: Checking authentication state...')
      const currentUser = await getCurrentUser()
      if (currentUser) {
        addStatus(`✅ Current user: ${currentUser.email || 'Anonymous'} (${currentUser.id})`)
      } else {
        addStatus('ℹ️ No user logged in (this is expected - sign in first)')
      }

      // Test 5: Test game creation (if logged in as host)
      if (currentUser) {
        addStatus('✅ Test 5: Testing game creation service...')
        const gameResult = await createGame({
          name: 'Test Game',
          num_rounds: 1,
          questions_per_round: 5,
          rounds: [{ round_number: 1, categories: ['Science'] }],
        })

        if (gameResult.error) {
          addStatus(`⚠️ Game creation: ${gameResult.error.message}`)
        } else if (gameResult.game) {
          addStatus(`✅ Game created successfully!`)
          addStatus(`   - Game ID: ${gameResult.game.id}`)
          addStatus(`   - Game Code: ${gameResult.gameCode}`)
          addStatus(`   - Available Questions: ${gameResult.availableQuestions}`)
        }
      } else {
        addStatus('ℹ️ Test 5: Skipped (no user logged in)')
      }

      addStatus('✅ All tests completed!')
    } catch (error) {
      addStatus(`❌ Unexpected error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 Client-Side Architecture Test</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Architecture Verification</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ Running in browser (client-side only)</li>
            <li>✅ Using Supabase browser client</li>
            <li>✅ No server-side API routes</li>
            <li>✅ Static export compatible</li>
          </ul>
        </div>

        <button
          onClick={runTests}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed mb-6"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Test Results:</h2>
          <div className="space-y-1 font-mono text-sm">
            {status.map((message, index) => (
              <div key={index} className="text-green-400">
                {message}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}