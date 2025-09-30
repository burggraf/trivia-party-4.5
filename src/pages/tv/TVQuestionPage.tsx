import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getGame, getCurrentQuestion } from '@/lib/services/game-service'
import { getTeams } from '@/lib/services/team-service'
import { subscribeToGameEvents, subscribeToTVUpdates } from '@/lib/realtime/channels'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface QuestionData {
  id: string
  category: string
  question: string
  timeLimit: number
}

export default function TVQuestionPage() {
  const { gameCode } = useParams()
  const navigate = useNavigate()

  const [game, setGame] = useState<Game | null>(null)
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [teamsAnswered, setTeamsAnswered] = useState(0)
  const [totalTeams, setTotalTeams] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load initial game data
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
        setTimeRemaining(games.time_limit_seconds)

        // Load teams count
        const { teams } = await getTeams(games.id)
        setTotalTeams(teams.length)

        // Load current question
        const { question: questionData } = await getCurrentQuestion(games.id)
        if (questionData) {
          const gameQuestion = questionData as any
          const q = gameQuestion.question
          setQuestion({
            id: q.id,
            category: q.category,
            question: q.question,
            timeLimit: games.time_limit_seconds,
          })
        }

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
      console.log('[TVQuestionPage] Received event:', eventType, payload)

      switch (eventType) {
        case 'question_advanced':
          // Reset timer and update question
          if (payload.game) {
            setGame(payload.game)
            setTimeRemaining(payload.game.time_limit_seconds)
          }
          if (payload.question) {
            const q = payload.question
            setQuestion({
              id: q.id,
              category: q.category,
              question: q.question,
              timeLimit: payload.game?.time_limit_seconds || 30,
            })
          }
          setTeamsAnswered(0) // Reset count for new question
          break

        case 'game_completed':
          navigate(`/tv/${gameCode}/scores`)
          break

        case 'team_joined':
          // Reload teams count
          if (game) {
            getTeams(game.id).then(({ teams }) => {
              setTotalTeams(teams.length)
            })
          }
          break
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [game, gameCode, navigate])

  // Subscribe to TV-specific updates (teams answered count)
  useEffect(() => {
    if (!game) return

    const channel = subscribeToTVUpdates(game.id, (payload) => {
      setTeamsAnswered(payload.teams_answered_count)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [game])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && game?.status === 'active') {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeRemaining, game?.status])

  if (loading || !game || !question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-2xl">Loading...</p>
      </div>
    )
  }

  const totalQuestions = game.num_rounds * game.questions_per_round
  const currentQuestionNumber = game.current_question_index + 1
  const currentRound = Math.floor(game.current_question_index / game.questions_per_round) + 1

  const progressPercentage = totalTeams > 0 ? (teamsAnswered / totalTeams) * 100 : 0
  const timePercentage = (timeRemaining / question.timeLimit) * 100

  return (
    <div className="min-h-screen bg-background p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-2xl px-6 py-2">
              Round {currentRound}
            </Badge>
            <Badge variant="secondary" className="text-2xl px-6 py-2">
              Question {currentQuestionNumber} of {totalQuestions}
            </Badge>
          </div>
          <Badge
            variant={timeRemaining <= 10 ? 'destructive' : 'default'}
            className="text-4xl px-8 py-3 font-mono"
          >
            {timeRemaining}s
          </Badge>
        </div>

        {/* Category */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="text-3xl px-8 py-3">
            {question.category}
          </Badge>
        </div>

        {/* Question */}
        <Card className="mb-12 border-4">
          <CardContent className="pt-12 pb-12">
            <p className="text-6xl font-bold text-center leading-tight">
              {question.question}
            </p>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-2xl text-muted-foreground">Teams Answered</p>
            <p className="text-3xl font-bold">
              {teamsAnswered} / {totalTeams}
            </p>
          </div>
          <div className="h-8 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Timer Bar */}
        <div className="mt-8">
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining <= 10 ? 'bg-destructive' : 'bg-green-600'
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-2xl text-muted-foreground">
            Submit your answers on your device
          </p>
        </div>
      </div>
    </div>
  )
}