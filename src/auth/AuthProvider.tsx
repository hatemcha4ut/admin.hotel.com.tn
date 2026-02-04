import type { AuthSession, AuthUser } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { fetchAdminUser, isAdminUser, type AdminUser } from './authService'
import { supabase } from './supabaseClient'

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAdminUser = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser?.email) {
      setAdminUser(null)
      return
    }

    try {
      const data = await fetchAdminUser(authUser.email)
      setAdminUser(data ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la récupération du rôle.'
      setError(message)
      setAdminUser(null)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          setError(sessionError.message)
        }

        if (!isMounted) {
          return
        }

        setSession(data.session)
        setUser(data.session?.user ?? null)
        await loadAdminUser(data.session?.user ?? null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initialize()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!isMounted) {
          return
        }
        setLoading(true)
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        await loadAdminUser(currentSession?.user ?? null)
        if (isMounted) {
          setLoading(false)
        }
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [loadAdminUser])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError(signInError.message)
      throw signInError
    }
  }, [])

  const signInWithMagicLink = useCallback(async (email: string) => {
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })
    if (signInError) {
      setError(signInError.message)
      throw signInError
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
      throw signOutError
    }
    setAdminUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      adminUser,
      hasAdminAccess: isAdminUser(adminUser),
      loading,
      error,
      signInWithPassword,
      signInWithMagicLink,
      signOut,
      clearError,
    }),
    [
      adminUser,
      error,
      loading,
      session,
      signInWithMagicLink,
      signInWithPassword,
      signOut,
      user,
      clearError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthProvider }
