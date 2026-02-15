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

  // ✅ FIX: Use ref untuk menghindari re-render berlebihan
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ FIX: Cleanup function yang proper
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
      setConnectionStatus({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
      })
      return
    }

    const initWebSocket = async () => {
      try {
        setConnectionStatus(prev => ({ ...prev, isConnecting: true }))
        
        await websocketService.connect(token)
        
        // ✅ FIX: Polling setiap 1 detik cukup, tidak perlu 200ms
        statusIntervalRef.current = setInterval(() => {
          const status = websocketService.getConnectionStatus()
          setConnectionStatus({
            isConnected: status.isConnected,
            isConnecting: status.isConnecting,
            reconnectAttempts: status.reconnectAttempts,
          })
        }, 1000) // 1 detik cukup

      } catch (error) {
        console.error('WebSocket init error:', error)
        setConnectionStatus(prev => ({ ...prev, isConnecting: false }))
      }
    }

    // ✅ FIX: Delay lebih lama untuk menghindari race condition saat login
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

  // ✅ FIX: Tambahkan force reconnect function
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
    if (!assetId || !enabled) return

    console.log('📡 Subscribing to price:', assetId, 'Connected:', isConnected)
    
    const unsubscribe = subscribeToPrice(assetId, (data) => {
      setPriceData(data)
      setLastUpdate(Date.now())
    })

    return () => {
      console.log('📡 Unsubscribing from price:', assetId)
      unsubscribe()
    }
  }, [assetId, enabled, subscribeToPrice, isConnected])

  return { priceData, lastUpdate }
}

export function useOrderSubscription(userId: string | null, enabled = true) {
  const { subscribeToOrders, isConnected } = useWebSocket()
  const [orderUpdate, setOrderUpdate] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    if (!userId || !enabled) return

    console.log('📡 Subscribing to orders:', userId, 'Connected:', isConnected)
    
    const unsubscribe = subscribeToOrders(userId, (data) => {
      console.log('📡 Order update received:', data)
      setOrderUpdate(data)
      setLastUpdate(Date.now())
    })

    return () => {
      console.log('📡 Unsubscribing from orders:', userId)
      unsubscribe()
    }
  }, [userId, enabled, subscribeToOrders, isConnected])

  return { orderUpdate, lastUpdate }
}