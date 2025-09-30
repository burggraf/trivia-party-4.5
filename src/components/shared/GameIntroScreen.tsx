import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface GameIntroScreenProps {
  game: Game
  isHost?: boolean
}

export function GameIntroScreen({ game, isHost = false }: GameIntroScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-4xl md:text-6xl font-bold">
            {game.name}
          </CardTitle>
          {game.venue_name && (
            <p className="text-xl md:text-2xl text-muted-foreground">
              {game.venue_name}
            </p>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-2xl md:text-3xl font-semibold">
              Welcome to Trivia Night!
            </p>
            <p className="text-lg md:text-xl text-muted-foreground">
              {game.num_rounds} rounds • {game.questions_per_round} questions per round
            </p>
          </div>
          {isHost && (
            <p className="text-sm text-muted-foreground">
              Click "Next" to begin
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
