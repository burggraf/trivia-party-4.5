import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function GameControlPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Mock game state - will be replaced with actual data
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [teamsAnswered, setTeamsAnswered] = useState(0)
  const [totalTeams, setTotalTeams] = useState(4)

  // Mock question data - will be replaced with actual data
  const mockQuestion = {
    round: 1,
    questionNumber: currentQuestion + 1,
    text: 'What is the capital of France?',
    answers: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris',
    category: 'Geography',
  }

  const totalQuestions = 15 // Will come from game data

  useEffect(() => {
    if (!user) {
      navigate('/host/login')
    }
  }, [user, navigate])

  const handleAdvanceQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setIsRevealed(false)
      setTeamsAnswered(0)
    } else {
      // Game completed
      navigate(`/host/games/${gameId}/scores`)
    }
  }

  const handleRevealAnswer = () => {
    setIsRevealed(true)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleEndGame = () => {
    if (confirm('Are you sure you want to end the game early?')) {
      navigate(`/host/games/${gameId}/scores`)
    }
  }

  if (!user) return null

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
            <h1 className="text-2xl font-bold mt-2">Game Control</h1>
            <p className="text-sm text-muted-foreground">Game ID: {gameId}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={isPaused ? 'outline' : 'default'}>
              {isPaused ? 'Paused' : 'Active'}
            </Badge>
            <Badge variant="secondary">
              Question {currentQuestion + 1} of {totalQuestions}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Round {mockQuestion.round} - Question {mockQuestion.questionNumber}</CardTitle>
                    <CardDescription>Category: {mockQuestion.category}</CardDescription>
                  </div>
                  <Badge variant="outline">{teamsAnswered} / {totalTeams} teams answered</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg font-medium">{mockQuestion.text}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Answer Options:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {mockQuestion.answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          isRevealed && answer === mockQuestion.correctAnswer
                            ? 'bg-green-50 border-green-500'
                            : 'bg-card'
                        }`}
                      >
                        <span className="font-medium">{answer}</span>
                        {isRevealed && answer === mockQuestion.correctAnswer && (
                          <span className="ml-2 text-green-600">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isRevealed && (
                  <Alert>
                    <AlertDescription>
                      Correct answer: <strong>{mockQuestion.correctAnswer}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
                <CardDescription>Manage game flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isRevealed ? (
                  <Button
                    onClick={handleRevealAnswer}
                    className="w-full"
                    size="lg"
                  >
                    Reveal Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleAdvanceQuestion}
                    className="w-full"
                    size="lg"
                  >
                    {currentQuestion < totalQuestions - 1 ? 'Next Question' : 'View Final Scores'}
                  </Button>
                )}

                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="w-full"
                >
                  {isPaused ? 'Resume Game' : 'Pause Game'}
                </Button>

                <Button
                  onClick={handleEndGame}
                  variant="destructive"
                  className="w-full"
                >
                  End Game Early
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teams</CardTitle>
                <CardDescription>{totalTeams} teams playing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Quiz Wizards</span>
                    <Badge variant="secondary">3 players</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Brain Trust</span>
                    <Badge variant="secondary">4 players</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Trivia Masters</span>
                    <Badge variant="secondary">2 players</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Know It Alls</span>
                    <Badge variant="secondary">5 players</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isPaused && (
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