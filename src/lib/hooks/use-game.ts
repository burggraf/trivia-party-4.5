/**
 * Game Management Hook
 *
 * React hook for managing game state and operations
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Database } from '@/types/database.types'
import {
  createGame,
  getGame,
  updateGame,
  startGame,
  pauseGame,
  resumeGame,
  advanceQuestion,
  revealAnswer,
  navigateToQuestion,
  endGame,
  getCurrentQuestion,
} from '@/lib/services/game-service'
import { getTeams, getLeaderboard } from '@/lib/services/team-service'
import type { CreateGameRequest } from '@/types/api.types'

type Game = Database['public']['Tables']['games']['Row']
type Team = Database['public']['Tables']['teams']['Row']
type GameQuestion = Database['public']['Tables']['game_questions']['Row']

interface UseGameReturn {
  game: Game | null
  teams: Team[]
  currentQuestion: GameQuestion | null
  leaderboard: any[]
  loading: boolean
  error: Error | null
  createNewGame: (config: CreateGameRequest) => Promise<{ gameId: string; gameCode: string } | null>
  refreshGame: () => Promise<void>
  startGameSession: () => Promise<void>
  pauseGameSession: () => Promise<void>
  resumeGameSession: () => Promise<void>
  advanceToNextQuestion: () => Promise<void>
  revealCurrentAnswer: () => Promise<void>
  navigateToQuestionByIndex: (index: number) => Promise<void>
  endGameSession: () => Promise<void>
  refreshTeams: () => Promise<void>
  refreshLeaderboard: () => Promise<void>
}

/**
 * Hook for managing a specific game
 */
export function useGame(gameId?: string): UseGameReturn {
  const [game, setGame] = useState<Game | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch game data
  const refreshGame = useCallback(async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { game: gameData, error: gameError } = await getGame(gameId)
      if (gameError) throw gameError
      if (gameData) setGame(gameData)

      // Fetch current question
      const { question, error: questionError } = await getCurrentQuestion(gameId)
      if (questionError) throw questionError
      if (question) setCurrentQuestion(question.gameQuestion)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch game'))
    } finally {
      setLoading(false)
    }
  }, [gameId])

  // Fetch teams
  const refreshTeams = useCallback(async () => {
    if (!gameId) return

    try {
      const { teams: teamsData, error: teamsError } = await getTeams(gameId)
      if (teamsError) throw teamsError
      if (teamsData) setTeams(teamsData)
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    }
  }, [gameId])

  // Fetch leaderboard
  const refreshLeaderboard = useCallback(async () => {
    if (!gameId) return

    try {
      const { leaderboard: leaderboardData, error: leaderboardError } = await getLeaderboard(gameId)
      if (leaderboardError) throw leaderboardError
      if (leaderboardData) setLeaderboard(leaderboardData)
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }, [gameId])

  // Create new game
  const createNewGame = async (config: CreateGameRequest) => {
    try {
      setLoading(true)
      setError(null)

      const { game: newGame, gameCode, error: createError } = await createGame(config)
      if (createError) throw createError
      if (!newGame) throw new Error('Game creation failed')

      return { gameId: newGame.id, gameCode: gameCode! }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create game'))
      return null
    } finally {
      setLoading(false)
    }
  }

  // Start game
  const startGameSession = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: startError } = await startGame(gameId)
      if (startError) throw startError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start game'))
    } finally {
      setLoading(false)
    }
  }

  // Pause game
  const pauseGameSession = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: pauseError } = await pauseGame(gameId)
      if (pauseError) throw pauseError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause game'))
    } finally {
      setLoading(false)
    }
  }

  // Resume game
  const resumeGameSession = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: resumeError } = await resumeGame(gameId)
      if (resumeError) throw resumeError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resume game'))
    } finally {
      setLoading(false)
    }
  }

  // Advance to next question
  const advanceToNextQuestion = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: advanceError } = await advanceQuestion(gameId)
      if (advanceError) throw advanceError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to advance question'))
    } finally {
      setLoading(false)
    }
  }

  // Reveal current answer
  const revealCurrentAnswer = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: revealError } = await revealAnswer(gameId)
      if (revealError) throw revealError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reveal answer'))
    } finally {
      setLoading(false)
    }
  }

  // Navigate to specific question
  const navigateToQuestionByIndex = async (index: number) => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: navError } = await navigateToQuestion(gameId, index)
      if (navError) throw navError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to navigate to question'))
    } finally {
      setLoading(false)
    }
  }

  // End game
  const endGameSession = async () => {
    if (!gameId) return

    try {
      setLoading(true)
      setError(null)

      const { error: endError } = await endGame(gameId)
      if (endError) throw endError

      await refreshGame()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to end game'))
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (gameId) {
      refreshGame()
      refreshTeams()
      refreshLeaderboard()
    }
  }, [gameId, refreshGame, refreshTeams, refreshLeaderboard])

  return {
    game,
    teams,
    currentQuestion,
    leaderboard,
    loading,
    error,
    createNewGame,
    refreshGame,
    startGameSession,
    pauseGameSession,
    resumeGameSession,
    advanceToNextQuestion,
    revealCurrentAnswer,
    navigateToQuestionByIndex,
    endGameSession,
    refreshTeams,
    refreshLeaderboard,
  }
}