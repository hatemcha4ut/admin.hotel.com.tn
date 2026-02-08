/**
 * Hook for admin booking operations
 */

import { useCallback, useState } from 'react'
import { getBookings, getBooking, refreshBookingStatus, cancelBooking, type AdminBooking } from '../lib/adminApi'

export const useAdminBookings = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async (filters?: Record<string, unknown>) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBookings(filters)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des réservations')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBooking = useCallback(async (id: string): Promise<AdminBooking | null> => {
    setLoading(true)
    setError(null)
    try {
      const data = await getBooking(id)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération de la réservation')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshStatus = useCallback(async (id: string): Promise<AdminBooking | null> => {
    setError(null)
    try {
      const data = await refreshBookingStatus(id)
      // Update in list if present
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? data : b))
      )
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement du statut')
      return null
    }
  }, [])

  const cancel = useCallback(async (id: string): Promise<AdminBooking | null> => {
    setError(null)
    try {
      const data = await cancelBooking(id)
      // Update in list if present
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? data : b))
      )
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation de la réservation')
      return null
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    fetchBooking,
    refreshStatus,
    cancel,
    clearError,
  }
}
