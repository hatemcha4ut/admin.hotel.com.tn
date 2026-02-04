import type { AuthUser } from '@supabase/supabase-js'
import type { Role } from './roles'
import { supabase } from './supabaseClient'

export type AdminUser = {
  role: Role
}

export const fetchAdminUser = async (email: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export const isAdminUser = (adminUser: AdminUser | null) => Boolean(adminUser)

export const getUserEmail = (user: AuthUser | null) => user?.email ?? null
