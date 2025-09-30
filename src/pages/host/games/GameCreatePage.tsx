import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function GameCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [gameName, setGameName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [numRounds, setNumRounds] = useState('3')
  const [questionsPerRound, setQuestionsPerRound] = useState('5')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Implement game creation logic
      // For now, just navigate to dashboard
      console.log('Creating game:', {
        gameName,
        date,
        time,
        venue,
        numRounds: parseInt(numRounds),
        questionsPerRound: parseInt(questionsPerRound),
      })
      navigate('/host/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    navigate('/host/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            to="/host/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>
              Set up your trivia game with rounds, questions, and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Details Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gameName">
                    Game Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gameName"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="Monday Night Trivia"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date (Optional)</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time (Optional)</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue (Optional)</Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="The Local Pub"
                  />
                </div>
              </div>

              {/* Game Configuration Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Game Configuration</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numRounds">
                      Number of Rounds <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="numRounds"
                      type="number"
                      min="1"
                      max="10"
                      value={numRounds}
                      onChange={(e) => setNumRounds(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="questionsPerRound">
                      Questions per Round <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="questionsPerRound"
                      type="number"
                      min="1"
                      max="20"
                      value={questionsPerRound}
                      onChange={(e) => setQuestionsPerRound(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Total questions: {parseInt(numRounds || '0') * parseInt(questionsPerRound || '0')}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/host/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Continue to Question Selection'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}