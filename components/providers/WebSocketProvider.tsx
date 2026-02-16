'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { websocketService } from '@/lib/websocket'

interface WebSocketContextValue {
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  subscribeToPrice: (assetId: string, callback: (data: any) => void) => () => void
  subscribeToOrders: (userId: string, callback: (data: any) => void) => () => void
  forceReconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  })

  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!user || !token) {
      websocketService.disconnect()
      cleanup()
      setConnectionStatus({ isConnected: false, isConnecting: false, reconnectAttempts: 0 })
      return
    }

    const initWebSocket = async () => {
      try {
        setConnectionStatus(prev => ({ ...prev, isConnecting: true }))
        await websocketService.connect(token)

        statusIntervalRef.current = setInterval(() => {
          const status = websocketService.getConnectionStatus()
          setConnectionStatus(prev => {
            // ✅ FIX: Hanya update state kalau benar-benar ada perubahan
            // Tanpa ini, setiap detik state berubah → semua consumer re-render
            if (
              prev.isConnected === status.isConnected &&
              prev.isConnecting === status.isConnecting &&
              prev.reconnectAttempts === status.reconnectAttempts
            ) {
              return prev // ← return referensi sama, React skip re-render
            }
            return {
              isConnected: status.isConnected,
              isConnecting: status.isConnecting,
              reconnectAttempts: status.reconnectAttempts,
            }
          })
        }, 1000)

      } catch (error) {
        console.error('WebSocket init error:', error)
        setConnectionStatus(prev => ({ ...prev, isConnecting: false }))
      }
    }

    reconnectTimeoutRef.current = setTimeout(initWebSocket, 1000)

    return () => {
      cleanup()
      websocketService.disconnect()
    }
  }, [user?.id, token, cleanup])

  const subscribeToPrice = useCallback((assetId: string, callback: (data: any) => void) => {
    return websocketService.subscribeToPrice(assetId, callback)
  }, [])

  const subscribeToOrders = useCallback((userId: string, callback: (data: any) => void) => {
    return websocketService.subscribeToOrders(userId, callback)
  }, [])

  const forceReconnect = useCallback(() => {
    console.log('🔄 Force reconnecting WebSocket...')
    websocketService.forceReconnect()
  }, [])

  const value: WebSocketContextValue = {
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    isReconnecting: !connectionStatus.isConnected && connectionStatus.reconnectAttempts > 0,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    subscribeToPrice,
    subscribeToOrders,
    forceReconnect,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export function usePriceSubscription(assetId: string | null, enabled = true) {
  const { subscribeToPrice, isConnected } = useWebSocket()
  const [priceData, setPriceData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    // ✅ FIX: Guard di dalam effect, bukan di dependency array
    // isConnected DIHAPUS dari deps — kalau dipakai sebagai dep,
    // polling 1 detik di atas bikin hook ini subscribe/unsubscribe terus-menerus
    if (!assetId || !enabled) return

    console.log('📡 Subscribing to price:', assetId)

    const unsubscribe = subscribeToPrice(assetId, (data) => {
      setPriceData(data)
      setLastUpdate(Date.now())
    })

    return () => {
      console.log('📡 Unsubscribing from price:', assetId)
      unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, enabled, subscribeToPrice])
  // ✅ isConnected sengaja tidak ada di sini

  return { priceData, lastUpdate }
}

export function useOrderSubscription(userId: string | null, enabled = true) {
  const { subscribeToOrders, isConnected } = useWebSocket()
  const [orderUpdate, setOrderUpdate] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    // ✅ FIX: Sama — guard di dalam, isConnected dihapus dari deps
    if (!userId || !enabled) return

    console.log('📡 Subscribing to orders:', userId)

    const unsubscribe = subscribeToOrders(userId, (data) => {
      console.log('📡 Order update received:', data)
      setOrderUpdate(data)
      setLastUpdate(Date.now())
    })

    return () => {
      console.log('📡 Unsubscribing from orders:', userId)
      unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled, subscribeToOrders])
  // ✅ isConnected sengaja tidak ada di sini

  return { orderUpdate, lastUpdate }
}