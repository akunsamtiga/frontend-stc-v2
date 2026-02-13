'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'
import { websocketService } from '@/lib/websocket'

interface WebSocketContextValue {
  isConnected: boolean
  isConnecting: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  subscribeToPrice: (assetId: string, callback: (data: any) => void) => () => void
  subscribeToOrders: (userId: string, callback: (data: any) => void) => () => void
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

  useEffect(() => {
    if (!user || !token) {
      websocketService.disconnect()
      setConnectionStatus({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
      })
      return
    }

    const initWebSocket = async () => {
      try {
        await websocketService.connect(token)
        
        // ✅ FIX: Polling lebih cepat (200ms) agar status reconnect terdeteksi segera
        const statusInterval = setInterval(() => {
          const status = websocketService.getConnectionStatus()
          setConnectionStatus({
            isConnected: status.isConnected,
            isConnecting: status.isConnecting,
            reconnectAttempts: status.reconnectAttempts,
          })
        }, 200)

        return () => {
          clearInterval(statusInterval)
        }
      } catch (error) {
        console.error('WebSocket init error:', error)
      }
    }

    const timer = setTimeout(initWebSocket, 500)

    return () => {
      clearTimeout(timer)
      websocketService.disconnect()
    }
  }, [user?.id, token])

  const subscribeToPrice = useCallback((assetId: string, callback: (data: any) => void) => {
    return websocketService.subscribeToPrice(assetId, callback)
  }, [])

  const subscribeToOrders = useCallback((userId: string, callback: (data: any) => void) => {
    return websocketService.subscribeToOrders(userId, callback)
  }, [])

  const value: WebSocketContextValue = {
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    // ✅ FIX: isReconnecting = pernah connect tapi sedang reconnect (bukan initial connect)
    isReconnecting: !connectionStatus.isConnected && connectionStatus.reconnectAttempts > 0,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    subscribeToPrice,
    subscribeToOrders,
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
  const { subscribeToPrice } = useWebSocket()
  const [priceData, setPriceData] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    if (!assetId || !enabled) return

    const unsubscribe = subscribeToPrice(assetId, (data) => {
      setPriceData(data)
      setLastUpdate(Date.now())
    })

    return unsubscribe
  }, [assetId, enabled, subscribeToPrice])

  return { priceData, lastUpdate }
}

export function useOrderSubscription(userId: string | null, enabled = true) {
  const { subscribeToOrders } = useWebSocket()
  const [orderUpdate, setOrderUpdate] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    if (!userId || !enabled) return

    const unsubscribe = subscribeToOrders(userId, (data) => {
      setOrderUpdate(data)
      setLastUpdate(Date.now())
    })

    return unsubscribe
  }, [userId, enabled, subscribeToOrders])

  return { orderUpdate, lastUpdate }
}

export function usePriceStream(assetId: string | null) {
  const { isConnected } = useWebSocket()
  const [price, setPrice] = useState<number | null>(null)

  useEffect(() => {
    if (!assetId || !isConnected) return
    
    const unsubscribe = websocketService.subscribeToPrice(assetId, (data) => {
      setPrice(data.price)
    })
    
    return () => {
      unsubscribe()
      setPrice(null)
    }
  }, [assetId, isConnected])

  return price
}