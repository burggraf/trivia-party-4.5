import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)

  // Mock question data - will be replaced with real-time data
  const mockQuestion = {
    round: 1,
    questionNumber: currentQuestion + 1,
    text: 'What is the capital of France?',
    answers: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris',
    category: 'Geography',
    timeLimit: 30,
  }

  const totalQuestions = 15
  const teamName = 'Quiz Wizards'

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !isAnswered && !isRevealed) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeRemaining, isAnswered, isRevealed])

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered || isRevealed) return

    setSelectedAnswer(answer)
    setIsAnswered(true)

    try {
      // TODO: Submit answer to API
      console.log('Submitting answer:', answer)
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setIsAnswered(false)
      setSelectedAnswer(null)
    }
  }

  const getAnswerButtonVariant = (answer: string) => {
    if (!isAnswered && !isRevealed) {
      return 'outline'
    }

    if (isRevealed) {
      if (answer === mockQuestion.correctAnswer) {
        return 'default'
      }
      if (answer === selectedAnswer && answer !== mockQuestion.correctAnswer) {
        return 'destructive'
      }
    }

    if (answer === selectedAnswer) {
      return 'default'
    }

    return 'outline'
  }

  const getAnswerButtonClassName = (answer: string) => {
    if (isRevealed && answer === mockQuestion.correctAnswer) {
      return 'bg-green-600 hover:bg-green-700 border-green-600'
    }
    if (isRevealed && answer === selectedAnswer && answer !== mockQuestion.correctAnswer) {
      return 'bg-red-600 hover:bg-red-700 border-red-600'
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary">
              Question {mockQuestion.questionNumber} of {totalQuestions}
            </Badge>
            <Badge variant={timeRemaining <= 10 ? 'destructive' : 'outline'} className="text-lg px-3 py-1">
              {timeRemaining}s
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Team: {teamName}</p>
            </div>
            <Badge variant="outline">Round {mockQuestion.round}</Badge>
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardDescription className="text-base">{mockQuestion.category}</CardDescription>
            <CardTitle className="text-2xl leading-tight">{mockQuestion.text}</CardTitle>
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

        {isRevealed && selectedAnswer === mockQuestion.correctAnswer && (
          <Alert className="mb-6 bg-green-50 border-green-500">
            <AlertDescription className="text-green-900">
              Correct! Your team earned a point!
            </AlertDescription>
          </Alert>
        )}

        {isRevealed && selectedAnswer !== mockQuestion.correctAnswer && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Incorrect. The correct answer was: {mockQuestion.correctAnswer}
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
            {mockQuestion.answers.map((answer) => (
              <Button
                key={answer}
                onClick={() => handleAnswerSelect(answer)}
                variant={getAnswerButtonVariant(answer)}
                className={`w-full h-auto py-4 text-lg justify-start ${getAnswerButtonClassName(answer)}`}
                disabled={isAnswered || isRevealed || timeRemaining === 0}
              >
                {answer}
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