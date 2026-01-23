'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { websocketService } from '@/lib/websocket'
import { throttle } from '@/lib/utils' // ✅ Import throttle

// ============================================
// TYPES & INTERFACES
// ============================================
interface WebSocketContextValue {
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  subscribeToPrice: (assetId: string, callback: (data: any) => void) => () => void
  subscribeToOrders: (userId: string, callback: (data: any) => void) => () => void
}

interface PriceUpdate {
  assetId: string;
  price: number;
  timestamp: number;
  datetime: string;
  volume24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
}

interface OrderUpdate {
  event: 'order:created' | 'order:settled';
  id: string;
  status?: string;
  exit_price?: number;
  profit?: number;
  asset_symbol?: string;
  timestamp: number;
}

// ============================================
// CONTEXT SETUP
// ============================================
const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

// ============================================
// PROVIDER COMPONENT
// ============================================
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
  })

  // ✅ Efek koneksi WebSocket
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

    const timer = setTimeout(initWebSocket, 500)

    return () => {
      clearTimeout(timer)
      websocketService.disconnect()
    }
  }, [user?.id, token])

  // ✅ Subscribe functions
  const subscribeToPrice = useCallback((assetId: string, callback: (data: any) => void) => {
    return websocketService.subscribeToPrice(assetId, callback)
  }, [])

  const subscribeToOrders = useCallback((userId: string, callback: (data: any) => void) => {
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

// ============================================
// HOOKS
// ============================================
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

// ✅ OPTIMIZED: Throttled price stream dengan threshold
export function usePriceStream(assetId: string | null) {
  const { isConnected } = useWebSocket()
  const [price, setPrice] = useState<number | null>(null)
  const lastPriceRef = useRef<number | null>(null) // ✅ Track last price

  useEffect(() => {
    if (!assetId || !isConnected) return
    
    const unsubscribe = websocketService.subscribeToPrice(assetId, (data) => {
      // ✅ Only update jika perubahan signifikan (> 0.001%)
      if (lastPriceRef.current === null || 
          Math.abs((data.price - lastPriceRef.current) / lastPriceRef.current) > 0.00001) {
        lastPriceRef.current = data.price
        setPrice(data.price)
      }
    })
    
    return () => {
      unsubscribe()
      setPrice(null)
      lastPriceRef.current = null // ✅ Reset on unmount
    }
  }, [assetId, isConnected])

  return price
}