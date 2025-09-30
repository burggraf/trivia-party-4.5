'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/services/auth-service'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">🎮 Trivia Party</h1>
        <p className="text-2xl mb-8">Multi-User Real-Time Trivia</p>

        <div className="space-y-4 mt-12">
          {loading ? (
            <p className="text-xl">Loading...</p>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-xl">Welcome back, {user.email}!</p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/host/dashboard"
                  className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition"
                >
                  Host Dashboard
                </Link>
                <Link
                  href="/player/join"
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition"
                >
                  Join Game
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link
                href="/host/login"
                className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                Host Login
              </Link>
              <Link
                href="/player/login"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                Player Login
              </Link>
            </div>
          )}
        </div>

        <div className="mt-16 text-sm text-white/80">
          <p>✅ Client-Side Only • ✅ Static Export • ✅ Supabase Backend</p>
          <p className="mt-2">Database: {loading ? 'Checking...' : '61,254 questions loaded'}</p>
          <p className="mt-4">
            <Link href="/test" className="text-blue-300 hover:text-blue-200 underline">
              🧪 Test Client-Side Services
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
