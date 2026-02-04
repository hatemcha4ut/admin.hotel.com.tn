import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function AccessDeniedPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="card">
      <h1>Accès refusé</h1>
      <p className="muted">
        {user?.email
          ? `Le compte ${user.email} n’est pas autorisé à accéder à l’administration.`
          : 'Ce compte n’est pas autorisé à accéder à l’administration.'}
      </p>
      <div className="actions">
        <button type="button" onClick={() => navigate('/login')}>
          Revenir au login
        </button>
        <button type="button" className="secondary" onClick={() => signOut()}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

export default AccessDeniedPage
