import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useGame } from '@/lib/hooks/use-game'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Edit, Play, Trophy } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

type Game = Database['public']['Tables']['games']['Row']

export default function HostDashboardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { createNewGame } = useGame()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/host/login')
      return
    }

    const fetchGames = async () => {
      try {
        // host.id is the same as auth.users.id
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .eq('host_id', user.id)
          .order('created_at', { ascending: false })

        if (gamesError) throw gamesError

        setGames(gamesData || [])
      } catch (err) {
        console.error('Failed to fetch games:', err)
        setError('Failed to load games')
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [user, authLoading, navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleDeleteClick = (gameId: string) => {
    setGameToDelete(gameId)
    setConfirmDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return

    setDeletingGameId(gameToDelete)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameToDelete)

      if (deleteError) throw deleteError

      // Remove game from local state
      setGames(games.filter(g => g.id !== gameToDelete))
    } catch (err) {
      console.error('Failed to delete game:', err)
      setError('Failed to delete game. Please try again.')
    } finally {
      setDeletingGameId(null)
      setGameToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      setup: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'secondary',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">Host Dashboard</CardTitle>
                <CardDescription className="mt-1">
                  Welcome back, {user?.email}
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/host/games/create">Create New Game</Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Games</CardTitle>
            <CardDescription>
              {games.length === 0
                ? 'No games yet. Create your first trivia game to get started.'
                : `Manage your ${games.length} game${games.length === 1 ? '' : 's'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">
                  Create your first trivia game to get started
                </p>
                <Button asChild size="lg">
                  <Link to="/host/games/create">Create Game</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game) => (
                  <Card key={game.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{game.name}</h3>
                            {getStatusBadge(game.status)}
                          </div>
                          <div className="flex gap-6 text-sm text-muted-foreground">
                            <span>
                              Code: <span className="font-mono font-medium text-foreground">{game.game_code}</span>
                            </span>
                            <span>Rounds: {game.num_rounds}</span>
                            <span>{new Date(game.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {game.status === 'setup' && (
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              title="Edit questions"
                            >
                              <Link to={`/host/games/${game.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {game.status === 'active' && (
                            <Button
                              asChild
                              variant="default"
                              size="icon"
                              title="Control game"
                            >
                              <Link to={`/host/games/${game.id}/control`}>
                                <Play className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {game.status === 'paused' && (
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              title="Resume game"
                            >
                              <Link to={`/host/games/${game.id}/control`}>
                                <Play className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          {game.status === 'completed' && (
                            <Button
                              asChild
                              variant="secondary"
                              size="icon"
                              title="View results"
                            >
                              <Link to={`/host/games/${game.id}/scores`}>
                                <Trophy className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(game.id)}
                            disabled={deletingGameId === game.id}
                            title="Delete game"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Home
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Game"
        description="Are you sure you want to delete this game? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}