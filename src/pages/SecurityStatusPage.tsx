/**
 * Security Status Page - Admin role and environment information
 */

import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { getVersion, type VersionInfo } from '../lib/adminApi'
import LoadingState from '../components/LoadingState'

export default function SecurityStatusPage() {
  const { user, adminUser, session, hasAdminAccess } = useAuth()
  const [version, setVersion] = useState<VersionInfo | null>(null)
  const [versionError, setVersionError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const data = await getVersion()
        setVersion(data)
      } catch (err) {
        setVersionError(err instanceof Error ? err.message : 'Erreur lors de la récupération de la version')
      }
    }

    fetchVersion()
  }, [])

  if (!user || !adminUser) {
    return <LoadingState message="Chargement des informations de sécurité..." />
  }

  const environment = import.meta.env.MODE || 'production'
  const isProduction = environment === 'production'

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Sécurité</h1>
          <p className="subtitle">Informations d'accès et d'environnement</p>
        </div>
      </header>

      <section className="card">
        <h2>Utilisateur actuel</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Email</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">ID Utilisateur</span>
            <span className="value mono">{user.id}</span>
          </div>
          <div className="info-item">
            <span className="label">Rôle</span>
            <span className="value badge">{adminUser.role}</span>
          </div>
          <div className="info-item">
            <span className="label">Accès Admin</span>
            <span className={`badge ${hasAdminAccess ? 'badge-success' : 'badge-danger'}`}>
              {hasAdminAccess ? '✓ Autorisé' : '✗ Refusé'}
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Session</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Token</span>
            <span className="value mono">
              {session?.access_token ? `${session.access_token.substring(0, 20)}...` : '-'}
            </span>
          </div>
          {session?.expires_at && (
            <div className="info-item">
              <span className="label">Expiration</span>
              <span className="value">{formatDate(new Date(session.expires_at * 1000).toISOString())}</span>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Environnement</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Mode</span>
            <span className={`badge ${isProduction ? 'badge-success' : 'badge-warning'}`}>
              {environment}
            </span>
          </div>
          <div className="info-item">
            <span className="label">API Base URL</span>
            <span className="value mono">{import.meta.env.VITE_API_BASE_URL || 'https://api.hotel.com.tn'}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Version de l'application</h2>
        {versionError ? (
          <div className="error">{versionError}</div>
        ) : version ? (
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Commit SHA</span>
              <span className="value mono">{version.sha}</span>
            </div>
            <div className="info-item">
              <span className="label">Build Date</span>
              <span className="value">{formatDate(version.builtAt)}</span>
            </div>
            {version.environment && (
              <div className="info-item">
                <span className="label">Environnement de build</span>
                <span className="value">{version.environment}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="loading">Chargement des informations de version...</div>
        )}
      </section>
    </div>
  )
}
