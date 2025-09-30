/**
 * Realtime Game Hook
 *
 * React hook for subscribing to real-time game updates via Supabase Realtime
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface GameEvent {
  type: 'question_advance' | 'answer_reveal' | 'game_pause' | 'game_resume' | 'game_end' | 'state_change'
  payload: any
}

interface TeamPresence {
  team_id: string
  members_online: number
  last_seen: string
}

interface TvUpdate {
  teams_answered_count: number
  total_teams: number
}

interface UseRealtimeGameOptions {
  gameId?: string
  teamId?: string
  onGameEvent?: (event: GameEvent) => void
  onTeamPresence?: (presence: TeamPresence[]) => void
  onTvUpdate?: (update: TvUpdate) => void
}

interface UseRealtimeGameReturn {
  connected: boolean
  gameEvents: GameEvent[]
  teamPresence: TeamPresence[]
  tvUpdate: TvUpdate | null
}

/**
 * Hook for subscribing to real-time game updates
 *
 * Subscribes to three Supabase Realtime broadcast channels:
 * - game:{game_id} - Question advances, reveals, state changes
 * - team:{team_id}:presence - Team member online/offline status
 * - tv:{game_id} - TV-specific updates (teams_answered_count)
 */
export function useRealtimeGame(options: UseRealtimeGameOptions): UseRealtimeGameReturn {
  const { gameId, teamId, onGameEvent, onTeamPresence, onTvUpdate } = options

  const [connected, setConnected] = useState(false)
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  const [teamPresence, setTeamPresence] = useState<TeamPresence[]>([])
  const [tvUpdate, setTvUpdate] = useState<TvUpdate | null>(null)

  useEffect(() => {
    if (!gameId) return

    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    // Subscribe to game events channel
    const gameChannel = supabase.channel(`game:${gameId}`)
      .on('broadcast', { event: '*' }, (payload) => {
        const event: GameEvent = {
          type: payload.event as GameEvent['type'],
          payload: payload.payload,
        }

        setGameEvents((prev) => [...prev, event])
        onGameEvent?.(event)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnected(false)
        }
      })

    channels.push(gameChannel)

    // Subscribe to team presence channel (if teamId provided)
    if (teamId) {
      const teamPresenceChannel = supabase.channel(`team:${teamId}:presence`)
        .on('broadcast', { event: 'presence_update' }, (payload) => {
          const presence = payload.payload as TeamPresence[]
          setTeamPresence(presence)
          onTeamPresence?.(presence)
        })
        .subscribe()

      channels.push(teamPresenceChannel)
    }

    // Subscribe to TV updates channel
    const tvChannel = supabase.channel(`tv:${gameId}`)
      .on('broadcast', { event: 'answer_progress' }, (payload) => {
        const update = payload.payload as TvUpdate
        setTvUpdate(update)
        onTvUpdate?.(update)
      })
      .subscribe()

    channels.push(tvChannel)

    // Cleanup: unsubscribe from all channels
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
      setConnected(false)
    }
  }, [gameId, teamId, onGameEvent, onTeamPresence, onTvUpdate])

  return {
    connected,
    gameEvents,
    teamPresence,
    tvUpdate,
  }
}

/**
 * Hook for broadcasting game events (host use)
 */
export function useGameBroadcast(gameId?: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!gameId) return

    const supabase = createClient()
    const gameChannel = supabase.channel(`game:${gameId}`)

    gameChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChannel(gameChannel)
      }
    })

    return () => {
      supabase.removeChannel(gameChannel)
      setChannel(null)
    }
  }, [gameId])

  const broadcast = async (event: string, payload: any) => {
    if (!channel) {
      console.warn('Channel not ready for broadcast')
      return { error: new Error('Channel not connected') }
    }

    return channel.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  return { broadcast, ready: !!channel }
}

/**
 * Hook for broadcasting TV updates (host use)
 */
export function useTvBroadcast(gameId?: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!gameId) return

    const supabase = createClient()
    const tvChannel = supabase.channel(`tv:${gameId}`)

    tvChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChannel(tvChannel)
      }
    })

    return () => {
      supabase.removeChannel(tvChannel)
      setChannel(null)
    }
  }, [gameId])

  const broadcastAnswerProgress = async (teamsAnsweredCount: number, totalTeams: number) => {
    if (!channel) {
      console.warn('TV channel not ready for broadcast')
      return { error: new Error('Channel not connected') }
    }

    return channel.send({
      type: 'broadcast',
      event: 'answer_progress',
      payload: {
        teams_answered_count: teamsAnsweredCount,
        total_teams: totalTeams,
      },
    })
  }

  return { broadcastAnswerProgress, ready: !!channel }
}