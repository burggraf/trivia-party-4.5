/**
 * Supabase Realtime Channel Setup
 *
 * Creates and manages Supabase Realtime broadcast channels for game synchronization.
 * Uses broadcast channels (not table subscriptions) for better performance.
 *
 * Three channel types per game:
 * 1. game:{game_id} - Game state changes (question advances, reveals, pause/resume)
 * 2. team:{team_id}:presence - Team member online/offline status
 * 3. tv:{game_id} - TV-specific updates (teams_answered_count)
 */

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { GameEventType } from '@/types/game.types'

/**
 * Creates a game state broadcast channel
 *
 * @param gameId - UUID of the game
 * @returns Realtime channel for game events
 */
export function createGameChannel(gameId: string): RealtimeChannel {
  const supabase = createClient()

  return supabase.channel(`game:${gameId}`, {
    config: {
      broadcast: {
        self: false, // Don't receive own broadcasts
      },
    },
  })
}

/**
 * Creates a presence channel for team members
 *
 * @param teamId - UUID of the team
 * @param playerId - UUID of the player
 * @param displayName - Display name of the player
 * @returns Realtime channel with presence tracking
 */
export function createPresenceChannel(
  teamId: string,
  playerId: string,
  displayName: string
): RealtimeChannel {
  const supabase = createClient()

  return supabase.channel(`team:${teamId}:presence`, {
    config: {
      presence: {
        key: playerId,
      },
    },
  })
}

/**
 * Creates a TV display broadcast channel
 *
 * @param gameId - UUID of the game
 * @returns Realtime channel for TV-specific updates
 */
export function createTVChannel(gameId: string): RealtimeChannel {
  const supabase = createClient()

  return supabase.channel(`tv:${gameId}`, {
    config: {
      broadcast: {
        self: false,
      },
    },
  })
}

/**
 * Broadcasts a game event to all connected clients
 *
 * @param channel - Realtime channel
 * @param eventType - Type of game event
 * @param payload - Event payload data
 */
export async function broadcastGameEvent(
  channel: RealtimeChannel,
  eventType: GameEventType,
  payload: Record<string, any>
): Promise<void> {
  await channel.send({
    type: 'broadcast',
    event: eventType,
    payload,
  })
}

/**
 * Subscribes to game events with automatic reconnection
 *
 * @param gameId - UUID of the game
 * @param onEvent - Callback for game events
 * @returns Realtime channel (call .unsubscribe() to cleanup)
 */
export function subscribeToGameEvents(
  gameId: string,
  onEvent: (eventType: string, payload: any) => void
): RealtimeChannel {
  const channel = createGameChannel(gameId)

  // Subscribe to all game event types
  const eventTypes: GameEventType[] = [
    'game_started',
    'game_paused',
    'game_resumed',
    'question_advanced',
    'answer_revealed',
    'game_completed',
  ]

  eventTypes.forEach((eventType) => {
    channel.on('broadcast', { event: eventType }, (payload) => {
      onEvent(eventType, payload.payload)
    })
  })

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Realtime] Subscribed to game:${gameId}`)
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`[Realtime] Error on game:${gameId}`)
    } else if (status === 'TIMED_OUT') {
      console.warn(`[Realtime] Timeout on game:${gameId}`)
    } else if (status === 'CLOSED') {
      console.log(`[Realtime] Closed game:${gameId}`)
    }
  })

  return channel
}

/**
 * Subscribes to TV channel for answer count updates
 *
 * @param gameId - UUID of the game
 * @param onUpdate - Callback for TV updates
 * @returns Realtime channel (call .unsubscribe() to cleanup)
 */
export function subscribeToTVUpdates(
  gameId: string,
  onUpdate: (payload: { teams_answered_count: number; total_teams: number }) => void
): RealtimeChannel {
  const channel = createTVChannel(gameId)

  channel.on('broadcast', { event: 'answer_count_updated' }, (payload) => {
    onUpdate(payload.payload)
  })

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Realtime] Subscribed to tv:${gameId}`)
    }
  })

  return channel
}

/**
 * Joins a presence channel and tracks online team members
 *
 * @param teamId - UUID of the team
 * @param playerId - UUID of the player
 * @param displayName - Display name of the player
 * @param onPresenceChange - Callback when team members join/leave
 * @returns Realtime channel (call .unsubscribe() to cleanup)
 */
export function joinTeamPresence(
  teamId: string,
  playerId: string,
  displayName: string,
  onPresenceChange: (members: any[]) => void
): RealtimeChannel {
  const channel = createPresenceChannel(teamId, playerId, displayName)

  // Track presence state
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const members = Object.values(state).flat()
      onPresenceChange(members)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log(`[Presence] ${key} joined team:${teamId}`)
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log(`[Presence] ${key} left team:${teamId}`)
    })

  // Subscribe and track this player
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        player_id: playerId,
        display_name: displayName,
        online_at: new Date().toISOString(),
      })
    }
  })

  return channel
}

/**
 * Cleans up a Realtime channel
 *
 * @param channel - Realtime channel to cleanup
 */
export async function cleanupChannel(channel: RealtimeChannel): Promise<void> {
  await channel.unsubscribe()
}