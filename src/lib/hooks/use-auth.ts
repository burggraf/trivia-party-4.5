/**
 * Authentication Hook
 *
 * React hook for managing authentication state
 */

'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { getCurrentUser, onAuthStateChange } from '@/lib/services/auth-service'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const subscription = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}