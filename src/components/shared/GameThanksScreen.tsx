import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface GameThanksScreenProps {
  game: Game
  isHost?: boolean
}

export function GameThanksScreen({ game, isHost = false }: GameThanksScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-6">
          <CardTitle className="text-5xl md:text-7xl font-bold">
            Thanks for Playing!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-2xl md:text-3xl text-muted-foreground">
            See you next time!
          </p>
          {game.venue_name && (
            <p className="text-lg text-muted-foreground">
              {game.venue_name}
            </p>
          )}
          {isHost && (
            <p className="text-sm text-muted-foreground pt-4">
              Click "View Final Scores" to see detailed results
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
