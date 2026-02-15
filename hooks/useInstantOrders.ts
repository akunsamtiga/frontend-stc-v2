// hooks/useInstantOrders.ts - FIXED: Better real-time sync dengan aggressive polling
import { useState, useCallback, useRef, useEffect } from 'react'
import { BinaryOrder } from '@/types'
import { websocketService } from '@/lib/websocket'

interface OptimisticOrder extends Partial<BinaryOrder> {
  id: string
  isOptimistic: true
  optimisticTimestamp: number
}

interface OrderUpdate {
  event: 'order:created' | 'order:settled' | 'order:updated'
  id: string
  status?: string
  exit_price?: number
  profit?: number
  timestamp: number
  priority?: 'high' | 'normal'
}

async function fetchOrderDetails(orderId: string): Promise<BinaryOrder | null> {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    const response = await fetch(`/api/v1/binary-orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data?.data || data
  } catch (error) {
    console.error('Error fetching order details:', error)
    return null
  }
}

export function useOptimisticOrders(userId?: string) {
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [optimisticOrders, setOptimisticOrders] = useState<Map<string, OptimisticOrder>>(new Map())
  const rollbackTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const orderIdsRef = useRef<Set<string>>(new Set())
  const processedEventsRef = useRef<Set<string>>(new Set())
  
  // ✅ FIX: Multiple polling intervals untuk berbagai scenario
  const wsPollingRef = useRef<NodeJS.Timeout | null>(null)      // WebSocket health check
  const activeOrdersPollingRef = useRef<NodeJS.Timeout | null>(null) // Active orders polling
  const allOrdersPollingRef = useRef<NodeJS.Timeout | null>(null)    // All orders polling

  const addOptimisticOrder = useCallback((orderData: Partial<BinaryOrder>) => {
    const optimisticId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const optimisticOrder: OptimisticOrder = {
      id: optimisticId,
      ...orderData,
      status: 'PENDING',
      isOptimistic: true,
      optimisticTimestamp: Date.now(),
      createdAt: new Date().toISOString(),
    } as OptimisticOrder

    setOptimisticOrders(prev => {
      const updated = new Map(prev)
      updated.set(optimisticId, optimisticOrder)
      return updated
    })

    const rollbackTimeout = setTimeout(() => {
      console.warn('⚠️ Optimistic order timeout:', optimisticId)
      rollbackOrder(optimisticId)
    }, 30000)

    rollbackTimeoutsRef.current.set(optimisticId, rollbackTimeout)

    return optimisticId
  }, [])

  const confirmOrder = useCallback((optimisticId: string, confirmedOrder: BinaryOrder) => {
    const timeout = rollbackTimeoutsRef.current.get(optimisticId)
    if (timeout) {
      clearTimeout(timeout)
      rollbackTimeoutsRef.current.delete(optimisticId)
    }

    setOptimisticOrders(prev => {
      const updated = new Map(prev)
      updated.delete(optimisticId)
      return updated
    })

    setOrders(prev => {
      if (orderIdsRef.current.has(confirmedOrder.id)) {
        console.log('⏭️ Order already exists:', confirmedOrder.id)
        return prev
      }
      orderIdsRef.current.add(confirmedOrder.id)
      return [confirmedOrder, ...prev]
    })

    console.log('✅ Order confirmed:', confirmedOrder.id)
  }, [])

  const rollbackOrder = useCallback((optimisticId: string) => {
    const timeout = rollbackTimeoutsRef.current.get(optimisticId)
    if (timeout) {
      clearTimeout(timeout)
      rollbackTimeoutsRef.current.delete(optimisticId)
    }

    setOptimisticOrders(prev => {
      const updated = new Map(prev)
      updated.delete(optimisticId)
      return updated
    })

    console.log('🔄 Order rolled back:', optimisticId)
  }, [])

  const addOrder = useCallback((order: BinaryOrder) => {
    setOrders(prev => {
      if (orderIdsRef.current.has(order.id)) {
        console.log('⏭️ Order already exists (skipping):', order.id)
        return prev
      }
      
      orderIdsRef.current.add(order.id)
      console.log('➕ New order added:', order.id)
      return [order, ...prev]
    })
  }, [])

  const updateOrder = useCallback((orderId: string, updates: Partial<BinaryOrder>) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ))
    console.log('🔄 Order updated:', orderId)
  }, [])

  const replaceOrder = useCallback((updatedOrder: BinaryOrder) => {
    setOrders(prev => {
      const index = prev.findIndex(o => o.id === updatedOrder.id)
      if (index === -1) {
        orderIdsRef.current.add(updatedOrder.id)
        return [updatedOrder, ...prev]
      }
      
      const newOrders = [...prev]
      newOrders[index] = updatedOrder
      return newOrders
    })
    console.log('🔄 Order replaced:', updatedOrder.id)
  }, [])

  const removeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId))
    orderIdsRef.current.delete(orderId)
    console.log('🗑️ Order removed:', orderId)
  }, [])

  const setAllOrders = useCallback((newOrders: BinaryOrder[] | ((prev: BinaryOrder[]) => BinaryOrder[])) => {
    const ordersToSet = typeof newOrders === 'function' ? newOrders(orders) : newOrders
    
    orderIdsRef.current.clear()
    ordersToSet.forEach(order => orderIdsRef.current.add(order.id))
    
    setOrders(ordersToSet)
    console.log('📋 All orders set:', ordersToSet.length)
  }, [orders])

  // ✅ FIX: WebSocket Sync dengan better error handling
  useEffect(() => {
    if (!userId) return

    console.log('📡 Setting up WebSocket order sync for user:', userId)

    const unsubscribe = websocketService.subscribeToOrders(userId, async (data: OrderUpdate) => {
      const eventKey = `${data.event}-${data.id}-${data.timestamp}`
      if (processedEventsRef.current.has(eventKey)) {
        console.log('⏭️ Skipping duplicate event:', eventKey)
        return
      }
      processedEventsRef.current.add(eventKey)

      // Clean old events
      if (processedEventsRef.current.size > 100) {
        const entries = Array.from(processedEventsRef.current)
        entries.slice(0, 50).forEach(key => processedEventsRef.current.delete(key))
      }

      console.log('📡 Order sync event:', data.event, data.id)

      switch (data.event) {
        case 'order:created':
          const createdOrder = await fetchOrderDetails(data.id)
          if (createdOrder) addOrder(createdOrder)
          break

        case 'order:updated':
          const updatedOrder = await fetchOrderDetails(data.id)
          if (updatedOrder) replaceOrder(updatedOrder)
          break

        case 'order:settled':
          const settledOrder = await fetchOrderDetails(data.id)
          if (settledOrder) replaceOrder(settledOrder)
          break
      }
    })

    return () => {
      console.log('🧹 Order sync cleanup for user:', userId)
      unsubscribe()
      processedEventsRef.current.clear()
    }
  }, [userId, addOrder, replaceOrder])

  // ✅ FIX: Aggressive Polling untuk Active Orders (setiap 2 detik)
  useEffect(() => {
    if (!userId) return

    const pollActiveOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        // ✅ Poll active orders lebih frequent
        const response = await fetch('/api/v1/binary-orders?status=ACTIVE,PENDING&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) return

        const data = await response.json()
        const activeOrders: BinaryOrder[] = data?.data?.orders || []

        // Merge dengan existing orders
        setOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id))
          const newOrders = activeOrders.filter(o => !existingIds.has(o.id))
          
          if (newOrders.length > 0) {
            newOrders.forEach(o => orderIdsRef.current.add(o.id))
            console.log('➕ New active orders from polling:', newOrders.length)
            return [...newOrders, ...prev]
          }

          // Update existing active orders jika ada perubahan
          let hasChanges = false
          const updatedOrders = prev.map(order => {
            const freshOrder = activeOrders.find(o => o.id === order.id)
            if (freshOrder && (
              freshOrder.status !== order.status ||
              freshOrder.exit_price !== order.exit_price ||
              freshOrder.profit !== order.profit
            )) {
              hasChanges = true
              return freshOrder
            }
            return order
          })

          return hasChanges ? updatedOrders : prev
        })

      } catch (error) {
        console.error('Active orders polling error:', error)
      }
    }

    // Poll active orders setiap 2 detik
    activeOrdersPollingRef.current = setInterval(pollActiveOrders, 2000)
    pollActiveOrders() // Initial poll

    return () => {
      if (activeOrdersPollingRef.current) {
        clearInterval(activeOrdersPollingRef.current)
      }
    }
  }, [userId])

  // ✅ FIX: Polling untuk All Orders (setiap 10 detik, untuk catch up)
  useEffect(() => {
    if (!userId) return

    const pollAllOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/v1/binary-orders?status=PENDING,ACTIVE,WON,LOST&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) return

        const data = await response.json()
        const polledOrders: BinaryOrder[] = data?.data?.orders || []

        setOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id))
          const newOrders = polledOrders.filter(o => !existingIds.has(o.id))
          
          if (newOrders.length > 0) {
            newOrders.forEach(o => orderIdsRef.current.add(o.id))
            console.log('➕ New orders from full poll:', newOrders.length)
            return [...newOrders, ...prev]
          }
          return prev
        })

      } catch (error) {
        console.error('All orders polling error:', error)
      }
    }

    // Poll all orders setiap 10 detik
    allOrdersPollingRef.current = setInterval(pollAllOrders, 10000)

    return () => {
      if (allOrdersPollingRef.current) {
        clearInterval(allOrdersPollingRef.current)
      }
    }
  }, [userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      rollbackTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      rollbackTimeoutsRef.current.clear()
      if (wsPollingRef.current) clearInterval(wsPollingRef.current)
      if (activeOrdersPollingRef.current) clearInterval(activeOrdersPollingRef.current)
      if (allOrdersPollingRef.current) clearInterval(allOrdersPollingRef.current)
    }
  }, [])

  const allOrders = [
    ...Array.from(optimisticOrders.values()) as unknown as BinaryOrder[],
    ...orders
  ]

  return {
    orders: allOrders,
    confirmedOrders: orders,
    optimisticOrders: Array.from(optimisticOrders.values()),
    addOptimisticOrder,
    confirmOrder,
    rollbackOrder,
    addOrder,
    updateOrder,
    replaceOrder,
    removeOrder,
    setAllOrders,
  }
}

// ✅ FIX: Enhanced aggressive polling untuk order results
export function useAggressiveResultPolling(
  activeOrders: BinaryOrder[],
  onResult: (order: BinaryOrder) => void
) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPollRef = useRef<Map<string, number>>(new Map())
  const isPollingRef = useRef<boolean>(false) // Prevent concurrent polling

  useEffect(() => {
    if (activeOrders.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      isPollingRef.current = false
      return
    }

    const pollResults = async () => {
      // ✅ Prevent concurrent polling
      if (isPollingRef.current) return
      isPollingRef.current = true

      const now = Date.now()

      try {
        const token = localStorage.getItem('token')
        if (!token) {
          isPollingRef.current = false
          return
        }

        // Batch fetch untuk semua active orders yang mendekati expiry
        const ordersToCheck = activeOrders.filter(order => {
          if (!order.exit_time) return false
          
          const exitTime = new Date(order.exit_time).getTime()
          const timeUntilExpiry = exitTime - now
          
          // Poll jika dalam window 10 detik sebelum expiry sampai 5 detik setelah
          return timeUntilExpiry <= 10000 && timeUntilExpiry > -5000
        })

        if (ordersToCheck.length === 0) {
          isPollingRef.current = false
          return
        }

        // Batch request untuk efficiency
        const response = await fetch('/api/v1/binary-orders?status=ACTIVE,PENDING,WON,LOST&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          isPollingRef.current = false
          return
        }

        const data = await response.json()
        const allOrders: BinaryOrder[] = data?.data?.orders || []

        // Check untuk orders yang sudah settled
        for (const order of ordersToCheck) {
          const updatedOrder = allOrders.find(o => o.id === order.id)
          
          if (updatedOrder && (updatedOrder.status === 'WON' || updatedOrder.status === 'LOST')) {
            const lastPoll = lastPollRef.current.get(order.id) || 0
            
            // Avoid duplicate notifications
            if (now - lastPoll >= 1000) {
              lastPollRef.current.set(order.id, now)
              console.log('🎯 Result detected via polling:', updatedOrder.id, updatedOrder.status)
              onResult(updatedOrder)
            }
          }
        }

      } catch (error) {
        console.error('Polling error:', error)
      } finally {
        isPollingRef.current = false
      }
    }

    // ✅ Poll setiap 500ms untuk orders yang mendekati expiry
    pollingIntervalRef.current = setInterval(pollResults, 500)
    pollResults() // Initial poll

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [activeOrders, onResult])
}

export function useInstantCountdown(orders: BinaryOrder[]) {
  const [timeLeft, setTimeLeft] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = new Map<string, number>()

      orders.forEach(order => {
        if (!order.exit_time) return

        const now = Date.now()
        const exitTime = new Date(order.exit_time).getTime()
        const remaining = Math.max(0, Math.floor((exitTime - now) / 1000))
        
        newTimeLeft.set(order.id, remaining)
      })

      setTimeLeft(newTimeLeft)
    }, 100)

    return () => clearInterval(interval)
  }, [orders])

  return timeLeft
}