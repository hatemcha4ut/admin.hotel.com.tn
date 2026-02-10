/**
 * Admin API Client
 * All API calls go through api.hotel.com.tn (never call myGO directly from frontend)
 */

import { supabase } from './supabase'

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'https://api.hotel.com.tn'
}

const getAuthToken = async (): Promise<string> => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) {
    throw new Error('Non authentifié')
  }
  return session.access_token
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login'
    throw new Error('Session expirée. Veuillez vous reconnecter.')
  }

  if (!response.ok) {
    let errorMessage = `Erreur ${response.status}`
    try {
      const data = await response.json()
      errorMessage = data.message || data.error || errorMessage
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage)
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T
  }

  return response.json()
}

export interface MyGoCreditInfo {
  RemainingDeposit: number
  Currency: string
  lastUpdate?: string
}

export interface CheckoutPolicy {
  policy: 'STRICT' | 'ON_HOLD_PREAUTH'
  updatedAt?: string
  updatedBy?: string
  history?: Array<{
    policy: string
    updatedAt: string
    updatedBy: string
  }>
}

export interface AdminBooking {
  id: string
  mygo_booking_id?: string
  myGoState?: 'OnRequest' | 'Validated' | 'Cancelled'
  status: string
  guest_name?: string
  guest_email?: string
  check_in?: string
  check_out?: string
  total?: number
  currency?: string
  created_at?: string
  validated_at?: string
  cancelled_at?: string
  clictopay_order_id?: string
  payment_status?: 'preauth' | 'captured' | 'reversed' | 'failed'
  wallet_insufficient?: boolean
}

export interface VersionInfo {
  sha: string
  builtAt: string
  environment?: string
}

/**
 * Get myGO credit balance
 */
export const getMyGoCredit = async (): Promise<MyGoCreditInfo> => {
  const token = await getAuthToken()
  const response = await fetch(`${getApiBaseUrl()}/api/admin/mygo/credit`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<MyGoCreditInfo>(response)
}

/**
 * Get checkout policy
 */
export const getCheckoutPolicy = async (): Promise<CheckoutPolicy> => {
  const token = await getAuthToken()
  const response = await fetch(`${getApiBaseUrl()}/api/admin/settings/checkout-policy`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<CheckoutPolicy>(response)
}

/**
 * Update checkout policy
 */
export const updateCheckoutPolicy = async (policy: 'STRICT' | 'ON_HOLD_PREAUTH'): Promise<CheckoutPolicy> => {
  const token = await getAuthToken()
  const response = await fetch(`${getApiBaseUrl()}/api/admin/settings/checkout-policy`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ policy }),
  })
  return handleResponse<CheckoutPolicy>(response)
}

/**
 * Get bookings list with admin fields
 */
export const getBookings = async (filters?: Record<string, unknown>): Promise<AdminBooking[]> => {
  const token = await getAuthToken()
  const queryParams = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const url = `${getApiBaseUrl()}/api/admin/bookings${queryParams.toString() ? `?${queryParams}` : ''}`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<AdminBooking[]>(response)
}

/**
 * Get single booking with admin fields
 */
export const getBooking = async (id: string): Promise<AdminBooking> => {
  const token = await getAuthToken()
  const response = await fetch(`${getApiBaseUrl()}/api/admin/bookings/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<AdminBooking>(response)
}

/**
 * Refresh booking status from myGO + payment provider
 */
export const refreshBookingStatus = async (id: string): Promise<AdminBooking> => {
  const token = await getAuthToken()
  const response = await fetch(`${getApiBaseUrl()}/api/admin/bookings/${id}/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<AdminBooking>(response)
}

/**
 * Cancel booking (cancels in myGO + reverses preauth)
 */
export const cancelBooking = async (id: string): Promise<AdminBooking> => {
  const token = await getAuthToken()
  const response = await fetch(`${getApiBaseUrl()}/api/admin/bookings/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  return handleResponse<AdminBooking>(response)
}

/**
 * Get version info
 */
export const getVersion = async (): Promise<VersionInfo> => {
  const response = await fetch(`${getApiBaseUrl()}/api/version`)
  return handleResponse<VersionInfo>(response)
}
