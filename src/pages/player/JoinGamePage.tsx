import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { signInAnonymous } from '@/lib/services/auth-service'
import { findGameByCode } from '@/lib/services/game-service'
import { createTeam, joinTeam, getTeams } from '@/lib/services/team-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function JoinGamePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [gameCode, setGameCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [playerName, setPlayerName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Authenticate as anonymous user if not logged in
      let currentUser = user
      if (!currentUser) {
        const { user: anonUser, error: authError } = await signInAnonymous({
          displayName: playerName,
        })
        if (authError || !anonUser) {
          setError('Failed to create anonymous session')
          setLoading(false)
          return
        }
        currentUser = anonUser
      }

      // 2. Validate game code exists
      const { game, error: gameError } = await findGameByCode(gameCode)
      if (gameError || !game) {
        setError('Invalid game code. Please check and try again.')
        setLoading(false)
        return
      }

      // 3. Check if team exists with this name
      const { teams } = await getTeams(game.id)
      const existingTeam = teams.find(
        (t) => t.team_name.toLowerCase() === teamName.toLowerCase()
      )

      let teamId: string
      if (existingTeam) {
        // Join existing team
        const { success, error: joinError } = await joinTeam(existingTeam.id)
        if (joinError || !success) {
          setError(joinError?.message || 'Failed to join team')
          setLoading(false)
          return
        }
        teamId = existingTeam.id
      } else {
        // Create new team
        const { team: newTeam, error: createError } = await createTeam(
          game.id,
          teamName
        )
        if (createError || !newTeam) {
          setError(createError?.message || 'Failed to create team')
          setLoading(false)
          return
        }
        teamId = newTeam.id
      }

      // 4. Navigate to lobby
      navigate(`/player/lobby?gameId=${game.id}&teamId=${teamId}`)
    } catch (err) {
      console.error('Error joining game:', err)
      setError(err instanceof Error ? err.message : 'Failed to join game')
    } finally {
      setLoading(false)
    }
  }

  const formatGameCode = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setGameCode(formatted)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Join Game</CardTitle>
          <CardDescription>Enter the game code to join a trivia game</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameCode">
                Game Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gameCode"
                value={gameCode}
                onChange={(e) => formatGameCode(e.target.value)}
                placeholder="ABC123"
                className="text-center text-2xl font-mono tracking-wider"
                required
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-character code displayed on the TV screen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamName">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Quiz Wizards"
                required
              />
              <p className="text-xs text-muted-foreground">
                Join an existing team or create a new one
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerName">
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Joining...' : 'Join Game'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/player/login" className="hover:text-foreground">
              ← Back
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}