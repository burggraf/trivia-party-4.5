import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGame } from '@/lib/services/game-service'
import { getTeams, getTeamMembers, leaveTeam } from '@/lib/services/team-service'
import { subscribeToGameEvents } from '@/lib/realtime/channels'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']
type TeamMember = Database['public']['Tables']['team_members']['Row']

export default function LobbyPage() {
  const [searchParams] = useSearchParams()
  const gameId = searchParams.get('gameId')
  const teamId = searchParams.get('teamId')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [game, setGame] = useState<Game | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  // Subscribe to real-time game events
  useEffect(() => {
    if (!gameId) return

    const channel = subscribeToGameEvents(gameId, (eventType, payload) => {
      console.log('[LobbyPage] Received event:', eventType, payload)

      if (eventType === 'state_changed') {
        // Navigate to game page when game state changes from setup
        const state = payload.state
        if (state && state !== 'setup') {
          console.log('[LobbyPage] Game state changed to', state, ', navigating to game page')
          navigate(`/player/game/${gameId}`)
        }
      } else if (eventType === 'game_started') {
        // Legacy event for backward compatibility
        console.log('[LobbyPage] Game started, navigating to game page')
        navigate(`/player/game/${gameId}`)
      } else if (eventType === 'question_advanced') {
        // If we receive question_advanced while in lobby, game must be active
        console.log('[LobbyPage] Received question_advanced, game is active, navigating to game page')
        navigate(`/player/game/${gameId}`)
      } else if (eventType === 'team_joined') {
        // Reload teams when a new team joins
        getTeams(gameId).then(({ teams: teamsData }) => {
          setTeams(teamsData)
        })
      } else if (eventType === 'team_left') {
        // Reload teams when a player leaves
        getTeams(gameId).then(({ teams: teamsData }) => {
          setTeams(teamsData)
        })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [gameId, navigate])

  useEffect(() => {
    if (!gameId || !teamId) {
      setError('Missing game or team information')
      setLoading(false)
      return
    }

    const loadLobbyData = async () => {
      try {
        console.log('[Lobby] Starting to load data for game:', gameId)
        setLoading(true)

        // Load game data
        console.log('[Lobby] Loading game...')
        const { game: gameData, error: gameError } = await getGame(gameId)
        if (gameError) {
          console.error('[Lobby] Game error:', gameError)
          setError('Failed to load game: ' + gameError.message)
          setLoading(false)
          return
        }
        if (!gameData) {
          console.error('[Lobby] No game data returned')
          setError('Failed to load game')
          setLoading(false)
          return
        }
        console.log('[Lobby] Game loaded:', gameData.name)
        setGame(gameData)

        // Check if game is already active (player joined after game started)
        if (gameData.status === 'active') {
          console.log('[Lobby] Game is already active, navigating to game page')
          navigate(`/player/game/${gameId}`)
          return
        }

        // Load all teams
        console.log('[Lobby] Loading teams...')
        const { teams: teamsData, error: teamsError } = await getTeams(gameId)
        if (teamsError) {
          console.error('[Lobby] Teams error:', teamsError)
          setError('Failed to load teams: ' + teamsError.message)
          setLoading(false)
          return
        }
        console.log('[Lobby] Teams loaded:', teamsData.length)
        setTeams(teamsData)

        // Load team members for each team
        console.log('[Lobby] Loading team members...')
        const membersMap: Record<string, TeamMember[]> = {}
        for (const team of teamsData) {
          console.log('[Lobby] Loading members for team:', team.team_name)
          const { members, error: membersError } = await getTeamMembers(team.id)
          if (membersError) {
            console.error('[Lobby] Members error for team', team.team_name, ':', membersError)
          } else if (members) {
            console.log('[Lobby] Members loaded for team', team.team_name, ':', members.length)
            membersMap[team.id] = members as TeamMember[]
          }
        }
        setTeamMembers(membersMap)

        // Find current team
        const team = teamsData.find((t) => t.id === teamId)
        if (team) {
          console.log('[Lobby] Current team found:', team.team_name)
          setCurrentTeam(team)
        } else {
          console.error('[Lobby] Current team not found in teams list')
        }

        console.log('[Lobby] All data loaded successfully')
        setLoading(false)
      } catch (err) {
        console.error('[Lobby] Unexpected error loading lobby:', err)
        setError('Failed to load lobby data: ' + (err instanceof Error ? err.message : 'Unknown error'))
        setLoading(false)
      }
    }

    loadLobbyData()
  }, [gameId, teamId])

  const handleLeaveGame = async () => {
    if (!teamId || !gameId) return

    setLeaving(true)
    const { error: leaveError } = await leaveTeam(teamId, gameId)

    if (leaveError) {
      setError('Failed to leave game: ' + leaveError.message)
      setLeaving(false)
      return
    }

    // Navigate back to join page
    navigate('/player/join')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error || !game || !currentTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Failed to load game data'}
              </AlertDescription>
            </Alert>
            <Link
              to="/player/join"
              className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Join Game
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPlayers = teams.reduce((sum, team) => {
    const members = teamMembers[team.id] || []
    return sum + members.length
  }, 0)

  const currentPlayerName = user?.user_metadata?.display_name || 'You'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge variant="outline" className="text-lg px-4 py-1">
              Game Code: {game.game_code}
            </Badge>
            <Badge className="text-base">
              {game.status === 'setup' ? 'Waiting to Start' : game.status === 'active' ? 'In Progress' : game.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {game.num_rounds} rounds • {game.questions_per_round} questions per round
          </p>
        </div>

        {/* Current Player Info */}
        <Alert className="mb-6">
          <AlertDescription>
            You are <strong>{currentPlayerName}</strong> on team <strong>{currentTeam.team_name}</strong>
          </AlertDescription>
        </Alert>

        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>Teams & Players</CardTitle>
            <CardDescription>
              {teams.length} {teams.length === 1 ? 'team' : 'teams'} • {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'} waiting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No teams yet</p>
            ) : (
              teams.map((team) => {
                const members = teamMembers[team.id] || []
                const isCurrentTeam = team.id === teamId

                return (
                  <div
                    key={team.id}
                    className={`p-4 rounded-lg border ${
                      isCurrentTeam ? 'bg-primary/5 border-primary' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{team.team_name}</h3>
                      <Badge variant="secondary">{members.length} {members.length === 1 ? 'player' : 'players'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {members.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No players yet</span>
                      ) : (
                        members.map((member, index) => {
                          const isCurrentPlayer = member.player_id === user?.id
                          const displayName = isCurrentPlayer ? 'You' : `Player ${index + 1}`

                          return (
                            <Badge
                              key={member.id}
                              variant={isCurrentPlayer ? 'default' : 'outline'}
                            >
                              {displayName}
                            </Badge>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Waiting Message */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Waiting for the host to start the game...
              </p>
              <p className="text-sm text-muted-foreground">
                More players can join using game code <strong>{game.game_code}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={handleLeaveGame}
            disabled={leaving}
          >
            {leaving ? 'Leaving...' : '← Leave Game'}
          </Button>
        </div>
      </div>
    </div>
  )
}