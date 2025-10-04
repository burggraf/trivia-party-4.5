import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame, recycleQuestion } from '@/lib/services/game-service'
import { supabase } from '@/lib/supabase/client'
import { getShuffledAnswersForDisplay } from '@/lib/game/answer-shuffling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'

interface GameQuestionWithQuestion {
  id: string
  game_id: string
  round_id: string
  question_id: string
  display_order: number
  randomization_seed: number
  question: {
    id: string
    category: string
    question: string
    a: string
    b: string
    c: string
    d: string
  }
}

export default function GameEditPage() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [game, setGame] = useState<any>(null)
  const [gameQuestions, setGameQuestions] = useState<GameQuestionWithQuestion[]>([])
  const [recycling, setRecycling] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/host/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!gameId || !user) return

    const fetchGameData = async () => {
      try {
        setLoading(true)

        // Fetch game details
        const { game: gameData, error: gameError } = await getGame(gameId)
        if (gameError || !gameData) {
          setError('Failed to load game')
          return
        }

        // Only allow editing games in 'setup' status
        if (gameData.status !== 'setup') {
          setError('Can only edit games that are in setup status')
          return
        }

        setGame(gameData)

        // Fetch all game questions with their question details
        const { data: questionsData, error: questionsError } = await supabase
          .from('game_questions')
          .select(`
            id,
            game_id,
            round_id,
            question_id,
            display_order,
            randomization_seed,
            question:questions (
              id,
              category,
              question,
              a,
              b,
              c,
              d
            )
          `)
          .eq('game_id', gameId)
          .order('display_order')

        if (questionsError || !questionsData) {
          setError('Failed to load questions')
          return
        }

        setGameQuestions(questionsData as GameQuestionWithQuestion[])
      } catch (err) {
        console.error('Failed to fetch game data:', err)
        setError('Failed to load game data')
      } finally {
        setLoading(false)
      }
    }

    fetchGameData()
  }, [gameId, user])

  const handleRecycle = async (gameQuestionId: string) => {
    if (!gameId) return

    setRecycling(gameQuestionId)
    setError('')

    try {
      const result = await recycleQuestion(gameId, gameQuestionId)

      if (result.error) {
        setError(result.error.message)
        return
      }

      // Update the local state with the new question
      setGameQuestions((prev) =>
        prev.map((gq) =>
          gq.id === gameQuestionId
            ? { ...gq, question: result.newQuestion, question_id: result.newQuestion.id }
            : gq
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recycle question')
    } finally {
      setRecycling(null)
    }
  }

  const handleStartGame = () => {
    if (gameId) {
      navigate(`/host/games/${gameId}/control`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || !game) {
    return null
  }

  // Group questions by round
  const questionsByRound: Record<number, GameQuestionWithQuestion[]> = {}
  gameQuestions.forEach((gq) => {
    const roundNumber = Math.floor(gq.display_order / game.questions_per_round) + 1
    if (!questionsByRound[roundNumber]) {
      questionsByRound[roundNumber] = []
    }
    questionsByRound[roundNumber].push(gq)
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/host/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
          <Button onClick={handleStartGame}>Start Game</Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{game.name}</CardTitle>
            <CardDescription>
              Review and edit questions before starting the game. Click the recycle button to
              replace a question with another from the same category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Rounds:</span> {game.num_rounds}
              </div>
              <div>
                <span className="text-muted-foreground">Questions per round:</span>{' '}
                {game.questions_per_round}
              </div>
              {game.venue_name && (
                <div>
                  <span className="text-muted-foreground">Venue:</span> {game.venue_name}
                </div>
              )}
              {game.time_limit_seconds && (
                <div>
                  <span className="text-muted-foreground">Time limit:</span>{' '}
                  {game.time_limit_seconds}s
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {Object.entries(questionsByRound).map(([roundNum, questions]) => (
            <div key={roundNum}>
              <h2 className="text-xl font-semibold mb-4">Round {roundNum}</h2>
              <div className="space-y-4">
                {questions.map((gq, index) => {
                  const shuffledAnswers = getShuffledAnswersForDisplay(
                    gq.question,
                    gq.randomization_seed,
                    true // Reveal correct answer for host
                  )

                  return (
                    <Card key={gq.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{gq.question.category}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Question {index + 1}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{gq.question.question}</CardTitle>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecycle(gq.id)}
                            disabled={recycling === gq.id}
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${recycling === gq.id ? 'animate-spin' : ''}`}
                            />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {shuffledAnswers.map((answer) => (
                            <div
                              key={answer.letter}
                              className={`p-3 rounded-md border ${
                                answer.is_correct
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-muted border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground uppercase">
                                  {answer.letter}
                                </span>
                                <span>{answer.text}</span>
                                {answer.is_correct && (
                                  <Badge variant="default" className="ml-auto">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link to="/host/dashboard">Cancel</Link>
          </Button>
          <Button onClick={handleStartGame}>Start Game</Button>
        </div>
      </div>
    </div>
  )
}
