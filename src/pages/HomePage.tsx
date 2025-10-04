import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/services/auth-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@supabase/supabase-js'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Trivia Party</h1>
            <p className="text-lg text-muted-foreground">
              Multi-User Real-Time Trivia Application
            </p>
          </div>

          <div className="flex justify-center pt-8">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  {loading
                    ? 'Loading...'
                    : user
                      ? `Welcome back, ${user.email}`
                      : 'Choose your role to begin'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : user ? (
                  <>
                    <Button asChild className="w-full" size="lg">
                      <Link to="/host/dashboard">Host Dashboard</Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full" size="lg">
                      <Link to="/player/join">Join Game</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full" size="lg">
                      <Link to="/host/login">Host Login</Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full" size="lg">
                      <Link to="/player/login">Player Login</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="pt-12 space-y-2 text-sm text-muted-foreground">
            <p>Static Client-Side Application with Supabase Backend</p>
            <p>Database: {loading ? 'Checking...' : '61,254 questions available'}</p>
            <p className="pt-4">
              <Link
                to="/test"
                className="text-primary hover:underline underline-offset-4"
              >
                Test Client-Side Services
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}