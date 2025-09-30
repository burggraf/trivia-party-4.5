import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame, getCurrentQuestion, advanceGameState, pauseGame, resumeGame, endGame, getGameScores, type GameState } from '@/lib/services/game-service'
import { getTeams } from '@/lib/services/team-service'
import { supabase } from '@/lib/supabase/client'
import { subscribeToGameEvents } from '@/lib/realtime/channels'
import { answersFromQuestion, shuffleAnswers } from '@/lib/game/answer-shuffling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { GameIntroScreen } from '@/components/shared/GameIntroScreen'
import { RoundIntroScreen } from '@/components/shared/RoundIntroScreen'
import { RoundScoresScreen } from '@/components/shared/RoundScoresScreen'
import { GameCompleteScreen } from '@/components/shared/GameCompleteScreen'
import { GameThanksScreen } from '@/components/shared/GameThanksScreen'
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
  const [teamScores, setTeamScores] = useState<Array<{ teamId: string; teamName: string; score: number; cumulativeTime: number; accuracy: number }>>([])
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
          const gameQuestion = questionData as any
          const q = gameQuestion.question // Access nested question object

          // Shuffle answers using seed for consistent ordering
          const answerObjects = answersFromQuestion(q, 'a')
          const shuffledAnswers = shuffleAnswers(answerObjects, gameQuestion.randomization_seed)
          const correctAnswerIdx = shuffledAnswers.findIndex(a => a.is_correct)

          setQuestion({
            id: q.id,
            category: q.category,
            question: q.question,
            answers: shuffledAnswers.map(a => a.text),
            correctAnswerIndex: correctAnswerIdx,
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

  // Subscribe to real-time game events
  useEffect(() => {
    if (!gameId) return

    const channel = subscribeToGameEvents(gameId, (eventType, payload) => {
      console.log('[GameControlPage] Received event:', eventType, payload)

      switch (eventType) {
        case 'team_joined':
          // Reload teams when a new team joins
          getTeams(gameId).then(({ teams: teamsData }) => {
            setTeams(teamsData as Team[])
          })
          break

        case 'game_paused':
        case 'game_resumed':
          // Update game state
          if (payload.game) {
            setGame(payload.game)
          }
          break

        case 'state_changed':
          // Update game with new state
          if (payload.game) {
            setGame(payload.game)
          }
          // Load question if transitioning to question_active
          if (payload.state === 'question_active' && payload.question && payload.randomizationSeed) {
            const q = payload.question

            // Shuffle answers using seed for consistent ordering
            const answerObjects = answersFromQuestion(q, 'a')
            const shuffledAnswers = shuffleAnswers(answerObjects, payload.randomizationSeed)
            const correctAnswerIdx = shuffledAnswers.findIndex(a => a.is_correct)

            setQuestion({
              id: q.id,
              category: q.category,
              question: q.question,
              answers: shuffledAnswers.map(a => a.text),
              correctAnswerIndex: correctAnswerIdx,
            })
          }
          // Navigate to scores page if game is complete
          if (payload.state === 'game_thanks') {
            navigate(`/host/games/${gameId}/scores`)
          }
          break
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [gameId, navigate])

  const handleNext = async () => {
    if (!gameId) return
    setActionLoading(true)

    const { game: updatedGame, nextState, error: stateError } = await advanceGameState(gameId)

    if (stateError) {
      setError('Failed to advance game state: ' + stateError.message)
    } else if (updatedGame) {
      setGame(updatedGame)

      // Load question if moving to question_active state
      if (nextState === 'question_active') {
        const { question: questionData } = await getCurrentQuestion(gameId)
        if (questionData) {
          const gameQuestion = questionData as any
          const q = gameQuestion.question

          // Shuffle answers using seed for consistent ordering
          const answerObjects = answersFromQuestion(q, 'a')
          const shuffledAnswers = shuffleAnswers(answerObjects, gameQuestion.randomization_seed)
          const correctAnswerIdx = shuffledAnswers.findIndex(a => a.is_correct)

          setQuestion({
            id: q.id,
            category: q.category,
            question: q.question,
            answers: shuffledAnswers.map(a => a.text),
            correctAnswerIndex: correctAnswerIdx,
          })
        }
      }

      // Load team scores for round_scores or game_complete states
      if (nextState === 'round_scores' || nextState === 'game_complete') {
        const { scores } = await getGameScores(gameId)
        setTeamScores(scores)
      }

      // Navigate to scores page from game_thanks state
      if (nextState === null) {
        navigate(`/host/games/${gameId}/scores`)
      }
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

  const handlePreviousQuestion = async () => {
    if (!gameId || !game || game.current_question_index === 0) return
    setActionLoading(true)

    try {
      // Update game to previous question index
      const { data: updatedGame, error } = await supabase
        .from('games')
        .update({ current_question_index: game.current_question_index - 1 })
        .eq('id', gameId)
        .select()
        .single()

      if (error) {
        setError('Failed to go to previous question')
      } else if (updatedGame) {
        setGame(updatedGame)
        // Reload question
        const { question: questionData } = await getCurrentQuestion(gameId)
        if (questionData) {
          const gameQuestion = questionData as any
          const q = gameQuestion.question
          setQuestion({
            id: q.id,
            category: q.category,
            question: q.question,
            answers: [q.a, q.b, q.c, q.d],
            correctAnswerIndex: 0,
          })
        }
      }
    } catch (err) {
      console.error('Error navigating to previous question:', err)
      setError('Failed to navigate to previous question')
    }

    setActionLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !game) return null

  const gameState = (game.game_state || 'setup') as GameState
  const currentRound = Math.floor(game.current_question_index / game.questions_per_round) + 1
  const totalQuestions = game.num_rounds * game.questions_per_round

  // Render full-screen state components
  if (gameState === 'game_intro') {
    return (
      <div className="relative">
        <GameIntroScreen game={game} isHost />
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNext} size="lg" disabled={actionLoading}>
            {actionLoading ? 'Loading...' : 'Next'}
          </Button>
        </div>
      </div>
    )
  }

  if (gameState === 'round_intro') {
    return (
      <div className="relative">
        <RoundIntroScreen game={game} roundNumber={currentRound} isHost />
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNext} size="lg" disabled={actionLoading}>
            {actionLoading ? 'Loading...' : 'Start Questions'}
          </Button>
        </div>
      </div>
    )
  }

  if (gameState === 'round_scores') {
    return (
      <div className="relative">
        <RoundScoresScreen
          game={game}
          roundNumber={currentRound}
          teams={teamScores}
          isHost
        />
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNext} size="lg" disabled={actionLoading}>
            {actionLoading ? 'Loading...' : currentRound < game.num_rounds ? 'Next Round' : 'Final Scores'}
          </Button>
        </div>
      </div>
    )
  }

  if (gameState === 'game_complete') {
    return (
      <div className="relative">
        <GameCompleteScreen
          game={game}
          teams={teamScores}
          totalQuestions={totalQuestions}
          isHost
        />
        <div className="fixed bottom-8 right-8">
          <Button onClick={handleNext} size="lg" disabled={actionLoading}>
            {actionLoading ? 'Loading...' : 'Continue'}
          </Button>
        </div>
      </div>
    )
  }

  if (gameState === 'game_thanks') {
    return (
      <div className="relative">
        <GameThanksScreen game={game} isHost />
        <div className="fixed bottom-8 right-8">
          <Button onClick={() => navigate(`/host/games/${gameId}/scores`)} size="lg">
            View Final Scores
          </Button>
        </div>
      </div>
    )
  }

  // Default layout for setup, question_active, and question_revealed states
  const isAnswerRevealed = gameState === 'question_revealed'

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
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Game Code: {game.game_code}</p>
              <Link
                to={`/tv/${game.game_code}/question`}
                target="_blank"
                className="text-sm text-primary hover:underline"
              >
                Open TV Display →
              </Link>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={game.status === 'paused' ? 'outline' : game.status === 'active' ? 'default' : 'secondary'}>
              {game.status === 'setup' ? 'Setup' : game.status === 'paused' ? 'Paused' : game.status === 'active' ? 'Active' : 'Completed'}
            </Badge>
            {gameState !== 'setup' && (
              <Badge variant="secondary">
                Question {game.current_question_index + 1} of {totalQuestions}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Display */}
          <div className="lg:col-span-2 space-y-6">
            {gameState === 'setup' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Game Not Started</CardTitle>
                  <CardDescription>Click "Start Game" to begin</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleNext} size="lg" disabled={actionLoading}>
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
                        Round {currentRound} - Question {(game.current_question_index % game.questions_per_round) + 1}
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
                            isAnswerRevealed && idx === question.correctAnswerIndex
                              ? 'bg-green-50 border-green-500'
                              : 'bg-card'
                          }`}
                        >
                          <span className="font-medium">{answer}</span>
                          {isAnswerRevealed && idx === question.correctAnswerIndex && (
                            <span className="ml-2 text-green-600">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isAnswerRevealed && (
                    <Alert>
                      <AlertDescription>
                        Correct answer: <strong>{question.answers[question.correctAnswerIndex]}</strong>
                      </AlertDescription>
                    </Alert>
                  )}
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
                {gameState !== 'setup' && (
                  <Button
                    onClick={handleNext}
                    className="w-full"
                    size="lg"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Loading...' : 'Next'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  {teams.length} {teams.length === 1 ? 'team' : 'teams'}{' '}
                  {teams.length > 0 ? 'playing' : 'registered'}
                </CardDescription>
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