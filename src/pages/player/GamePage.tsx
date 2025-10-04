import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame, getCurrentQuestion, submitAnswer, getGameScores, type GameState } from '@/lib/services/game-service'
import { getMyTeam } from '@/lib/services/team-service'
import { subscribeToGameEvents } from '@/lib/realtime/channels'
import { answersFromQuestion, shuffleAnswers } from '@/lib/game/answer-shuffling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GameIntroScreen } from '@/components/shared/GameIntroScreen'
import { RoundIntroScreen } from '@/components/shared/RoundIntroScreen'
import { RoundScoresScreen } from '@/components/shared/RoundScoresScreen'
import { GameCompleteScreen } from '@/components/shared/GameCompleteScreen'
import { GameThanksScreen } from '@/components/shared/GameThanksScreen'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface QuestionData {
  id: string
  gameQuestionId: string
  category: string
  question: string
  answers: string[] // Pre-shuffled by server
  correctAnswerIndex?: number // Only set when answer is revealed
  timeLimit: number
}

export default function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Game state
  const [game, setGame] = useState<Game | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamScores, setTeamScores] = useState<Array<{ teamId: string; teamName: string; score: number; cumulativeTime: number }>>([])

  // Load game data
  useEffect(() => {
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
        setTimeRemaining(gameData.time_limit_seconds)

        // Check initial game state for revealed status
        if (gameData.game_state === 'question_revealed') {
          setIsRevealed(true)
        } else if (gameData.game_state === 'question_active') {
          // If joining mid-question, set start time to now
          setQuestionStartTime(Date.now())
        }

        // Load team
        const { team: teamData, error: teamError } = await getMyTeam(gameId)
        if (teamError || !teamData) {
          setError('Failed to load team')
          return
        }
        setTeam(teamData as Team)

        // Load scores if game is in score display state
        if (gameData.game_state === 'round_scores' || gameData.game_state === 'game_complete') {
          const { scores } = await getGameScores(gameId)
          if (scores) {
            setTeamScores(scores)
          }
        }

        // SECURITY: Players should NOT load questions directly from database
        // They should wait for broadcast from host
        // This initial load is only for re-joining mid-game
        // For now, skip loading question - it will come via broadcast

        setLoading(false)
      } catch (err) {
        console.error('Error loading game:', err)
        setError('Failed to load game data')
        setLoading(false)
      }
    }

    loadGameData()
  }, [gameId, user])

  // Subscribe to real-time game events
  useEffect(() => {
    if (!gameId) return

    const channel = subscribeToGameEvents(gameId, (eventType, payload) => {
      console.log('[GamePage] Received event:', eventType, payload)

      switch (eventType) {
        case 'game_paused':
          if (payload.game) {
            setGame(payload.game)
          }
          break

        case 'game_resumed':
          if (payload.game) {
            setGame(payload.game)
          }
          break

        case 'state_changed':
          // Update game with new state
          if (payload.game) {
            setGame(payload.game)
          }

          // Handle different state transitions
          if (payload.state === 'question_active') {
            // Reset state for new question
            setIsAnswered(false)
            setSelectedAnswer(null)
            setIsRevealed(false)
            setQuestionStartTime(Date.now())

            if (payload.game) {
              setTimeRemaining(payload.game.time_limit_seconds)
            }

            if (payload.question && payload.gameQuestionId) {
              const q = payload.question

              // SECURITY: Server sends pre-shuffled answers only (no letters, no correct flag)
              setQuestion({
                id: q.id,
                gameQuestionId: payload.gameQuestionId,
                category: q.category,
                question: q.question,
                answers: q.answers, // Already shuffled by server
                timeLimit: payload.game?.time_limit_seconds || 30,
              })
            }
          } else if (payload.state === 'question_revealed') {
            setIsRevealed(true)
            // Server sends correct answer index (0-3)
            if (payload.correctAnswerIndex !== undefined) {
              setQuestion(prev => prev ? { ...prev, correctAnswerIndex: payload.correctAnswerIndex } : null)
            }
          } else if (payload.state === 'round_scores' || payload.state === 'game_complete') {
            // Fetch team scores for display
            getGameScores(gameId).then(({ scores }) => {
              if (scores) {
                setTeamScores(scores)
              }
            }).catch(err => {
              console.error('Failed to load scores:', err)
            })
          } else if (payload.state === 'game_thanks') {
            // Navigate to results page
            navigate(`/player/results?gameId=${gameId}`)
          }
          break
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [gameId, navigate])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !isAnswered && !isRevealed) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeRemaining, isAnswered, isRevealed])

  const handleAnswerSelect = async (answer: string, index: number) => {
    if (isAnswered || isRevealed || !question || !team || !game) return

    // Only allow answering in question_active state
    const currentState = (game.game_state || 'setup') as GameState
    if (currentState !== 'question_active') return

    setSelectedAnswer(answer)
    setIsAnswered(true)

    try {
      // Calculate time taken using high-resolution timestamp
      const answerTimeMs = questionStartTime > 0 ? Date.now() - questionStartTime : 0

      // SECURITY: Submit answer INDEX (0-3), not letter
      // Server will validate against shuffle seed to determine correctness
      const { error: submitError } = await submitAnswer({
        gameQuestionId: question.gameQuestionId,
        teamId: team.id,
        selectedAnswerIndex: index,
        answerTimeMs,
      })

      if (submitError) {
        // Show error message
        setError(submitError.message)
        // Only reset state if it's not a "already answered" error
        if (!submitError.message.includes('already answered')) {
          setIsAnswered(false)
          setSelectedAnswer(null)
        }
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setError('Failed to submit answer')
      setIsAnswered(false)
      setSelectedAnswer(null)
    }
  }

  const getAnswerButtonVariant = (answer: string) => {
    if (!isAnswered && !isRevealed) {
      return 'outline'
    }

    if (answer === selectedAnswer) {
      return 'default'
    }

    return 'outline'
  }

  const getAnswerButtonClassName = (answer: string, index: number) => {
    if (!isRevealed || !question) return ''

    // Show correct answer in green with dark text for contrast
    if (index === question.correctAnswerIndex) {
      return 'bg-green-100 border-green-500 hover:bg-green-100 text-green-900'
    }

    // Show selected incorrect answer in red with dark text for contrast
    if (answer === selectedAnswer && index !== question.correctAnswerIndex) {
      return 'bg-red-100 border-red-500 hover:bg-red-100 text-red-900'
    }

    return ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    )
  }

  // Check game state early - some states don't require question data
  const gameState = (game?.game_state || 'setup') as GameState
  const totalQuestions = game ? game.num_rounds * game.questions_per_round : 0
  const currentRound = game ? Math.floor(game.current_question_index / game.questions_per_round) + 1 : 1
  const questionNumber = game ? game.current_question_index + 1 : 1

  // Render full-screen state components (same screens as host sees)
  if (game && gameState === 'game_intro') {
    return <GameIntroScreen game={game} />
  }

  if (game && gameState === 'round_intro') {
    return <RoundIntroScreen game={game} roundNumber={currentRound} />
  }

  if (game && gameState === 'round_scores') {
    return (
      <RoundScoresScreen
        game={game}
        roundNumber={currentRound}
        teams={teamScores}
      />
    )
  }

  if (game && gameState === 'game_complete') {
    return (
      <GameCompleteScreen
        game={game}
        teams={teamScores}
      />
    )
  }

  if (game && gameState === 'game_thanks') {
    return <GameThanksScreen game={game} />
  }

  // Show waiting screen for setup state
  if (game && team && gameState === 'setup') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle className="text-center">Waiting for Game to Start</CardTitle>
            <CardDescription className="text-center">
              Team: {team.team_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">The host will start the game shortly...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error check for states that require question data
  if (error || !game || !team || !question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || 'Failed to load game'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default: question display for question_active and question_revealed states
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant={timeRemaining <= 10 ? 'destructive' : 'outline'} className="text-lg px-3 py-1">
              {timeRemaining}s
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Team: {team.team_name}</p>
            </div>
            <Badge variant="outline">Round {currentRound}</Badge>
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardDescription className="text-base">{question.category}</CardDescription>
            <CardTitle className="text-2xl leading-tight">{question.question}</CardTitle>
          </CardHeader>
        </Card>

        {/* Answer Status */}
        {isAnswered && !isRevealed && (
          <Alert className="mb-6">
            <AlertDescription>
              Answer submitted! Waiting for other teams...
            </AlertDescription>
          </Alert>
        )}

        {/* Answer Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Your Answer</CardTitle>
            <CardDescription>
              {isAnswered ? 'Your team has locked in an answer' : 'First team member to answer locks it in'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.answers.map((answer, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(answer, index)}
                variant={getAnswerButtonVariant(answer)}
                className={`w-full h-auto py-4 text-lg justify-start ${getAnswerButtonClassName(answer, index)}`}
                disabled={isAnswered || isRevealed || timeRemaining === 0}
              >
                <span className="flex items-center gap-2 w-full">
                  <span className="flex-1 text-left">{answer}</span>
                  {isRevealed && index === question.correctAnswerIndex && (
                    <span className="text-green-600 font-bold">✓ Correct</span>
                  )}
                  {isRevealed && answer === selectedAnswer && index !== question.correctAnswerIndex && (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {timeRemaining === 0 && !isAnswered && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              Time's up! Waiting for the host to reveal the answer...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}