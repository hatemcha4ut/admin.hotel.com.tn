import { useState } from 'react'
import BookingsListPage from './BookingsListPage'
import BookingDetailsPage from './BookingDetailsPage'

const ReservationsPage = () => {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  if (selectedBookingId) {
    return (
      <BookingDetailsPage
        bookingId={selectedBookingId}
        onBack={() => setSelectedBookingId(null)}
      />
    )
  }

  return <BookingsListPage onSelectBooking={(id) => setSelectedBookingId(id)} />
}

export default ReservationsPage
