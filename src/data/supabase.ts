export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out'

export interface BookingRecord {
  id: string
  status: BookingStatus | null
  guest_name: string | null
  guest_email: string | null
  check_in: string | null
  check_out: string | null
  total_amount: number | null
  created_at: string | null
}

export interface BookingListResponse {
  data: BookingRecord[]
  total: number
}

export interface BookingListFilters {
  status?: BookingStatus | 'all'
  guest?: string
  startDate?: string
  endDate?: string
}

export interface BookingStatusUpdate {
  status: BookingStatus
}

const getSupabaseUrl = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) {
    throw new Error('VITE_SUPABASE_URL is not set')
  }
  return url
}

const getAnonKey = (): string => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not set')
  }
  return key
}

const getAccessToken = (): string | undefined => {
  for (const key of Object.keys(localStorage)) {
    if (key.includes('sb-') && key.endsWith('-auth-token')) {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) {
          continue
        }
        const parsed = JSON.parse(raw) as { access_token?: string }
        if (parsed.access_token) {
          return parsed.access_token
        }
      } catch {
        continue
      }
    }
  }
  return undefined
}

const buildHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    apikey: getAnonKey(),
    'Content-Type': 'application/json',
  }
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const encodeFilter = (field: string, op: string, value: string): string => {
  return `${field}=${op}.${encodeURIComponent(value)}`
}

const encodeOrFilter = (field: string, op: string, value: string): string => {
  return `${field}.${op}.${encodeURIComponent(value)}`
}

const buildListQuery = (filters: BookingListFilters, page: number, pageSize: number): string => {
  const params: string[] = []
  if (filters.status && filters.status !== 'all') {
    params.push(encodeFilter('status', 'eq', filters.status))
  }
  if (filters.guest) {
    const query = `%${filters.guest.trim()}%`
    params.push(`or=(${encodeOrFilter('guest_name', 'ilike', query)},${encodeOrFilter('guest_email', 'ilike', query)})`)
  }
  if (filters.startDate) {
    params.push(encodeFilter('check_in', 'gte', filters.startDate))
  }
  if (filters.endDate) {
    params.push(encodeFilter('check_out', 'lte', filters.endDate))
  }
  params.push('order=created_at.desc')
  params.push(`limit=${pageSize}`)
  params.push(`offset=${(page - 1) * pageSize}`)
  return params.join('&')
}

export const fetchBookings = async (
  filters: BookingListFilters,
  page: number,
  pageSize: number,
): Promise<BookingListResponse> => {
  const query = buildListQuery(filters, page, pageSize)
  const response = await fetch(`${getSupabaseUrl()}/rest/v1/bookings?${query}`, {
    headers: {
      ...buildHeaders(),
      Prefer: 'count=exact',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch bookings')
  }

  const data = (await response.json()) as BookingRecord[]
  const countHeader = response.headers.get('content-range')
  const totalValue = countHeader ? Number(countHeader.split('/')[1]) : data.length
  const total = Number.isFinite(totalValue) ? totalValue : data.length

  return { data, total }
}

export const fetchBookingById = async (id: string): Promise<BookingRecord | null> => {
  const response = await fetch(
    `${getSupabaseUrl()}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}&limit=1`,
    {
    headers: buildHeaders(),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch booking')
  }

  const data = (await response.json()) as BookingRecord[]
  return data[0] ?? null
}

export const updateBookingStatus = async (id: string, update: BookingStatusUpdate): Promise<void> => {
  const response = await fetch(`${getSupabaseUrl()}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(update),
  })

  if (!response.ok) {
    throw new Error('Failed to update booking')
  }
}
