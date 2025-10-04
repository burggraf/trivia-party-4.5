import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getTeams } from '@/lib/services/team-service'
import { subscribeToGameEvents } from '@/lib/realtime/channels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface TeamWithCount extends Team {
  playerCount: number
}

export default function TVLobbyPage() {
  const { gameCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState<Game | null>(null)
  const [teams, setTeams] = useState<TeamWithCount[]>([])

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

        // Load teams with member counts
        const { teams: teamsData } = await getTeams(games.id)

        // Get member counts for each team
        const teamsWithCounts = await Promise.all(
          teamsData.map(async (team) => {
            const { count } = await supabase
              .from('team_members')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', team.id)

            return {
              ...team,
              playerCount: count || 0,
            }
          })
        )

        setTeams(teamsWithCounts)
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
      console.log('[TVLobbyPage] Received event:', eventType, payload)

      switch (eventType) {
        case 'state_changed':
          // Update game with new state
          if (payload.game) {
            setGame(payload.game)
          }

          // Navigate to question page when game starts
          if (payload.state === 'game_intro' || payload.state === 'question_active') {
            navigate(`/tv/${gameCode}/question`)
          }
          break

        case 'team_joined':
          // Reload teams when a new team joins
          if (game) {
            getTeams(game.id).then(async ({ teams: teamsData }) => {
              const teamsWithCounts = await Promise.all(
                teamsData.map(async (team) => {
                  const { count } = await supabase
                    .from('team_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('team_id', team.id)

                  return {
                    ...team,
                    playerCount: count || 0,
                  }
                })
              )
              setTeams(teamsWithCounts)
            })
          }
          break

        case 'team_left':
          // Reload teams when a player leaves
          if (game) {
            getTeams(game.id).then(async ({ teams: teamsData }) => {
              const teamsWithCounts = await Promise.all(
                teamsData.map(async (team) => {
                  const { count } = await supabase
                    .from('team_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('team_id', team.id)

                  return {
                    ...team,
                    playerCount: count || 0,
                  }
                })
              )
              setTeams(teamsWithCounts)
            })
          }
          break
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [game, gameCode, navigate])

  const totalPlayers = teams.reduce((sum, team) => sum + team.playerCount, 0)

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-2xl text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/player/join?code=${gameCode}`

  return (
    <div className="min-h-screen bg-background p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6">{game.name}</h1>
          <div className="flex items-center justify-center gap-6 mb-4">
            <Card className="inline-block">
              <CardContent className="pt-6 px-12 pb-6">
                <p className="text-2xl text-muted-foreground mb-2">Join with code</p>
                <p className="text-8xl font-bold font-mono tracking-wider">{gameCode}</p>
              </CardContent>
            </Card>
            <Card className="inline-block">
              <CardContent className="pt-6 px-6 pb-6">
                <p className="text-2xl text-muted-foreground mb-2 text-center">Or scan QR code</p>
                <QRCodeSVG value={joinUrl} size={200} level="M" includeMargin={true} />
              </CardContent>
            </Card>
          </div>
          <p className="text-2xl text-muted-foreground">
            {game.num_rounds} rounds • {game.questions_per_round} questions per round
          </p>
        </div>

        {/* Teams Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Teams Ready to Play
          </h2>
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {teams.map((team) => (
                <Card key={team.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-3xl">{team.team_name}</CardTitle>
                      <Badge variant="secondary" className="text-2xl px-4 py-2">
                        {team.playerCount} {team.playerCount === 1 ? 'player' : 'players'}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-3xl text-muted-foreground">No teams yet. Scan the QR code to join!</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="text-6xl font-bold mb-2">{teams.length}</p>
              <p className="text-2xl text-muted-foreground">Teams</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="text-6xl font-bold mb-2">{totalPlayers}</p>
              <p className="text-2xl text-muted-foreground">Players</p>
            </CardContent>
          </Card>
        </div>

        {/* Waiting Message */}
        <div className="text-center mt-12">
          <p className="text-3xl text-muted-foreground animate-pulse">
            Waiting for host to start game...
          </p>
        </div>
      </div>
    </div>
  )
}