/**
 * Authentication Service - Client-Side
 *
 * Handles all authentication operations using Supabase browser client.
 * Implements FR-019 (Host Auth), FR-020 (Player Auth), FR-021 (Anonymous Auth)
 */

'use client'

import { supabase } from '@/lib/supabase/client'
import type { User, AuthError } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  user: User | null
  error: AuthError | null
}

export interface SignUpHostParams {
  email: string
  password: string
  displayName: string
}

export interface SignInParams {
  email: string
  password: string
}

export interface AnonymousAuthParams {
  displayName: string
}

// ============================================================================
// Host Authentication (FR-019)
// ============================================================================

/**
 * Sign up a new host account
 * Creates auth.users entry and hosts table entry via trigger
 */
export async function signUpHost(params: SignUpHostParams): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
        role: 'host',
      },
    },
  })

  if (error) {
    return { user: null, error }
  }

  // Create host record (if not auto-created by trigger)
  if (data.user) {
    const { error: hostError } = await supabase.from('hosts').insert({
      id: data.user.id,
      email: params.email,
      display_name: params.displayName,
    })

    // Ignore duplicate key error (trigger may have created it)
    if (hostError && !hostError.message.includes('duplicate')) {
      console.error('Failed to create host record:', hostError)
    }
  }

  return { user: data.user, error: null }
}

/**
 * Sign in existing host
 */
export async function signInHost(params: SignInParams): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  if (error) {
    return { user: null, error }
  }

  // Verify user has host record
  if (data.user) {
    const { data: host, error: hostError } = await supabase
      .from('hosts')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (hostError || !host) {
      await supabase.auth.signOut()
      return {
        user: null,
        error: {
          name: 'AuthError',
          message: 'This account is not registered as a host',
          status: 403,
        } as AuthError,
      }
    }
  }

  return { user: data.user, error: null }
}

// ============================================================================
// Player Authentication (FR-020, FR-021)
// ============================================================================

/**
 * Sign up a new player account (email/password)
 * Creates auth.users entry and player_profiles table entry via trigger
 */
export async function signUpPlayer(params: SignUpHostParams): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName,
        role: 'player',
      },
    },
  })

  if (error) {
    return { user: null, error }
  }

  // Create player profile (if not auto-created by trigger)
  if (data.user) {
    const { error: profileError } = await supabase.from('player_profiles').insert({
      id: data.user.id,
      display_name: params.displayName,
      is_anonymous: false,
    })

    // Ignore duplicate key error (trigger may have created it)
    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Failed to create player profile:', profileError)
    }
  }

  return { user: data.user, error: null }
}

/**
 * Sign in existing player
 */
export async function signInPlayer(params: SignInParams): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  if (error) {
    return { user: null, error }
  }

  return { user: data.user, error: null }
}

/**
 * Sign in anonymously (FR-021)
 * Creates anonymous session with custom display name
 */
export async function signInAnonymous(params: AnonymousAuthParams): Promise<AuthResult> {
  // Create anonymous user
  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        display_name: params.displayName,
        role: 'player',
        is_anonymous: true,
      },
    },
  })

  if (error) {
    return { user: null, error }
  }

  // Create player profile for anonymous user
  if (data.user) {
    const { error: profileError } = await supabase.from('player_profiles').insert({
      id: data.user.id,
      display_name: params.displayName,
      is_anonymous: true,
    })

    // Ignore duplicate key error
    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Failed to create anonymous player profile:', profileError)
    }
  }

  return { user: data.user, error: null }
}

// ============================================================================
// Common Operations
// ============================================================================

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut()

  return { error }
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Get current session
 */
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/**
 * Check if user is a host
 */
export async function isHost(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('hosts')
    .select('id')
    .eq('id', userId)
    .single()

  return !error && !!data
}

/**
 * Get player profile
 */
export async function getPlayerProfile(userId: string) {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

/**
 * Update player profile
 */
export async function updatePlayerProfile(
  userId: string,
  updates: { display_name?: string }
) {
  const { data, error } = await supabase
    .from('player_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

/**
 * Listen for auth state changes
 * Use this in components to react to sign in/out
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}