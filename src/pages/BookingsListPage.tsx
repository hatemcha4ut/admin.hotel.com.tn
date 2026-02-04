import { useEffect, useMemo, useState } from 'react'
import type { BookingListFilters, BookingRecord, BookingStatus } from '../data/supabase'
import { fetchBookings } from '../data/supabase'

interface BookingsListPageProps {
  onSelectBooking: (id: string) => void
}

const PAGE_SIZE = 10

const statusOptions: Array<{ label: string; value: BookingStatus | 'all' }> = [
  { label: 'All', value: 'all' },
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

const BookingsListPage = ({ onSelectBooking }: BookingsListPageProps) => {
  const [status, setStatus] = useState<BookingStatus | 'all'>('all')
  const [guest, setGuest] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filters = useMemo<BookingListFilters>(
    () => ({
      status,
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
          <select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus | 'all')}>
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
          <span className="muted">{total} total</span>
        </div>
        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="loading">Loading bookings…</div> : null}
        {!loading ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Guest</th>
                  <th>Stay</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="mono">{booking.id}</td>
                      <td>
                        <div className="cell-title">{booking.guest_name ?? 'Guest'}</div>
                        <div className="muted small">{booking.guest_email ?? '-'}</div>
                      </td>
                      <td>
                        <div className="cell-title">{formatDate(booking.check_in)}</div>
                        <div className="muted small">to {formatDate(booking.check_out)}</div>
                      </td>
                      <td>
                        <span className={`status status-${booking.status ?? 'pending'}`}>
                          {booking.status ?? 'pending'}
                        </span>
                      </td>
                      <td>{formatCurrency(booking.total_amount)}</td>
                      <td>
                        <button className="link" type="button" onClick={() => onSelectBooking(booking.id)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
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
