import { useState } from 'react'
import './App.css'
import BookingDetailsPage from './pages/BookingDetailsPage'
import BookingsListPage from './pages/BookingsListPage'

const App = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="app">
      {selectedId ? (
        <BookingDetailsPage bookingId={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <BookingsListPage onSelectBooking={setSelectedId} />
      )}
    </div>
  )
}

export default App
