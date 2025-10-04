import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { signInAnonymous } from '@/lib/services/auth-service'
import { findGameByCode } from '@/lib/services/game-service'
import { createTeam, joinTeam, getTeams } from '@/lib/services/team-service'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row'] & {
  team_members: Array<{
    id: string
    player_id: string
    joined_at: string
  }>
}

export default function JoinGamePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Game code entry
  const [gameCode, setGameCode] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [teams, setTeams] = useState<Team[]>([])

  // Step 2: Team selection or creation
  const [showTeamSelection, setShowTeamSelection] = useState(false)
  const [showNewTeamForm, setShowNewTeamForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  // Pre-fill game code from URL parameter
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase())
      // Auto-load game if code is provided
      handleLoadGame(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  const handleLoadGame = async (code: string) => {
    if (!code || code.length !== 6) return

    setLoading(true)
    setError('')

    try {
      // Find game by code
      const { game: gameData, error: gameError } = await findGameByCode(code)
      if (gameError || !gameData) {
        setError('Invalid game code. Please check and try again.')
        setLoading(false)
        return
      }

      setGame(gameData)

      // Load existing teams (already includes team_members from getTeams)
      const { teams: teamsData } = await getTeams(gameData.id)
      setTeams(teamsData as Team[])
      setShowTeamSelection(true)
      setLoading(false)
    } catch (err) {
      console.error('Error loading game:', err)
      setError('Failed to load game. Please try again.')
      setLoading(false)
    }
  }

  const handleSubmitGameCode = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleLoadGame(gameCode)
  }

  const handleJoinExistingTeam = async (team: Team) => {
    if (!user) {
      setError('Please enter your name first')
      setSelectedTeam(team)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { success, error: joinError } = await joinTeam(team.id)
      if (joinError || !success) {
        setError(joinError?.message || 'Failed to join team')
        setLoading(false)
        return
      }

      // Navigate to lobby
      if (game) {
        navigate(`/player/lobby?gameId=${game.id}&teamId=${team.id}`)
      }
    } catch (err) {
      console.error('Error joining team:', err)
      setError(err instanceof Error ? err.message : 'Failed to join team')
      setLoading(false)
    }
  }

  const handleCreateNewTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!game) return

    setLoading(true)
    setError('')

    try {
      // 1. Authenticate as anonymous user if not logged in
      let currentUser = user
      if (!currentUser) {
        const { user: anonUser, error: authError } = await signInAnonymous({
          displayName: playerName,
        })
        if (authError || !anonUser) {
          setError('Failed to create session')
          setLoading(false)
          return
        }
        currentUser = anonUser
      }

      // 2. Create new team
      const { team: newTeam, error: createError } = await createTeam(
        game.id,
        newTeamName
      )
      if (createError || !newTeam) {
        setError(createError?.message || 'Failed to create team')
        setLoading(false)
        return
      }

      // 3. Navigate to lobby
      navigate(`/player/lobby?gameId=${game.id}&teamId=${newTeam.id}`)
    } catch (err) {
      console.error('Error creating team:', err)
      setError(err instanceof Error ? err.message : 'Failed to create team')
      setLoading(false)
    }
  }

  const handleAuthenticateAndJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return

    setLoading(true)
    setError('')

    try {
      // Authenticate as anonymous user
      const { user: anonUser, error: authError } = await signInAnonymous({
        displayName: playerName,
      })
      if (authError || !anonUser) {
        setError('Failed to create session')
        setLoading(false)
        return
      }

      // Join the selected team
      const { success, error: joinError } = await joinTeam(selectedTeam.id)
      if (joinError || !success) {
        setError(joinError?.message || 'Failed to join team')
        setLoading(false)
        return
      }

      // Navigate to lobby
      if (game) {
        navigate(`/player/lobby?gameId=${game.id}&teamId=${selectedTeam.id}`)
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to join')
      setLoading(false)
    }
  }

  const formatGameCode = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setGameCode(formatted)
  }

  const isTeamFull = (team: Team) => {
    if (!game) return false
    const memberCount = team.team_members?.length || 0
    return memberCount >= game.max_players_per_team
  }

  // Step 1: Game code entry
  if (!showTeamSelection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Join Game</CardTitle>
            <CardDescription>Enter the game code to join a trivia game</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitGameCode} className="space-y-4">
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

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading || gameCode.length !== 6} className="w-full" size="lg">
                {loading ? 'Loading...' : 'Continue'}
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

  // Step 2a: Authenticate for selected team (if not logged in)
  if (selectedTeam && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Join {selectedTeam.team_name}</CardTitle>
            <CardDescription>Enter your name to join this team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthenticateAndJoin} className="space-y-4">
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
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedTeam(null)
                    setError('')
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1" size="lg">
                  {loading ? 'Joining...' : 'Join Team'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2b: Create new team form
  if (showNewTeamForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create New Team</CardTitle>
            <CardDescription>Start a new team for {game?.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNewTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newTeamName">
                  Team Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newTeamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Quiz Wizards"
                  required
                  autoFocus
                />
              </div>

              {!user && (
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
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewTeamForm(false)
                    setError('')
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1" size="lg">
                  {loading ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Team selection
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{game?.name}</CardTitle>
          <CardDescription>Join an existing team or create a new one</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Teams */}
          {teams.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Existing Teams</h3>
              <div className="grid gap-3">
                {teams.map((team) => {
                  const memberCount = team.team_members?.length || 0
                  const isFull = isTeamFull(team)

                  return (
                    <Card
                      key={team.id}
                      className={`cursor-pointer transition-colors ${
                        isFull
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:border-primary'
                      }`}
                      onClick={() => !isFull && handleJoinExistingTeam(team)}
                    >
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-lg">{team.team_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {memberCount} / {game?.max_players_per_team} players
                            </p>
                          </div>
                          <Badge variant={isFull ? 'secondary' : 'default'}>
                            {isFull ? 'Full' : 'Join'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Create New Team Button */}
          <div className="space-y-3">
            {teams.length > 0 && <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>}
            <Button
              onClick={() => setShowNewTeamForm(true)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create New Team
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <button
              onClick={() => {
                setShowTeamSelection(false)
                setGame(null)
                setTeams([])
                setError('')
              }}
              className="hover:text-foreground"
            >
              ← Use different game code
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
