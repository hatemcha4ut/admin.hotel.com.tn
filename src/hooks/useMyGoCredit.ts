/**
 * Hook for fetching myGO credit balance
 */

import { useCallback, useEffect, useState } from 'react'
import { getMyGoCredit, type MyGoCreditInfo } from '../lib/adminApi'

export const useMyGoCredit = () => {
  const [credit, setCredit] = useState<MyGoCreditInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredit = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyGoCredit()
      setCredit({ ...data, lastUpdate: new Date().toISOString() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du crédit')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredit()
  }, [fetchCredit])

  const refresh = useCallback(() => {
    fetchCredit()
  }, [fetchCredit])

  return {
    credit,
    loading,
    error,
    refresh,
  }
}
