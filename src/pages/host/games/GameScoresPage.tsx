import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function GameScoresPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Mock game data - will be replaced with actual data
  const [loading, setLoading] = useState(true)

  const mockGameData = {
    name: 'Monday Night Trivia',
    date: '2025-09-30',
    totalRounds: 3,
    totalQuestions: 15,
  }

  const mockScores = [
    {
      rank: 1,
      teamName: 'Quiz Wizards',
      playerCount: 3,
      correctAnswers: 13,
      totalQuestions: 15,
      accuracy: 87,
      cumulativeTime: 145000, // milliseconds
    },
    {
      rank: 2,
      teamName: 'Brain Trust',
      playerCount: 4,
      correctAnswers: 13,
      totalQuestions: 15,
      accuracy: 87,
      cumulativeTime: 152000,
    },
    {
      rank: 3,
      teamName: 'Trivia Masters',
      playerCount: 2,
      correctAnswers: 11,
      totalQuestions: 15,
      accuracy: 73,
      cumulativeTime: 128000,
    },
    {
      rank: 4,
      teamName: 'Know It Alls',
      playerCount: 5,
      correctAnswers: 9,
      totalQuestions: 15,
      accuracy: 60,
      cumulativeTime: 134000,
    },
  ]

  useEffect(() => {
    if (!user) {
      navigate('/host/login')
    } else {
      // Simulate loading
      setTimeout(() => setLoading(false), 500)
    }
  }, [user, navigate])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleNewGame = () => {
    navigate('/host/games/create')
  }

  const handleBackToDashboard = () => {
    navigate('/host/dashboard')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/host/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Final Scores</h1>
          <p className="text-sm text-muted-foreground">
            {mockGameData.name} • {mockGameData.date}
          </p>
        </div>

        <div className="space-y-6">
          {/* Game Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Game Summary</CardTitle>
              <CardDescription>Overview of game performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold">{mockScores.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">
                    {mockScores.reduce((sum, team) => sum + team.playerCount, 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{mockGameData.totalQuestions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Rounds</p>
                  <p className="text-2xl font-bold">{mockGameData.totalRounds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Final Rankings</CardTitle>
              <CardDescription>
                Teams ranked by correct answers, ties broken by cumulative answer time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead className="text-center">Players</TableHead>
                    <TableHead className="text-center">Correct</TableHead>
                    <TableHead className="text-center">Accuracy</TableHead>
                    <TableHead className="text-center">Total Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockScores.map((team) => (
                    <TableRow key={team.rank}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {team.rank === 1 && (
                            <Badge variant="default" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {team.rank}
                            </Badge>
                          )}
                          {team.rank === 2 && (
                            <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {team.rank}
                            </Badge>
                          )}
                          {team.rank === 3 && (
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {team.rank}
                            </Badge>
                          )}
                          {team.rank > 3 && (
                            <span className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground">
                              {team.rank}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{team.teamName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{team.playerCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {team.correctAnswers} / {team.totalQuestions}
                      </TableCell>
                      <TableCell className="text-center">{team.accuracy}%</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {formatTime(team.cumulativeTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleNewGame} size="lg" className="flex-1">
                  Start New Game
                </Button>
                <Button onClick={handleBackToDashboard} variant="outline" size="lg" className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}