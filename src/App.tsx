import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TestPage from './pages/TestPage'
import NotFoundPage from './pages/NotFoundPage'
import HostLoginPage from './pages/host/HostLoginPage'
import HostRegisterPage from './pages/host/HostRegisterPage'
import HostForgotPasswordPage from './pages/host/HostForgotPasswordPage'
import HostDashboardPage from './pages/host/HostDashboardPage'
import GameCreatePage from './pages/host/games/GameCreatePage'
import GameEditPage from './pages/host/games/GameEditPage'
import GameControlPage from './pages/host/games/GameControlPage'
import GameScoresPage from './pages/host/games/GameScoresPage'
import PlayerLoginPage from './pages/player/PlayerLoginPage'
import PlayerRegisterPage from './pages/player/PlayerRegisterPage'
import PlayerForgotPasswordPage from './pages/player/PlayerForgotPasswordPage'
import JoinGamePage from './pages/player/JoinGamePage'
import LobbyPage from './pages/player/LobbyPage'
import GamePage from './pages/player/GamePage'
import PlayerResultsPage from './pages/player/PlayerResultsPage'
import TVLobbyPage from './pages/tv/TVLobbyPage'
import TVQuestionPage from './pages/tv/TVQuestionPage'
import TVScoresPage from './pages/tv/TVScoresPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/host/login" element={<HostLoginPage />} />
      <Route path="/host/register" element={<HostRegisterPage />} />
      <Route path="/host/forgot-password" element={<HostForgotPasswordPage />} />
      <Route path="/host/dashboard" element={<HostDashboardPage />} />
      <Route path="/host/games/create" element={<GameCreatePage />} />
      <Route path="/host/games/:gameId/edit" element={<GameEditPage />} />
      <Route path="/host/games/:gameId/control" element={<GameControlPage />} />
      <Route path="/host/games/:gameId/scores" element={<GameScoresPage />} />
      <Route path="/player/login" element={<PlayerLoginPage />} />
      <Route path="/player/register" element={<PlayerRegisterPage />} />
      <Route path="/player/forgot-password" element={<PlayerForgotPasswordPage />} />
      <Route path="/player/join" element={<JoinGamePage />} />
      <Route path="/player/lobby" element={<LobbyPage />} />
      <Route path="/player/game/:gameId" element={<GamePage />} />
      <Route path="/player/results" element={<PlayerResultsPage />} />
      <Route path="/tv/:gameCode/lobby" element={<TVLobbyPage />} />
      <Route path="/tv/:gameCode/question" element={<TVQuestionPage />} />
      <Route path="/tv/:gameCode/scores" element={<TVScoresPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}