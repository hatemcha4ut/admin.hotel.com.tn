 copilot/add-bookings-list-and-details-pages
import { useState } from 'react'
import './App.css'
import BookingDetailsPage from './pages/BookingDetailsPage'
import BookingsListPage from './pages/BookingsListPage'

const App = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/useAuth'
import LoadingState from './components/LoadingState'
import AdminLayout from './layouts/AdminLayout'
import AccessDeniedPage from './pages/AccessDeniedPage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'

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
 main

  return (
copilot/add-bookings-list-and-details-pages
    <div className="app">
      {selectedId ? (
        <BookingDetailsPage bookingId={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <BookingsListPage onSelectBooking={setSelectedId} />
      )}
    </div>

    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route
          index
          element={
            <PlaceholderPage
              title="Tableau de bord"
              description="Bienvenue dans l’espace d’administration de l’hôtel."
            />
          }
        />
        <Route
          path="reservations"
          element={
            <PlaceholderPage
              title="Réservations"
              description="Gérez les réservations et le planning des chambres."
            />
          }
        />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
 main
  )
}

export default App
