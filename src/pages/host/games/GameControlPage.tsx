import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame, getCurrentQuestion, startGame, pauseGame, resumeGame, advanceQuestion, revealAnswer, endGame } from '@/lib/services/game-service'
import { getTeams } from '@/lib/services/team-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row'] & {
  team_members: Array<{
    id: string
    player_id: string
    joined_at: string
  }>
}

interface QuestionData {
  id: string
  category: string
  question: string
  answers: string[]
  correctAnswerIndex: number
}

export default function GameControlPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [game, setGame] = useState<Game | null>(null)
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Load game data
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

        // Load teams
        const { teams: teamsData } = await getTeams(gameId)
        setTeams(teamsData as Team[])

        // Load current question
        const { question: questionData, error: questionError } = await getCurrentQuestion(gameId)
        if (questionData) {
          const q = questionData as any
          setQuestion({
            id: q.id,
            category: q.category,
            question: q.question,
            answers: [q.a, q.b, q.c, q.d],
            correctAnswerIndex: 0, // In DB, 'a' is always correct
          })
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading game:', err)
        setError('Failed to load game data')
        setLoading(false)
      }
    }

    loadGameData()
  }, [gameId, user, authLoading, navigate])

  const handleStart = async () => {
    if (!gameId) return
    setActionLoading(true)
    const { game: updatedGame, error: startError } = await startGame(gameId)
    if (startError) {
      setError('Failed to start game')
    } else if (updatedGame) {
      setGame(updatedGame)
    }
    setActionLoading(false)
  }

  const handleAdvanceQuestion = async () => {
    if (!gameId) return
    setActionLoading(true)
    const { game: updatedGame, error: advanceError } = await advanceQuestion(gameId)
    if (advanceError) {
      if (advanceError.message.includes('No more questions')) {
        // Game completed
        navigate(`/host/games/${gameId}/scores`)
      } else {
        setError('Failed to advance question')
      }
    } else if (updatedGame) {
      setGame(updatedGame)
      // Reload question
      const { question: questionData } = await getCurrentQuestion(gameId)
      if (questionData) {
        const q = questionData as any
        setQuestion({
          id: q.id,
          category: q.category,
          question: q.question,
          answers: [q.a, q.b, q.c, q.d],
          correctAnswerIndex: 0,
        })
      }
    }
    setActionLoading(false)
  }

  const handleRevealAnswer = async () => {
    if (!gameId) return
    setActionLoading(true)
    const { error: revealError } = await revealAnswer(gameId)
    if (revealError) {
      setError('Failed to reveal answer')
    }
    setActionLoading(false)
  }

  const handlePause = async () => {
    if (!gameId || !game) return
    setActionLoading(true)
    if (game.status === 'paused') {
      const { game: updatedGame, error: resumeError } = await resumeGame(gameId)
      if (resumeError) {
        setError('Failed to resume game')
      } else if (updatedGame) {
        setGame(updatedGame)
      }
    } else {
      const { game: updatedGame, error: pauseError } = await pauseGame(gameId)
      if (pauseError) {
        setError('Failed to pause game')
      } else if (updatedGame) {
        setGame(updatedGame)
      }
    }
    setActionLoading(false)
  }

  const handleEndGame = async () => {
    if (!gameId) return
    if (confirm('Are you sure you want to end the game early?')) {
      setActionLoading(true)
      const { error: endError } = await endGame(gameId)
      if (endError) {
        setError('Failed to end game')
        setActionLoading(false)
      } else {
        navigate(`/host/games/${gameId}/scores`)
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !game) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              to="/host/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-2">{game.name}</h1>
            <p className="text-sm text-muted-foreground">Game Code: {game.game_code}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={game.status === 'paused' ? 'outline' : game.status === 'active' ? 'default' : 'secondary'}>
              {game.status === 'setup' ? 'Setup' : game.status === 'paused' ? 'Paused' : game.status === 'active' ? 'Active' : 'Completed'}
            </Badge>
            <Badge variant="secondary">
              Question {game.current_question_index + 1} of {game.num_rounds * game.questions_per_round}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Display */}
          <div className="lg:col-span-2 space-y-6">
            {game.status === 'setup' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Game Not Started</CardTitle>
                  <CardDescription>Click "Start Game" to begin</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleStart} size="lg" disabled={actionLoading}>
                    {actionLoading ? 'Starting...' : 'Start Game'}
                  </Button>
                </CardContent>
              </Card>
            ) : question ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        Round {Math.floor(game.current_question_index / game.questions_per_round) + 1} - Question {(game.current_question_index % game.questions_per_round) + 1}
                      </CardTitle>
                      <CardDescription>Category: {question.category}</CardDescription>
                    </div>
                    <Badge variant="outline">0 / {teams.length} teams answered</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-lg font-medium">{question.question}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Answer Options:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {question.answers.map((answer, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            idx === question.correctAnswerIndex
                              ? 'bg-green-50 border-green-500'
                              : 'bg-card'
                          }`}
                        >
                          <span className="font-medium">{answer}</span>
                          {idx === question.correctAnswerIndex && (
                            <span className="ml-2 text-green-600">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Correct answer: <strong>{question.answers[question.correctAnswerIndex]}</strong>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Loading Question...</CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
                <CardDescription>Manage game flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {game.status !== 'setup' && (
                  <>
                    <Button
                      onClick={handleRevealAnswer}
                      className="w-full"
                      size="lg"
                      disabled={actionLoading}
                    >
                      Reveal Answer
                    </Button>

                    <Button
                      onClick={handleAdvanceQuestion}
                      className="w-full"
                      size="lg"
                      variant="outline"
                      disabled={actionLoading}
                    >
                      {game.current_question_index < (game.num_rounds * game.questions_per_round) - 1 ? 'Next Question' : 'View Final Scores'}
                    </Button>

                    <Button
                      onClick={handlePause}
                      variant="outline"
                      className="w-full"
                      disabled={actionLoading}
                    >
                      {game.status === 'paused' ? 'Resume Game' : 'Pause Game'}
                    </Button>

                    <Button
                      onClick={handleEndGame}
                      variant="destructive"
                      className="w-full"
                      disabled={actionLoading}
                    >
                      End Game Early
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>{teams.length} {teams.length === 1 ? 'team' : 'teams'} {teams.length > 0 ? 'playing' : 'registered'}</CardDescription>
              </CardHeader>
              <CardContent>
                {teams.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {teams.map((team) => (
                      <div key={team.id} className="flex justify-between">
                        <span>{team.team_name}</span>
                        <Badge variant="secondary">{team.team_members?.length || 0} players</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No teams have joined yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {game.status === 'paused' && (
          <Alert className="mt-6">
            <AlertDescription>
              Game is paused. Players cannot submit answers. Click "Resume Game" to continue.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}