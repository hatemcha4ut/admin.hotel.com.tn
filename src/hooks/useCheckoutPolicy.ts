/**
 * Hook for checkout policy management
 */

import { useCallback, useEffect, useState } from 'react'
import { getCheckoutPolicy, updateCheckoutPolicy, type CheckoutPolicy } from '../lib/adminApi'

export const useCheckoutPolicy = () => {
  const [policy, setPolicy] = useState<CheckoutPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchPolicy = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCheckoutPolicy()
      setPolicy(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération de la politique')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicy()
  }, [fetchPolicy])

  const updatePolicy = useCallback(async (newPolicy: 'STRICT' | 'ON_HOLD_PREAUTH') => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await updateCheckoutPolicy(newPolicy)
      setPolicy(data)
      setSuccess('Politique mise à jour avec succès')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la politique')
    } finally {
      setSaving(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  return {
    policy,
    loading,
    saving,
    error,
    success,
    updatePolicy,
    clearMessages,
  }
}
