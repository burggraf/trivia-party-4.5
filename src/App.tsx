import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TestPage from './pages/TestPage'
import HostLoginPage from './pages/host/HostLoginPage'
import HostDashboardPage from './pages/host/HostDashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/host/login" element={<HostLoginPage />} />
      <Route path="/host/dashboard" element={<HostDashboardPage />} />
    </Routes>
  )
}