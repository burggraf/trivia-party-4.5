import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/">
              <Button className="w-full">Go Home</Button>
            </Link>
            <Link to="/host/dashboard">
              <Button variant="outline" className="w-full">Host Dashboard</Button>
            </Link>
            <Link to="/player/join">
              <Button variant="outline" className="w-full">Join Game</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
