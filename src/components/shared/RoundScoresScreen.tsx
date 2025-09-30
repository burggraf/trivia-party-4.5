import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface TeamScore {
  teamId: string
  teamName: string
  score: number
  cumulativeTime: number
}

interface RoundScoresScreenProps {
  game: Game
  roundNumber: number
  teams: TeamScore[]
  isHost?: boolean
}

export function RoundScoresScreen({ game, roundNumber, teams, isHost = false }: RoundScoresScreenProps) {
  // Sort teams by score (descending), then by time (ascending)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return a.cumulativeTime - b.cumulativeTime
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl md:text-5xl font-bold">
            Round {roundNumber} Complete!
          </CardTitle>
          <CardDescription className="text-lg">
            Current Standings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedTeams.map((team, index) => (
            <div
              key={team.teamId}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                index === 0 ? 'bg-primary/10 border-primary' : 'bg-card'
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
                    {(team.cumulativeTime / 1000).toFixed(1)}s total time
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{team.score}</p>
                <p className="text-sm text-muted-foreground">points</p>
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
