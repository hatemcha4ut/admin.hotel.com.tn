import { useEffect, useMemo, useState } from 'react'
import type { BookingListFilters, BookingRecord, BookingStatus } from '../data/supabase'
import { fetchBookings } from '../data/supabase'
import { openWhatsAppChat } from '../utils/whatsapp'
import { useAdminBookings } from '../hooks/useAdminBookings'
import { isActionableBooking, getActionableLabel } from '../utils/bookingHelpers'

interface BookingsListPageProps {
  onSelectBooking: (id: string) => void
}

// Extended booking record that may include admin fields
interface ExtendedBookingRecord extends BookingRecord {
  mygo_booking_id?: string
  myGoState?: 'OnRequest' | 'Validated' | 'Cancelled'
  clictopay_order_id?: string
  payment_status?: 'preauth' | 'captured' | 'reversed' | 'failed'
  validated_at?: string | null
  cancelled_at?: string | null
  wallet_insufficient?: boolean
}

const PAGE_SIZE = 10

const statusOptions: Array<{ label: string; value: BookingStatus | 'all' | 'actionable' }> = [
  { label: 'All', value: 'all' },
  { label: '🔔 Actionable (OnRequest/Wallet Low)', value: 'actionable' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Checked Out', value: 'checked_out' },
]

const formatDate = (value: string | null): string => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
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
      return 'Pré-auth'
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

const BookingsListPage = ({ onSelectBooking }: BookingsListPageProps) => {
  const [status, setStatus] = useState<BookingStatus | 'all' | 'actionable'>('all')
  const [guest, setGuest] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState<ExtendedBookingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const { refreshStatus, cancel } = useAdminBookings()

  // Filter bookings for actionable state locally
  const displayedBookings = status === 'actionable' 
    ? bookings.filter(isActionableBooking)
    : bookings

  const displayedTotal = status === 'actionable' ? displayedBookings.length : total

  const filters = useMemo<BookingListFilters>(
    () => ({
      status: status === 'actionable' || status === 'all' ? 'all' : status,
      guest: guest.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [status, guest, startDate, endDate],
  )

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchBookings(filters, page, PAGE_SIZE)
        if (isMounted) {
          setBookings(response.data)
          setTotal(response.total)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadBookings()

    return () => {
      isMounted = false
    }
  }, [filters, page])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  const handleRefresh = async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await refreshStatus(id)
      if (updated) {
        // Update the booking in the list
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...updated } as ExtendedBookingRecord : b))
        )
      }
    } catch (err) {
      console.error('Failed to refresh booking:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.')) {
      return
    }
    setActionLoading(id)
    try {
      const updated = await cancel(id)
      if (updated) {
        // Update the booking in the list
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...updated } as ExtendedBookingRecord : b))
        )
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Bookings</h1>
          <p className="subtitle">Review and manage guest reservations.</p>
        </div>
      </header>

      <section className="filters">
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | 'all' | 'actionable')}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Guest</span>
          <input
            type="search"
            placeholder="Name or email"
            value={guest}
            onChange={(event) => setGuest(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Check-in from</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="field">
          <span>Check-out to</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </section>

      <section className="card">
        <div className="table-header">
          <h2>Results</h2>
          <span className="muted">{displayedTotal} total</span>
        </div>
        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="loading">Loading bookings…</div> : null}
        {!loading ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>myGO ID</th>
                  <th>Guest</th>
                  <th>Stay</th>
                  <th>État myGO</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                  <th>Total</th>
                  <th>WhatsApp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  displayedBookings.map((booking) => {
                    const isActionable = isActionableBooking(booking)
                    return (
                    <tr key={booking.id} className={isActionable ? 'booking-row-actionable' : ''}>
                      <td className="mono">{booking.id.substring(0, 8)}</td>
                      <td className="mono">
                        {booking.mygo_booking_id ? booking.mygo_booking_id.substring(0, 8) : '-'}
                      </td>
                      <td>
                        <div className="cell-title">{booking.guest_name ?? 'Guest'}</div>
                        <div className="muted small">{booking.guest_email ?? '-'}</div>
                      </td>
                      <td>
                        <div className="cell-title">{formatDate(booking.check_in)}</div>
                        <div className="muted small">to {formatDate(booking.check_out)}</div>
                      </td>
                      <td>
                        {booking.myGoState && (
                          <span title={booking.myGoState}>
                            {getMyGoStateEmoji(booking.myGoState)} {booking.myGoState}
                          </span>
                        )}
                        {!booking.myGoState && '-'}
                        {isActionable && (
                          <div className="actionable-badge">
                            {getActionableLabel(booking)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status status-${booking.status ?? 'pending'}`}>
                          {booking.status ?? 'pending'}
                        </span>
                      </td>
                      <td>
                        <span className="small">{getPaymentStatusBadge(booking.payment_status)}</span>
                      </td>
                      <td>{formatCurrency(booking.total_amount)}</td>
                      <td>
                        {booking.guest_whatsapp_number ? (
                          <button
                            className="link"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openWhatsAppChat(booking.guest_whatsapp_number!, booking.id)
                            }}
                          >
                            {booking.guest_whatsapp_number}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            className="link" 
                            type="button" 
                            onClick={() => onSelectBooking(booking.id)}
                          >
                            Voir
                          </button>
                          <button
                            className="link"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRefresh(booking.id)
                            }}
                            disabled={actionLoading === booking.id}
                            title="Rafraîchir le statut depuis myGO et le fournisseur de paiement"
                          >
                            {actionLoading === booking.id ? '⏳' : '🔄'}
                          </button>
                          {isActionable && (
                            <button
                              className="link"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancel(booking.id)
                              }}
                              disabled={actionLoading === booking.id}
                              title="Annuler la réservation"
                              style={{ color: '#dc2626' }}
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="pagination">
          <button type="button" onClick={() => setPage((prev) => prev - 1)} disabled={!canGoPrev}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button type="button" onClick={() => setPage((prev) => prev + 1)} disabled={!canGoNext}>
            Next
          </button>
        </div>
      </section>
    </div>
  )
}

export default BookingsListPage
