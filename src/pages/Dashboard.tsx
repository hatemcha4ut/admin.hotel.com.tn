import { useEffect, useState } from 'react'
import { getBookings, type AdminBooking } from '../lib/adminApi'
import MyGoCreditCard from '../components/MyGoCreditCard'

function Dashboard() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadBookings = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getBookings({ limit: 10 })
        if (!isMounted) {
          return
        }
        setBookings(data ?? [])
      } catch (err) {
        if (!isMounted) {
          return
        }
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
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
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">Dernières réservations récupérées via l'API backend.</p>
        </div>
      </header>

      <MyGoCreditCard />

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
                  <th>État myGO</th>
                  <th>Statut Paiement</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="mono">{booking.id}</td>
                    <td>{booking.guest_name ?? '-'}</td>
                    <td>{booking.guest_email ?? '-'}</td>
                    <td>{booking.status ?? '-'}</td>
                    <td>{booking.myGoState ?? '-'}</td>
                    <td>{booking.payment_status ?? '-'}</td>
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
