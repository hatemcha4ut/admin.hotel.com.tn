import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Booking = {
  id: string
  guest_name: string | null
  guest_email: string | null
  status: string | null
}

function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('id, guest_name, guest_email, status')
      if (!isMounted) {
        return
      }
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setBookings(data ?? [])
      }
      setLoading(false)
    }

    loadBookings()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">Dernières réservations récupérées depuis Supabase.</p>
        </div>
      </header>

      <section className="card">
        {error ? <div className="error">{error}</div> : null}
        {loading ? <div className="loading">Chargement des réservations…</div> : null}
        {!loading && !error && bookings.length === 0 ? (
          <div className="empty">Aucune réservation.</div>
        ) : null}
        {!loading && bookings.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="mono">{booking.id}</td>
                    <td>{booking.guest_name ?? '-'}</td>
                    <td>{booking.guest_email ?? '-'}</td>
                    <td>{booking.status ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default Dashboard
