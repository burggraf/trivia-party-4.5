import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TVScoresPage() {
  const { gameCode } = useParams()
  const [loading, setLoading] = useState(true)

  // Mock scores data - will be replaced with real-time data
  const mockGameData = {
    name: 'Monday Night Trivia',
    currentRound: 1,
    totalRounds: 3,
  }

  const mockScores = [
    {
      rank: 1,
      teamName: 'Quiz Wizards',
      playerCount: 3,
      score: 8,
      maxScore: 10,
    },
    {
      rank: 2,
      teamName: 'Brain Trust',
      playerCount: 4,
      score: 7,
      maxScore: 10,
    },
    {
      rank: 3,
      teamName: 'Trivia Masters',
      playerCount: 2,
      score: 6,
      maxScore: 10,
    },
    {
      rank: 4,
      teamName: 'Know It Alls',
      playerCount: 5,
      score: 5,
      maxScore: 10,
    },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)

    // TODO: Subscribe to real-time score updates
  }, [gameCode])

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
          <h1 className="text-6xl font-bold mb-4">Leaderboard</h1>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-2xl px-6 py-2">
              Round {mockGameData.currentRound} of {mockGameData.totalRounds}
            </Badge>
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-4">
          {mockScores.map((team) => (
            <Card
              key={team.rank}
              className={`border-2 transition-all ${
                team.rank === 1
                  ? 'border-primary bg-primary/5 scale-105'
                  : team.rank === 2
                    ? 'border-secondary'
                    : ''
              }`}
            >
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-8">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {team.rank === 1 && (
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary-foreground">
                          {team.rank}
                        </span>
                      </div>
                    )}
                    {team.rank === 2 && (
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-4xl font-bold text-secondary-foreground">
                          {team.rank}
                        </span>
                      </div>
                    )}
                    {team.rank === 3 && (
                      <div className="w-20 h-20 rounded-full border-4 border-muted flex items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground">
                          {team.rank}
                        </span>
                      </div>
                    )}
                    {team.rank > 3 && (
                      <div className="w-20 h-20 flex items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground">
                          {team.rank}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-grow">
                    <h3 className="text-4xl font-bold mb-2">{team.teamName}</h3>
                    <Badge variant="outline" className="text-xl px-4 py-1">
                      {team.playerCount} {team.playerCount === 1 ? 'player' : 'players'}
                    </Badge>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-6xl font-bold">{team.score}</p>
                    <p className="text-2xl text-muted-foreground">/ {team.maxScore}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex-shrink-0 w-32">
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(team.score / team.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          {mockGameData.currentRound < mockGameData.totalRounds ? (
            <p className="text-3xl text-muted-foreground">
              Get ready for Round {mockGameData.currentRound + 1}
            </p>
          ) : (
            <div>
              <p className="text-5xl font-bold mb-4">Game Complete!</p>
              <p className="text-3xl text-muted-foreground">
                Congratulations to {mockScores[0].teamName}!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}