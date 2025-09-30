import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface TeamScore {
  teamId: string
  teamName: string
  score: number
  cumulativeTime: number
  accuracy: number
}

interface GameCompleteScreenProps {
  game: Game
  teams: TeamScore[]
  totalQuestions: number
  isHost?: boolean
}

export function GameCompleteScreen({ game, teams, totalQuestions, isHost = false }: GameCompleteScreenProps) {
  // Sort teams by score (descending), then by time (ascending)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.cumulativeTime - b.cumulativeTime
  })

  const winner = sortedTeams[0]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-5xl md:text-6xl font-bold">
            Game Over!
          </CardTitle>
          {winner && (
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-semibold text-primary">
                🏆 {winner.teamName} Wins! 🏆
              </p>
              <p className="text-lg text-muted-foreground">
                {winner.score} / {totalQuestions} correct ({winner.accuracy}%)
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-lg font-medium">Final Standings</p>
          </div>
          {sortedTeams.map((team, index) => (
            <div
              key={team.teamId}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                index === 0
                  ? 'bg-primary/10 border-primary'
                  : index === 1
                  ? 'bg-secondary/10 border-secondary'
                  : 'bg-card'
              }`}
            >
              <div className="flex items-center gap-4">
                <Badge
                  variant={index === 0 ? 'default' : 'outline'}
                  className="text-2xl py-2 px-4"
                >
                  {index + 1}
                </Badge>
                <div>
                  <p className="text-2xl font-semibold">{team.teamName}</p>
                  <p className="text-sm text-muted-foreground">
                    {team.accuracy}% accuracy • {(team.cumulativeTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{team.score}</p>
                <p className="text-sm text-muted-foreground">/ {totalQuestions}</p>
              </div>
            </div>
          ))}
          {isHost && (
            <p className="text-center text-sm text-muted-foreground pt-4">
              Click "Next" to continue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
