import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TVQuestionPage() {
  const { gameCode } = useParams()
  const [timeRemaining, setTimeRemaining] = useState(30)

  // Mock question data - will be replaced with real-time data
  const mockQuestion = {
    round: 1,
    questionNumber: 1,
    text: 'What is the capital of France?',
    category: 'Geography',
    timeLimit: 30,
  }

  const mockStats = {
    teamsAnswered: 2,
    totalTeams: 4,
  }

  const totalQuestions = 15

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeRemaining])

  // TODO: Subscribe to real-time updates for:
  // - Question changes
  // - Teams answered count
  // - Timer sync

  const progressPercentage = (mockStats.teamsAnswered / mockStats.totalTeams) * 100
  const timePercentage = (timeRemaining / mockQuestion.timeLimit) * 100

  return (
    <div className="min-h-screen bg-background p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-2xl px-6 py-2">
              Round {mockQuestion.round}
            </Badge>
            <Badge variant="secondary" className="text-2xl px-6 py-2">
              Question {mockQuestion.questionNumber} of {totalQuestions}
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
            {mockQuestion.category}
          </Badge>
        </div>

        {/* Question */}
        <Card className="mb-12 border-4">
          <CardContent className="pt-12 pb-12">
            <p className="text-6xl font-bold text-center leading-tight">
              {mockQuestion.text}
            </p>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-2xl text-muted-foreground">Teams Answered</p>
            <p className="text-3xl font-bold">
              {mockStats.teamsAnswered} / {mockStats.totalTeams}
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