import { Card, CardContent } from '@/components/ui/card'
import type { Database } from '@/types/database.types'

type Game = Database['public']['Tables']['games']['Row']

interface RoundIntroScreenProps {
  game: Game
  roundNumber: number
  isHost?: boolean
}

export function RoundIntroScreen({ game, roundNumber, isHost = false }: RoundIntroScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardContent className="text-center py-16 space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold">
            Round {roundNumber}
          </h1>
          {isHost && (
            <p className="text-sm text-muted-foreground">
              Click "Next" to start the questions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
