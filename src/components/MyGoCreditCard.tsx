/**
 * MyGO Credit Card Component
 * Displays myGO credit balance with real-time SSE updates
 */

import { useMyGoCredit } from '../hooks/useMyGoCredit'
import { useMyGoCreditStream } from '../hooks/useMyGoCreditStream'

export default function MyGoCreditCard() {
  // Get initial snapshot
  const { credit: snapshotCredit, loading, error: snapshotError, refresh } = useMyGoCredit()
  
  // Get SSE stream updates
  const { credit: streamCredit, lastUpdate, isConnected, error: streamError } = useMyGoCreditStream()
  
  // Prefer stream credit over snapshot if available
  const credit = streamCredit || snapshotCredit
  const error = streamError || snapshotError

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: currency || 'TND',
    }).format(amount)
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="card mygo-credit-card">
      <div className="card-header">
        <h2>Crédit myGO</h2>
        {isConnected && (
          <span className="live-indicator" title="Connexion temps réel active">
            🟢 Live
          </span>
        )}
      </div>

      {loading && !credit ? (
        <div className="loading">Chargement du crédit...</div>
      ) : error ? (
        <div className="error-section">
          <p className="error">{error}</p>
          <button type="button" onClick={refresh} className="secondary">
            Réessayer
          </button>
        </div>
      ) : credit ? (
        <div className="credit-content">
          <div className="credit-amount">
            <span className="label">Dépôt restant</span>
            <span className="amount">
              {formatCurrency(credit.RemainingDeposit, credit.Currency)}
            </span>
          </div>
          
          <div className="credit-meta">
            <div className="meta-item">
              <span className="label">Devise</span>
              <span className="value">{credit.Currency}</span>
            </div>
            <div className="meta-item">
              <span className="label">Dernière MAJ</span>
              <span className="value">
                {lastUpdate ? formatDate(lastUpdate) : formatDate(credit.lastUpdate)}
              </span>
            </div>
          </div>

          <div className="credit-actions">
            <button type="button" onClick={refresh} className="secondary" disabled={loading}>
              Rafraîchir
            </button>
          </div>
        </div>
      ) : (
        <div className="empty">Aucune donnée de crédit disponible</div>
      )}
    </div>
  )
}
