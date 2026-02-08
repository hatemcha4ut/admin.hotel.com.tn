/**
 * Settings Page - Checkout Policy Configuration
 */

import { useState } from 'react'
import { useCheckoutPolicy } from '../hooks/useCheckoutPolicy'
import LoadingState from '../components/LoadingState'

export default function SettingsPage() {
  const { policy, loading, saving, error, success, updatePolicy, clearMessages } = useCheckoutPolicy()
  const [selectedPolicy, setSelectedPolicy] = useState<'STRICT' | 'ON_HOLD_PREAUTH'>('STRICT')
  const [showConfirm, setShowConfirm] = useState(false)

  // Use the current policy value if available, otherwise use selectedPolicy state
  const currentPolicy = policy?.policy || selectedPolicy

  const handleSave = () => {
    setShowConfirm(true)
  }

  const confirmSave = async () => {
    setShowConfirm(false)
    await updatePolicy(currentPolicy)
  }

  const cancelSave = () => {
    setShowConfirm(false)
    clearMessages()
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <LoadingState message="Chargement des paramètres..." />
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p className="subtitle">Configuration de la politique de paiement</p>
        </div>
      </header>

      <section className="card">
        <h2>Politique de Checkout</h2>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="settings-section">
          <p className="description">
            Choisissez comment les réservations doivent être traitées :
          </p>

          <div className="policy-options">
            <label className="policy-option">
              <input
                type="radio"
                name="policy"
                value="STRICT"
                checked={currentPolicy === 'STRICT'}
                onChange={(e) => setSelectedPolicy(e.target.value as 'STRICT')}
              />
              <div>
                <strong>STRICT</strong>
                <p className="muted">
                  Le paiement doit être capturé immédiatement avant de créer la réservation myGO.
                  Si la capture échoue, la réservation n'est pas créée.
                </p>
              </div>
            </label>

            <label className="policy-option">
              <input
                type="radio"
                name="policy"
                value="ON_HOLD_PREAUTH"
                checked={currentPolicy === 'ON_HOLD_PREAUTH'}
                onChange={(e) => setSelectedPolicy(e.target.value as 'ON_HOLD_PREAUTH')}
              />
              <div>
                <strong>ON_HOLD_PREAUTH</strong>
                <p className="muted">
                  La réservation est créée immédiatement avec un état "OnRequest" et une pré-autorisation.
                  Le paiement sera capturé plus tard lors de la validation.
                </p>
              </div>
            </label>
          </div>

          {policy && (
            <div className="policy-meta">
              <div className="meta-item">
                <span className="label">Politique actuelle:</span>
                <span className="value badge">{policy.policy}</span>
              </div>
              {policy.updatedAt && (
                <div className="meta-item">
                  <span className="label">Dernière modification:</span>
                  <span className="value">{formatDate(policy.updatedAt)}</span>
                </div>
              )}
              {policy.updatedBy && (
                <div className="meta-item">
                  <span className="label">Modifié par:</span>
                  <span className="value">{policy.updatedBy}</span>
                </div>
              )}
            </div>
          )}

          <div className="actions">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || currentPolicy === policy?.policy}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {policy?.history && policy.history.length > 0 && (
          <div className="history-section">
            <h3>Historique des modifications</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Politique</th>
                    <th>Date</th>
                    <th>Modifié par</th>
                  </tr>
                </thead>
                <tbody>
                  {policy.history.map((item, index) => (
                    <tr key={index}>
                      <td><span className="badge">{item.policy}</span></td>
                      <td>{formatDate(item.updatedAt)}</td>
                      <td>{item.updatedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {showConfirm && (
        <div className="modal-overlay" onClick={cancelSave}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmer la modification</h2>
            <p>
              Êtes-vous sûr de vouloir changer la politique de checkout de{' '}
              <strong>{policy?.policy}</strong> à <strong>{currentPolicy}</strong> ?
            </p>
            <p className="muted">
              Cette modification affectera toutes les nouvelles réservations.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={cancelSave} className="secondary">
                Annuler
              </button>
              <button type="button" onClick={confirmSave}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
