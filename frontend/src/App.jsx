import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NewBroadcastPage from './pages/NewBroadcastPage'
import GroupsPage from './pages/GroupsPage'
import SchedulesPage from './pages/SchedulesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import TemplatesPage from './pages/TemplatesPage'
import CalendarPage from './pages/CalendarPage'
import ActivePage from './pages/ActivePage'
import AdminPage from './pages/AdminPage'
import PlanPage from './pages/PlanPage'
import BotsPage from './pages/BotsPage'
import { getMe } from './lib/api'
import './index.css'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('token')
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    if (!token) {
      setIsAdmin(false)
      return
    }
    getMe().then(res => {
      setIsAdmin(res.data.is_admin)
    }).catch(() => setIsAdmin(false))
  }, [token])

  if (isAdmin === null) return <div />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'broadcast':
        return <NewBroadcastPage />
      case 'groups':
        return <GroupsPage />
      case 'active':
        return <ActivePage />
      case 'bots':
        return <BotsPage />
      case 'plan':
        return <PlanPage />
      case 'admin':
        return <AdminPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppContent />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
