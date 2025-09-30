import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TVLobbyPage() {
  const { gameCode } = useParams()
  const [loading, setLoading] = useState(true)

  // Mock data - will be replaced with real-time updates
  const mockGameData = {
    name: 'Monday Night Trivia',
    totalRounds: 3,
    questionsPerRound: 5,
  }

  const mockTeams = [
    { name: 'Quiz Wizards', playerCount: 3 },
    { name: 'Brain Trust', playerCount: 4 },
    { name: 'Trivia Masters', playerCount: 2 },
    { name: 'Know It Alls', playerCount: 5 },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)

    // TODO: Subscribe to real-time team updates
    // Listen for game start event
  }, [gameCode])

  const totalPlayers = mockTeams.reduce((sum, team) => sum + team.playerCount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-2xl text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6">{mockGameData.name}</h1>
          <div className="flex items-center justify-center gap-6 mb-4">
            <Card className="inline-block">
              <CardContent className="pt-6 px-12">
                <p className="text-2xl text-muted-foreground mb-2">Join with code</p>
                <p className="text-8xl font-bold font-mono tracking-wider">{gameCode}</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-2xl text-muted-foreground">
            {mockGameData.totalRounds} rounds • {mockGameData.questionsPerRound} questions per round
          </p>
        </div>

        {/* Teams Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Teams Ready to Play
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {mockTeams.map((team) => (
              <Card key={team.name} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-3xl">{team.name}</CardTitle>
                    <Badge variant="secondary" className="text-2xl px-4 py-2">
                      {team.playerCount} {team.playerCount === 1 ? 'player' : 'players'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <p className="text-6xl font-bold mb-2">{mockTeams.length}</p>
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