import { useEffect, useState } from 'react'
import type { BookingRecord, BookingStatus } from '../data/supabase'
import { fetchBookingById, updateBookingStatus, fetchUserWhatsApp } from '../data/supabase'
import WhatsAppButton from '../components/WhatsAppButton'
import { getBookingModeLabel } from '../utils/whatsapp'
import { useAdminBookings } from '../hooks/useAdminBookings'
import { isActionableBooking, getActionableAlertMessage } from '../utils/bookingHelpers'

interface BookingDetailsPageProps {
  bookingId: string
  onBack: () => void
}

// Extended booking record that may include admin fields
interface ExtendedBookingRecord extends BookingRecord {
  mygo_booking_id?: string
  myGoState?: 'OnRequest' | 'Validated' | 'Cancelled'
  clictopay_order_id?: string
  payment_status?: 'preauth' | 'captured' | 'reversed' | 'failed'
  validated_at?: string | null
  cancelled_at?: string | null
  currency?: string
  wallet_insufficient?: boolean
}

const statusOptions: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out']

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const formatCurrency = (value: number | null, currency?: string): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(value)
}

const getMyGoStateEmoji = (state?: 'OnRequest' | 'Validated' | 'Cancelled'): string => {
  if (!state) return ''
  switch (state) {
    case 'OnRequest':
      return '🟡'
    case 'Validated':
      return '🟢'
    case 'Cancelled':
      return '🔴'
    default:
      return ''
  }
}

const getPaymentStatusBadge = (status?: string): string => {
  if (!status) return '-'
  switch (status) {
    case 'preauth':
      return 'Pré-autorisation'
    case 'captured':
      return 'Capturé'
    case 'reversed':
      return 'Annulé'
    case 'failed':
      return 'Échoué'
    default:
      return status
  }
}

const BookingDetailsPage = ({ bookingId, onBack }: BookingDetailsPageProps) => {
  const [booking, setBooking] = useState<ExtendedBookingRecord | null>(null)
  const [status, setStatus] = useState<BookingStatus>('pending')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userWhatsApp, setUserWhatsApp] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  const { refreshStatus, cancel } = useAdminBookings()

  useEffect(() => {
    let isMounted = true

    const loadBooking = async () => {
      setLoading(true)
      setError(null)
      try {
        const record = await fetchBookingById(bookingId)
        if (isMounted) {
          setBooking(record)
          if (record?.status) {
            setStatus(record.status)
          }
          // Fetch user WhatsApp if user_id exists
          if (record?.user_id) {
            const whatsapp = await fetchUserWhatsApp(record.user_id)
            if (isMounted) {
              setUserWhatsApp(whatsapp)
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load booking')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadBooking()

    return () => {
      isMounted = false
    }
  }, [bookingId])

  const handleSave = async () => {
    if (!booking) {
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await updateBookingStatus(booking.id, { status })
      setSuccess('Status updated.')
      setBooking({ ...booking, status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update booking')
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = async () => {
    if (!booking) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await refreshStatus(booking.id)
      if (updated) {
        setBooking({ ...booking, ...updated } as ExtendedBookingRecord)
        setSuccess('Statut rafraîchi avec succès')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!booking) return
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.')) {
      return
    }
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await cancel(booking.id)
      if (updated) {
        setBooking({ ...booking, ...updated } as ExtendedBookingRecord)
        setSuccess('Réservation annulée avec succès')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <button className="link" type="button" onClick={onBack}>
            ← Back to list
          </button>
          <h1>Booking details</h1>
          <p className="subtitle">Booking ID: {bookingId}</p>
        </div>
      </header>

      <section className="card">
        {error ? <div className="error">{error}</div> : null}
        {success ? <div className="success">{success}</div> : null}
        {loading ? <div className="loading">Loading booking…</div> : null}
        {!loading && booking ? (
          <>
            {/* Actionable State Alert */}
            {isActionableBooking(booking) && (
              <div className="booking-alert booking-alert-actionable">
                <strong>⚠️ Action Requise</strong>
                <p>{getActionableAlertMessage(booking)}</p>
              </div>
            )}

            <div className="details-grid">
              <div>
                <h2>Guest</h2>
                <p className="detail-title">{booking.guest_name ?? 'Guest'}</p>
                <p className="muted">{booking.guest_email ?? '-'}</p>
              </div>
              <div>
                <h2>Stay</h2>
                <p className="detail-title">{formatDateTime(booking.check_in)}</p>
                <p className="muted">to {formatDateTime(booking.check_out)}</p>
              </div>
              <div>
                <h2>Created</h2>
                <p className="detail-title">{formatDateTime(booking.created_at)}</p>
              </div>
              <div>
                <h2>Total</h2>
                <p className="detail-title">
                  {formatCurrency(booking.total_amount, booking.currency)}
                </p>
              </div>
              <div>
                <h2>Status</h2>
                <div className="status-row">
                  <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus)}>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Update status'}
                  </button>
                </div>
              </div>
              <div>
                <h2>Contact WhatsApp</h2>
                <p className="detail-title">
                  {booking.guest_whatsapp_number || userWhatsApp || '—'}
                </p>
                <p className="muted">
                  {getBookingModeLabel(booking.booking_mode)}
                </p>
                <div style={{ marginTop: '10px' }}>
                  <WhatsAppButton
                    bookingId={booking.id}
                    guestWhatsApp={booking.guest_whatsapp_number}
                    userWhatsApp={userWhatsApp}
                  />
                </div>
              </div>
            </div>

            {/* myGO State Section */}
            {(booking.myGoState || booking.wallet_insufficient) && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
                <h2>État myGO</h2>
                <div className="info-grid">
                  {booking.myGoState && (
                    <div className="info-item">
                      <span className="label">État actuel</span>
                      <span className="value" style={{ fontSize: '20px' }}>
                        {getMyGoStateEmoji(booking.myGoState)} {booking.myGoState}
                      </span>
                    </div>
                  )}
                  {booking.wallet_insufficient && (
                    <div className="info-item">
                      <span className="label">Crédit Wallet</span>
                      <span className="value" style={{ color: '#dc2626' }}>
                        🔴 Insuffisant
                      </span>
                    </div>
                  )}
                  {booking.mygo_booking_id && (
                    <div className="info-item">
                      <span className="label">myGO Booking ID</span>
                      <span className="value mono">{booking.mygo_booking_id}</span>
                    </div>
                  )}
                  {booking.validated_at && (
                    <div className="info-item">
                      <span className="label">Validé le</span>
                      <span className="value">{formatDateTime(booking.validated_at)}</span>
                    </div>
                  )}
                  {booking.cancelled_at && (
                    <div className="info-item">
                      <span className="label">Annulé le</span>
                      <span className="value">{formatDateTime(booking.cancelled_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Status Section */}
            {booking.payment_status && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
                <h2>Statut du paiement</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">État</span>
                    <span className={`badge ${
                      booking.payment_status === 'captured' ? 'badge-success' :
                      booking.payment_status === 'failed' ? 'badge-danger' :
                      booking.payment_status === 'reversed' ? 'badge-warning' : ''
                    }`}>
                      {getPaymentStatusBadge(booking.payment_status)}
                    </span>
                  </div>
                  {booking.clictopay_order_id && (
                    <div className="info-item">
                      <span className="label">Clictopay Order ID</span>
                      <span className="value mono">{booking.clictopay_order_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
              <h2>Actions Admin</h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleRefresh}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rafraîchissement...' : '🔄 Rafraîchir le statut'}
                </button>
                {isActionableBooking(booking) && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    style={{ 
                      background: '#dc2626',
                      color: '#fff',
                      padding: '0.75rem 1.4rem',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {actionLoading ? 'Annulation...' : '❌ Annuler la réservation'}
                  </button>
                )}
              </div>
              <p className="muted" style={{ marginTop: '12px' }}>
                Utilisez le rafraîchissement pour synchroniser avec myGO et le fournisseur de paiement.
              </p>
            </div>
          </>
        ) : null}
        {!loading && !booking && !error ? (
          <div className="empty">Booking not found.</div>
        ) : null}
      </section>
    </div>
  )
}

export default BookingDetailsPage
