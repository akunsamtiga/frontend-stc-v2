// components/providers/WebSocketProvider.tsx - WebSocket Context
'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth'
import { websocketService } from '@/lib/websocket'
import { toast } from 'sonner'

interface WebSocketContextValue {
  isConnected: boolean
  isConnecting: boolean
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

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) {
      // Disconnect if user logs out
      websocketService.disconnect()
      setConnectionStatus({
        isConnected: false,
        isConnecting: false,
        reconnectAttempts: 0,
      })
      return
    }

    // Connect WebSocket
    const initWebSocket = async () => {
      console.log('🚀 Initializing WebSocket for user:', user.email)
      
      try {
        await websocketService.connect(token)
        
        // Update status periodically
        const statusInterval = setInterval(() => {
          const status = websocketService.getConnectionStatus()
          setConnectionStatus({
            isConnected: status.isConnected,
            isConnecting: status.isConnecting,
            reconnectAttempts: status.reconnectAttempts,
          })
        }, 1000)

        return () => {
          clearInterval(statusInterval)
        }
      } catch (error) {
        console.error('WebSocket init error:', error)
      }
    }

    // Delay connection slightly to avoid race conditions
    const timer = setTimeout(initWebSocket, 500)

    return () => {
      clearTimeout(timer)
      websocketService.disconnect()
    }
  }, [user?.id, token])

  // Subscribe to price updates
  const subscribeToPrice = useCallback((assetId: string, callback: (data: any) => void) => {
    console.log('📡 Subscribing to price updates:', assetId)
    return websocketService.subscribeToPrice(assetId, callback)
  }, [])

  // Subscribe to order updates
  const subscribeToOrders = useCallback((userId: string, callback: (data: any) => void) => {
    console.log('📡 Subscribing to order updates:', userId)
    return websocketService.subscribeToOrders(userId, callback)
  }, [])

  const value: WebSocketContextValue = {
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
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

// Hook untuk subscribe price dengan auto cleanup
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

// Hook untuk subscribe orders dengan auto cleanup
export function useOrderSubscription(userId: string | null, enabled = true) {
  const { subscribeToOrders } = useWebSocket()
  const [orderUpdate, setOrderUpdate] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    if (!userId || !enabled) return

    const unsubscribe = subscribeToOrders(userId, (data) => {
      console.log('📦 Order update received:', data)
      
      setOrderUpdate(data)
      setLastUpdate(Date.now())

      // Show notification for settled orders
      if (data.event === 'order:settled') {
        const isWin = data.status === 'WON'
        const profitText = data.profit > 0 ? `+${data.profit.toFixed(0)}` : data.profit.toFixed(0)
        
        toast[isWin ? 'success' : 'error'](
          `Order ${isWin ? 'Won! 🎉' : 'Lost'}`,
          {
            description: `${data.asset_symbol || 'Order'} - ${profitText}`,
            duration: 4000,
          }
        )
      }
    })

    return unsubscribe
  }, [userId, enabled, subscribeToOrders])

  return { orderUpdate, lastUpdate }
}