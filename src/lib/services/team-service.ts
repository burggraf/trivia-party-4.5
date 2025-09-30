/**
 * Team Service - Client-Side
 *
 * Handles all team-related operations using Supabase browser client.
 * Implements FR-026 through FR-035 (Team Management)
 */

'use client'

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Team = Database['public']['Tables']['teams']['Row']
type TeamMember = Database['public']['Tables']['team_members']['Row']

// ============================================================================
// Team Creation (FR-026, FR-027)
// ============================================================================

/**
 * Create a new team and join as first member
 * Implements FR-026 (create team), FR-027 (team size limits)
 */
export async function createTeam(gameId: string, teamName: string) {
  

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        team: null,
        error: new Error('You must be logged in to create a team'),
      }
    }

    // Check if user is already on a team in this game
    const { data: existingMembership } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(game_id)')
      .eq('player_id', user.id)
      .eq('teams.game_id', gameId)
      .single()

    if (existingMembership) {
      return {
        team: null,
        error: new Error('You are already on a team in this game'),
      }
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        game_id: gameId,
        team_name: teamName,
        score: 0,
        cumulative_answer_time_ms: 0,
      })
      .select()
      .single()

    if (teamError || !team) {
      console.error('Failed to create team:', teamError)
      return {
        team: null,
        error: new Error('Failed to create team'),
      }
    }

    // Join team as first member
    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: team.id,
      player_id: user.id,
    })

    if (memberError) {
      console.error('Failed to join team:', memberError)
      // Cleanup: delete the team
      await supabase.from('teams').delete().eq('id', team.id)
      return {
        team: null,
        error: new Error('Failed to join team'),
      }
    }

    return { team, error: null }
  } catch (error) {
    console.error('Unexpected error in createTeam:', error)
    return {
      team: null,
      error: error as Error,
    }
  }
}

// ============================================================================
// Team Joining (FR-028, FR-029, FR-030)
// ============================================================================

/**
 * Join an existing team
 * Implements FR-028 (join team), FR-029 (prevent joining multiple teams),
 * FR-030 (team size limits)
 */
export async function joinTeam(teamId: string) {
  

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: new Error('You must be logged in to join a team'),
      }
    }

    // Get team and game info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, game_id, games!inner(max_players_per_team)')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return {
        success: false,
        error: new Error('Team not found'),
      }
    }

    // Check if user is already on a team in this game (FR-029)
    const { data: existingMembership } = await supabase
      .from('team_members')
      .select('team_id, teams!inner(game_id)')
      .eq('player_id', user.id)
      .eq('teams.game_id', team.game_id)
      .single()

    if (existingMembership) {
      return {
        success: false,
        error: new Error('You are already on a team in this game'),
      }
    }

    // Check team size limit (FR-030)
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)

    const maxPlayers = team.games.max_players_per_team

    if (memberCount !== null && memberCount >= maxPlayers) {
      return {
        success: false,
        error: new Error(`Team is full (max ${maxPlayers} players)`),
      }
    }

    // Join team
    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: teamId,
      player_id: user.id,
    })

    if (memberError) {
      console.error('Failed to join team:', memberError)
      return {
        success: false,
        error: new Error('Failed to join team'),
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in joinTeam:', error)
    return {
      success: false,
      error: error as Error,
    }
  }
}

// ============================================================================
// Team Retrieval
// ============================================================================

/**
 * Get all teams for a game
 */
export async function getTeams(gameId: string) {
  

  const { data: teams, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members (
        id,
        player_id,
        joined_at
      )
    `
    )
    .eq('game_id', gameId)
    .order('score', { ascending: false })

  return { teams: teams || [], error }
}

/**
 * Get team by ID with members
 */
export async function getTeam(teamId: string) {
  

  const { data: team, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members (
        id,
        player_id,
        joined_at,
        player_profiles (
          display_name,
          is_anonymous
        )
      )
    `
    )
    .eq('id', teamId)
    .single()

  return { team, error }
}

/**
 * Get current user's team for a game
 */
export async function getMyTeam(gameId: string) {
  

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { team: null, error: new Error('Not authenticated') }
  }

  const { data: membership, error } = await supabase
    .from('team_members')
    .select(
      `
      *,
      teams!inner (
        *,
        game_id
      )
    `
    )
    .eq('player_id', user.id)
    .eq('teams.game_id', gameId)
    .single()

  if (error) {
    return { team: null, error }
  }

  return { team: membership.teams, error: null }
}

/**
 * Get team members with player display names from auth metadata
 */
export async function getTeamMembers(teamId: string) {


  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  // Note: Display names are stored in auth.users.raw_user_meta_data.display_name
  // We'll fetch them on the client side if needed, or return just the IDs

  return { members: members || [], error }
}

// ============================================================================
// Team Scores
// ============================================================================

/**
 * Get leaderboard (teams sorted by score and tie-breaker)
 * Implements FR-082 (tie-breaking by cumulative time)
 */
export async function getLeaderboard(gameId: string) {
  

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .order('cumulative_answer_time_ms', { ascending: true })

  if (error) {
    return { leaderboard: [], error }
  }

  // Add rank
  const leaderboard = teams.map((team, index) => ({
    ...team,
    rank: index + 1,
  }))

  return { leaderboard, error: null }
}

/**
 * Update team score after correct answer
 */
export async function updateTeamScore(
  teamId: string,
  pointsToAdd: number,
  timeToAdd: number
) {
  

  // Get current team score
  const { data: team } = await supabase
    .from('teams')
    .select('score, cumulative_answer_time_ms')
    .eq('id', teamId)
    .single()

  if (!team) {
    return { error: new Error('Team not found') }
  }

  // Update score and cumulative time
  const { data: updatedTeam, error } = await supabase
    .from('teams')
    .update({
      score: team.score + pointsToAdd,
      cumulative_answer_time_ms: team.cumulative_answer_time_ms + timeToAdd,
    })
    .eq('id', teamId)
    .select()
    .single()

  return { team: updatedTeam, error }
}