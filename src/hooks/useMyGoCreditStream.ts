/**
 * Hook for real-time myGO credit updates via Server-Sent Events (SSE)
 */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { MyGoCreditInfo } from '../lib/adminApi'

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'https://api.hotel.com.tn'
}

export const useMyGoCreditStream = () => {
  const [credit, setCredit] = useState<MyGoCreditInfo | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectDelayRef = useRef<number>(1000) // Start with 1 second
  const maxReconnectDelay = 30000 // Max 30 seconds
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const connect = async () => {
      // Clear any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      try {
        // Get auth token
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session?.access_token) {
          setError('Non authentifié')
          setIsConnected(false)
          return
        }

        // Create SSE connection with auth token in query param
        const url = `${getApiBaseUrl()}/api/admin/mygo/credit/stream?token=${encodeURIComponent(session.access_token)}`
        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          if (!mountedRef.current) return
          setIsConnected(true)
          setError(null)
          reconnectDelayRef.current = 1000 // Reset reconnect delay on successful connection
        }

        eventSource.addEventListener('credit_update', (event: MessageEvent) => {
          if (!mountedRef.current) return
          try {
            const data = JSON.parse(event.data) as MyGoCreditInfo
            setCredit(data)
            setLastUpdate(new Date())
            setError(null)
          } catch (err) {
            console.error('Failed to parse credit_update event:', err)
          }
        })

        eventSource.addEventListener('heartbeat', () => {
          if (!mountedRef.current) return
          // Heartbeat received - connection is alive
          setError(null)
        })

        eventSource.onerror = () => {
          if (!mountedRef.current) return
          setIsConnected(false)
          eventSource.close()
          eventSourceRef.current = null

          // Schedule reconnection with exponential backoff
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }

          const delay = Math.min(reconnectDelayRef.current, maxReconnectDelay)
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (mountedRef.current) {
              reconnectDelayRef.current = Math.min(delay * 2, maxReconnectDelay)
              connect()
            }
          }, delay)
        }
      } catch (err) {
        if (!mountedRef.current) return
        setError(err instanceof Error ? err.message : 'Erreur de connexion SSE')
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [])

  return {
    credit,
    lastUpdate,
    isConnected,
    error,
  }
}
