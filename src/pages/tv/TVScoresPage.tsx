import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getGameScores } from '@/lib/services/game-service'
import { subscribeToGameEvents } from '@/lib/realtime/channels'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface TeamScore {
  teamId: string
  teamName: string
  score: number
  cumulativeTime: number
  accuracy: number
}

export default function TVScoresPage() {
  const { gameCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState<Game | null>(null)
  const [teamScores, setTeamScores] = useState<TeamScore[]>([])

  useEffect(() => {
    if (!gameCode) return

    const loadGameData = async () => {
      try {
        // Find game by game code
        const { data: games } = await supabase
          .from('games')
          .select('*')
          .eq('game_code', gameCode.toUpperCase())
          .single()

        if (!games) {
          console.error('Game not found')
          return
        }

        setGame(games)

        // Load team scores
        const { scores } = await getGameScores(games.id)
        setTeamScores(scores)

        setLoading(false)
      } catch (err) {
        console.error('Error loading game:', err)
        setLoading(false)
      }
    }

    loadGameData()
  }, [gameCode])

  // Subscribe to real-time game events
  useEffect(() => {
    if (!game) return

    const channel = subscribeToGameEvents(game.id, (eventType, payload) => {
      console.log('[TVScoresPage] Received event:', eventType, payload)

      switch (eventType) {
        case 'state_changed':
          // Update game with new state
          if (payload.game) {
            setGame(payload.game)
          }

          // Navigate back to question page when next question starts
          if (payload.state === 'question_active') {
            navigate(`/tv/${gameCode}/question`)
          }
          break
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [game, gameCode, navigate])

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-2xl text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const currentRound = Math.floor(game.current_question_index / game.questions_per_round) + 1
  const totalQuestions = game.num_rounds * game.questions_per_round
  const isGameComplete = game.game_state === 'game_complete'

  return (
    <div className="min-h-screen bg-background p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">Leaderboard</h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-2xl px-6 py-2">
              {isGameComplete ? 'Final Scores' : `Round ${currentRound} of ${game.num_rounds}`}
            </Badge>
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-4">
          {teamScores.map((team, index) => {
            const rank = index + 1
            return (
              <Card
                key={team.teamId}
                className={`border-2 transition-all ${
                  rank === 1
                    ? 'border-primary bg-primary/5 scale-105'
                    : rank === 2
                      ? 'border-secondary'
                      : ''
                }`}
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-8">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {rank === 1 && (
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary-foreground">
                            {rank}
                          </span>
                        </div>
                      )}
                      {rank === 2 && (
                        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-4xl font-bold text-secondary-foreground">
                            {rank}
                          </span>
                        </div>
                      )}
                      {rank === 3 && (
                        <div className="w-20 h-20 rounded-full border-4 border-muted flex items-center justify-center">
                          <span className="text-4xl font-bold text-muted-foreground">
                            {rank}
                          </span>
                        </div>
                      )}
                      {rank > 3 && (
                        <div className="w-20 h-20 flex items-center justify-center">
                          <span className="text-4xl font-bold text-muted-foreground">
                            {rank}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Team Info */}
                    <div className="flex-grow">
                      <h3 className="text-4xl font-bold mb-2">{team.teamName}</h3>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-xl px-4 py-1">
                          {Math.round(team.accuracy)}% accuracy
                        </Badge>
                        <Badge variant="secondary" className="text-xl px-4 py-1">
                          {(team.cumulativeTime / 1000).toFixed(1)}s avg
                        </Badge>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-6xl font-bold">{team.score}</p>
                      <p className="text-2xl text-muted-foreground">/ {totalQuestions}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-shrink-0 w-32">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(team.score / totalQuestions) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          {isGameComplete ? (
            <div>
              <p className="text-5xl font-bold mb-4">Game Complete!</p>
              <p className="text-3xl text-muted-foreground">
                Congratulations to {teamScores[0]?.teamName}!
              </p>
            </div>
          ) : (
            <p className="text-3xl text-muted-foreground">
              {currentRound < game.num_rounds
                ? `Get ready for Round ${currentRound + 1}`
                : 'Get ready for the next question'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}