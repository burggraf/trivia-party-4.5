import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame, getGameScores } from '@/lib/services/game-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

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

export default function GameScoresPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [game, setGame] = useState<Game | null>(null)
  const [scores, setScores] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/host/login')
      return
    }

    if (!gameId || !user) return

    const loadGameData = async () => {
      try {
        setLoading(true)

        // Load game
        const { game: gameData, error: gameError } = await getGame(gameId)
        if (gameError || !gameData) {
          setError('Failed to load game')
          return
        }
        setGame(gameData)

        // Load scores
        const { scores: scoresData, error: scoresError } = await getGameScores(gameId)
        if (scoresError) {
          setError('Failed to load scores')
          return
        }

        setScores(scoresData as TeamScore[])
        setLoading(false)
      } catch (err) {
        console.error('Error loading game:', err)
        setError('Failed to load game data')
        setLoading(false)
      }
    }

    loadGameData()
  }, [gameId, user, authLoading, navigate])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleNewGame = () => {
    navigate('/host/games/create')
  }

  const handleBackToDashboard = () => {
    navigate('/host/dashboard')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !game) return null

  const totalQuestions = game.num_rounds * game.questions_per_round
  const totalPlayers = scores.reduce((sum, team) => sum + team.playerCount, 0)
  const gameDate = new Date(game.created_at).toLocaleDateString()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/host/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Final Scores</h1>
          <p className="text-sm text-muted-foreground">
            {game.name} • {gameDate}
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Game Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Game Summary</CardTitle>
              <CardDescription>Overview of game performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold">{scores.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{totalPlayers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Rounds</p>
                  <p className="text-2xl font-bold">{game.num_rounds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Final Rankings</CardTitle>
              <CardDescription>
                Teams ranked by correct answers, ties broken by cumulative answer time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead className="text-center">Players</TableHead>
                    <TableHead className="text-center">Correct</TableHead>
                    <TableHead className="text-center">Accuracy</TableHead>
                    <TableHead className="text-center">Total Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No teams participated in this game
                      </TableCell>
                    </TableRow>
                  ) : (
                    scores.map((team) => (
                      <TableRow key={team.teamId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {team.rank === 1 && (
                              <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center">
                                {team.rank}
                              </Badge>
                            )}
                            {team.rank === 2 && (
                              <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                                {team.rank}
                              </Badge>
                            )}
                            {team.rank === 3 && (
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                {team.rank}
                              </Badge>
                            )}
                            {team.rank > 3 && (
                              <span className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground">
                                {team.rank}
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{team.playerCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {team.score} / {team.totalQuestions}
                      </TableCell>
                      <TableCell className="text-center">{team.accuracy}%</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {formatTime(team.cumulativeTime)}
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleNewGame} size="lg" className="flex-1">
                  Start New Game
                </Button>
                <Button onClick={handleBackToDashboard} variant="outline" size="lg" className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}