import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame, getGameScores } from '@/lib/services/game-service'
import { getMyTeam } from '@/lib/services/team-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface TeamScore {
  rank: number
  teamId: string
  teamName: string
  playerCount: number
  score: number
  totalQuestions: number
  accuracy: number
  cumulativeTime: number
}

export default function PlayerResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const gameId = searchParams.get('gameId')

  const [game, setGame] = useState<Game | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [myTeamScore, setMyTeamScore] = useState<TeamScore | null>(null)
  const [allScores, setAllScores] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!gameId || !user) return

    const loadResults = async () => {
      try {
        setLoading(true)

        // Load game
        const { game: gameData, error: gameError } = await getGame(gameId)
        if (gameError || !gameData) {
          setError('Failed to load game')
          return
        }
        setGame(gameData)

        // Load my team
        const { team: teamData, error: teamError } = await getMyTeam(gameId)
        if (teamError || !teamData) {
          setError('Failed to load team')
          return
        }
        setMyTeam(teamData as Team)

        // Load all scores
        const { scores: scoresData, error: scoresError } = await getGameScores(gameId)
        if (scoresError) {
          setError('Failed to load scores')
          return
        }

        setAllScores(scoresData as TeamScore[])

        // Find my team's score
        const myScore = (scoresData as TeamScore[]).find(s => s.teamId === teamData.id)
        if (myScore) {
          setMyTeamScore(myScore)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading results:', err)
        setError('Failed to load results')
        setLoading(false)
      }
    }

    loadResults()
  }, [gameId, user])

  const handleJoinAnotherGame = () => {
    navigate('/player/join')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  if (error || !game || !myTeam || !myTeamScore) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Failed to load results'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default'
    if (rank === 2) return 'secondary'
    if (rank === 3) return 'outline'
    return 'secondary'
  }

  const getRankLabel = (rank: number) => {
    if (rank === 1) return '🥇 1st Place'
    if (rank === 2) return '🥈 2nd Place'
    if (rank === 3) return '🥉 3rd Place'
    return `${rank}th Place`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Game Complete!</h1>
          <p className="text-muted-foreground">{game.name}</p>
        </div>

        <div className="space-y-6">
          {/* Team Result Card */}
          <Card className="border-2">
            <CardHeader className="text-center">
              <Badge
                variant={getRankBadgeVariant(myTeamScore.rank)}
                className="mx-auto text-lg px-4 py-1 mb-2"
              >
                {getRankLabel(myTeamScore.rank)}
              </Badge>
              <CardTitle className="text-2xl">{myTeam.team_name}</CardTitle>
              <CardDescription>Your team's final score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                  <p className="text-3xl font-bold">{myTeamScore.score}</p>
                  <p className="text-xs text-muted-foreground">
                    out of {myTeamScore.totalQuestions}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-3xl font-bold">{myTeamScore.accuracy}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Final Standings</CardTitle>
              <CardDescription>All teams ranked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allScores.map((score) => (
                  <div
                    key={score.teamId}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      score.teamId === myTeam.id ? 'bg-primary/10 border-primary' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={getRankBadgeVariant(score.rank)}>
                        {score.rank}
                      </Badge>
                      <div>
                        <p className={`font-medium ${score.teamId === myTeam.id ? 'text-primary' : ''}`}>
                          {score.teamName}
                          {score.teamId === myTeam.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(Your Team)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {score.playerCount} {score.playerCount === 1 ? 'player' : 'players'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{score.score} correct</p>
                      <p className="text-sm text-muted-foreground">{score.accuracy}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleJoinAnotherGame} size="lg" className="w-full">
                Join Another Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
