import { createContext } from 'react'
import type { AuthSession, AuthUser } from '@supabase/supabase-js'
import type { AdminUser } from './authService'

export type AuthContextValue = {
  session: AuthSession | null
  user: AuthUser | null
  adminUser: AdminUser | null
  hasAdminAccess: boolean
  loading: boolean
  error: string | null
  signInWithPassword: (email: string, password: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
