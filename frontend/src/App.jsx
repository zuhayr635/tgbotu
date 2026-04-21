import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewBroadcastPage from './pages/NewBroadcastPage'
import GroupsPage from './pages/GroupsPage'
import SchedulesPage from './pages/SchedulesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import TemplatesPage from './pages/TemplatesPage'
import CalendarPage from './pages/CalendarPage'
import ActivePage from './pages/ActivePage'
import Layout from './components/Layout'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="broadcast/new" element={<NewBroadcastPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="active" element={<ActivePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
