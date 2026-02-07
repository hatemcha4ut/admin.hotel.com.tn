import { useEffect, useState } from 'react'
import type { BookingRecord, BookingStatus } from '../data/supabase'
import { fetchBookingById, updateBookingStatus, fetchUserWhatsApp } from '../data/supabase'
import WhatsAppButton from '../components/WhatsAppButton'

interface BookingDetailsPageProps {
  bookingId: string
  onBack: () => void
}

const statusOptions: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out']

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const BookingDetailsPage = ({ bookingId, onBack }: BookingDetailsPageProps) => {
  const [booking, setBooking] = useState<BookingRecord | null>(null)
  const [status, setStatus] = useState<BookingStatus>('pending')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userWhatsApp, setUserWhatsApp] = useState<string | null>(null)

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
                {booking.total_amount === null ? '-' : `$${booking.total_amount.toLocaleString()}`}
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
                {booking.booking_mode === 'SANS_COMPTE' ? 'Réservation invité' : 
                 booking.booking_mode === 'AVEC_COMPTE' ? 'Réservation connecté' : '—'}
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
        ) : null}
        {!loading && !booking && !error ? (
          <div className="empty">Booking not found.</div>
        ) : null}
      </section>
    </div>
  )
}

export default BookingDetailsPage
