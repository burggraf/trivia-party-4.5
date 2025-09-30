import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LobbyPage() {
  const { gameCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Mock data - will be replaced with real-time updates
  const mockGameData = {
    name: 'Monday Night Trivia',
    status: 'waiting',
    totalRounds: 3,
    questionsPerRound: 5,
  }

  const mockTeams = [
    {
      name: 'Quiz Wizards',
      players: ['Alice', 'Bob', 'Charlie'],
    },
    {
      name: 'Brain Trust',
      players: ['David', 'Eve', 'Frank', 'Grace'],
    },
    {
      name: 'Trivia Masters',
      players: ['Henry', 'Iris'],
    },
  ]

  const currentTeam = 'Quiz Wizards'
  const currentPlayer = 'Alice'

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)

    // TODO: Subscribe to real-time game state changes
    // Listen for game start event and navigate to game page
  }, [gameCode, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{mockGameData.name}</h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Badge variant="outline" className="text-lg px-4 py-1">
              Game Code: {gameCode}
            </Badge>
            <Badge className="text-base">Waiting to Start</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {mockGameData.totalRounds} rounds • {mockGameData.questionsPerRound} questions per round
          </p>
        </div>

        {/* Current Player Info */}
        <Alert className="mb-6">
          <AlertDescription>
            You are <strong>{currentPlayer}</strong> on team <strong>{currentTeam}</strong>
          </AlertDescription>
        </Alert>

        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>Teams & Players</CardTitle>
            <CardDescription>
              {mockTeams.length} teams • {mockTeams.reduce((sum, team) => sum + team.players.length, 0)} players waiting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTeams.map((team) => (
              <div
                key={team.name}
                className={`p-4 rounded-lg border ${
                  team.name === currentTeam ? 'bg-primary/5 border-primary' : 'bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  <Badge variant="secondary">{team.players.length} players</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {team.players.map((player) => (
                    <Badge
                      key={player}
                      variant={player === currentPlayer ? 'default' : 'outline'}
                    >
                      {player}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
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
                More players can join using game code <strong>{gameCode}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/player/join" className="hover:text-foreground">
            ← Leave Game
          </Link>
        </div>
      </div>
    </div>
  )
}