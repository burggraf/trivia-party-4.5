import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { createGame } from '@/lib/services/game-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const CATEGORIES = [
  'Arts & Literature',
  'Entertainment',
  'Food and Drink',
  'General Knowledge',
  'Geography',
  'History',
  'Pop Culture',
  'Science',
  'Sports',
  'Technology',
]

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [timeLimit, setTimeLimit] = useState('30')

  useEffect(() => {
    if (!user) {
      navigate('/host/login')
    }
  }, [user, navigate])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedCategories.length === 0) {
      setError('Please select at least one category')
      return
    }

    const totalQuestions = parseInt(numRounds) * parseInt(questionsPerRound)
    if (totalQuestions > 100) {
      setError('Total questions cannot exceed 100 (adjust rounds or questions per round)')
      return
    }

    setLoading(true)

    try {
      const scheduledAt = date && time ? new Date(`${date}T${time}`).toISOString() : undefined

      // Build rounds array - each round gets all selected categories
      const rounds = Array.from({ length: parseInt(numRounds) }, (_, i) => ({
        round_number: i + 1,
        categories: selectedCategories,
      }))

      const result = await createGame({
        name: gameName,
        venue_name: venue || undefined,
        scheduled_at: scheduledAt,
        num_rounds: parseInt(numRounds),
        questions_per_round: parseInt(questionsPerRound),
        time_limit_seconds: parseInt(timeLimit),
        rounds,
      })

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (result.warning) {
        setError(result.warning)
        return
      }

      // Navigate to the created game
      if (result.game) {
        navigate(`/host/games/${result.game.id}/control`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numRounds">
                      Rounds <span className="text-destructive">*</span>
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
                      Questions/Round <span className="text-destructive">*</span>
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
                  <div className="space-y-2">
                    <Label htmlFor="timeLimit">
                      Time Limit (s) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="10"
                      max="120"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Total questions: {parseInt(numRounds || '0') * parseInt(questionsPerRound || '0')}
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-medium mb-1">
                    Question Categories <span className="text-destructive">*</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select categories for questions (all categories will be used for each round)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>

                {selectedCategories.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
                  </div>
                )}
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
                  {loading ? 'Creating...' : 'Create Game'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}