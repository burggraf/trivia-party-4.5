import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useGame } from '@/lib/hooks/use-game'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

export default function HostDashboardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { createNewGame } = useGame()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch host's games
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/host/login')
      return
    }

    const fetchGames = async () => {
      try {
        const supabase = createClient()

        // Get host record
        const { data: hostData, error: hostError } = await supabase
          .from('hosts')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (hostError) throw hostError

        // Get host's games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('host_id', hostData.id)
          .order('created_at', { ascending: false })

        if (gamesError) throw gamesError

        setGames(gamesData || [])
      } catch (err) {
        console.error('Failed to fetch games:', err)
        setError('Failed to load games')
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [user, authLoading, navigate])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
            </div>
            <div className="flex gap-4">
              <Link
                to="/host/games/create"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
              >
                + Create New Game
              </Link>
              <button
                onClick={handleSignOut}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Games list */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Games</h2>

          {games.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">No games yet</p>
              <p className="text-gray-500 mb-6">Create your first trivia game to get started!</p>
              <Link
                to="/host/games/create"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
              >
                Create Game
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{game.name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>Game Code: <strong className="text-purple-600">{game.game_code}</strong></span>
                        <span>Status: <strong className={
                          game.status === 'active' ? 'text-green-600' :
                          game.status === 'completed' ? 'text-gray-600' :
                          game.status === 'paused' ? 'text-yellow-600' :
                          'text-blue-600'
                        }>{game.status}</strong></span>
                        <span>Rounds: {game.num_rounds}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Created: {new Date(game.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {game.status === 'setup' && (
                        <Link
                          to={`/host/games/${game.id}/setup`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition text-sm"
                        >
                          Continue Setup
                        </Link>
                      )}
                      {game.status === 'active' && (
                        <Link
                          to={`/host/games/${game.id}/control`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition text-sm"
                        >
                          Control Game
                        </Link>
                      )}
                      {game.status === 'paused' && (
                        <Link
                          to={`/host/games/${game.id}/control`}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition text-sm"
                        >
                          Resume Game
                        </Link>
                      )}
                      {game.status === 'completed' && (
                        <Link
                          to={`/host/games/${game.id}/scores`}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition text-sm"
                        >
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-white hover:text-purple-200 underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}