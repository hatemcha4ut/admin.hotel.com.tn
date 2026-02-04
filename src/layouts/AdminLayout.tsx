import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingState from '../components/LoadingState'

import { ROLES } from '../auth/roles'

const menuItems = [
  { label: 'Tableau de bord', to: '/', roles: [ROLES.admin, ROLES.manager, ROLES.staff] },
  { label: 'Réservations', to: '/reservations', roles: [ROLES.admin, ROLES.manager] },
  { label: 'Rapports', to: '/reports', roles: [ROLES.admin, ROLES.manager] },
  { label: 'Utilisateurs', to: '/users', roles: [ROLES.admin] },
]

function AdminLayout() {
  const { user, adminUser, signOut, loading } = useAuth()

  if (loading) {
    return <LoadingState message="Chargement du menu..." />
  }

  if (!adminUser) {
    return <LoadingState message="Aucun accès administrateur disponible." />
  }

  const availableItems = menuItems.filter((item) => item.roles.includes(adminUser.role))

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-title">Hotel Admin</p>
          <p className="muted">Connecté en tant que {user?.email}</p>
        </div>
        <button type="button" className="secondary" onClick={() => signOut()}>
          Se déconnecter
        </button>
      </header>

      <div className="app-content">
        <aside className="app-nav">
          <nav>
            {availableItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <p className="muted role">Rôle: {adminUser.role}</p>
        </aside>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
