import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/useAuth'
import LoadingState from './components/LoadingState'
import ProtectedLayout from './components/ProtectedLayout'
import AdminLayout from './layouts/AdminLayout'
import AccessDeniedPage from './pages/AccessDeniedPage'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import ReservationsPage from './pages/ReservationsPage'

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const { session, loading, hasAdminAccess } = useAuth()

  if (loading) {
    return <LoadingState message="Chargement de votre accès..." />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!hasAdminAccess) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route element={<ProtectedLayout />}>
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route
            path="reports"
            element={
              <PlaceholderPage
                title="Rapports"
                description="Consultez les indicateurs clés pour les équipes."
              />
            }
          />
          <Route
            path="users"
            element={
              <PlaceholderPage
                title="Utilisateurs"
                description="Gérez les accès et les profils administrateurs."
              />
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
