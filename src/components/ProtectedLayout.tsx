import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingState from './LoadingState'

function ProtectedLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingState message="Chargement de votre accès..." />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedLayout
