// hooks/useInstantOrders.ts - WITH REAL-TIME SYNC ACROSS DEVICES
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
}

// ✅ Fetch order details from API
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // ✅ Add optimistic order instantly
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

    // Auto-rollback after 30 seconds if not confirmed
    const rollbackTimeout = setTimeout(() => {
      console.warn('⚠️ Optimistic order timeout:', optimisticId)
      rollbackOrder(optimisticId)
    }, 30000)

    rollbackTimeoutsRef.current.set(optimisticId, rollbackTimeout)

    return optimisticId
  }, [])

  // ✅ Confirm order when API responds
  const confirmOrder = useCallback((optimisticId: string, confirmedOrder: BinaryOrder) => {
    // Clear rollback timeout
    const timeout = rollbackTimeoutsRef.current.get(optimisticId)
    if (timeout) {
      clearTimeout(timeout)
      rollbackTimeoutsRef.current.delete(optimisticId)
    }

    // Remove optimistic order
    setOptimisticOrders(prev => {
      const updated = new Map(prev)
      updated.delete(optimisticId)
      return updated
    })

    // Add confirmed order
    setOrders(prev => {
      // Prevent duplicates
      if (orderIdsRef.current.has(confirmedOrder.id)) {
        console.log('⏭️ Order already exists:', confirmedOrder.id)
        return prev
      }
      orderIdsRef.current.add(confirmedOrder.id)
      return [confirmedOrder, ...prev]
    })

    console.log('✅ Order confirmed:', confirmedOrder.id)
  }, [])

  // ✅ Rollback if API fails
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

  // ✅ Add order from external source (WebSocket, polling)
  const addOrder = useCallback((order: BinaryOrder) => {
    setOrders(prev => {
      // Prevent duplicates
      if (orderIdsRef.current.has(order.id)) {
        console.log('⏭️ Order already exists (skipping):', order.id)
        return prev
      }
      
      orderIdsRef.current.add(order.id)
      console.log('➕ New order added:', order.id)
      return [order, ...prev]
    })
  }, [])

  // Update existing orders
  const updateOrder = useCallback((orderId: string, updates: Partial<BinaryOrder>) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ))
    console.log('🔄 Order updated:', orderId)
  }, [])

  // ✅ Replace entire order
  const replaceOrder = useCallback((updatedOrder: BinaryOrder) => {
    setOrders(prev => {
      const index = prev.findIndex(o => o.id === updatedOrder.id)
      if (index === -1) {
        // Order not found, add it
        orderIdsRef.current.add(updatedOrder.id)
        return [updatedOrder, ...prev]
      }
      
      // Replace existing order
      const newOrders = [...prev]
      newOrders[index] = updatedOrder
      return newOrders
    })
    console.log('🔄 Order replaced:', updatedOrder.id)
  }, [])

  // Remove order
  const removeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId))
    orderIdsRef.current.delete(orderId)
    console.log('🗑️ Order removed:', orderId)
  }, [])

  // Set all orders (from API or callback)
  const setAllOrders = useCallback((newOrders: BinaryOrder[] | ((prev: BinaryOrder[]) => BinaryOrder[])) => {
    const ordersToSet = typeof newOrders === 'function' ? newOrders(orders) : newOrders
    
    // Update order IDs ref
    orderIdsRef.current.clear()
    ordersToSet.forEach(order => orderIdsRef.current.add(order.id))
    
    setOrders(ordersToSet)
    console.log('📋 All orders set:', ordersToSet.length)
  }, [orders])

  // ✅ WEBSOCKET SYNC - Handle real-time order events from other devices
  useEffect(() => {
    if (!userId) return

    console.log('📡 Setting up WebSocket order sync for user:', userId)

    const unsubscribe = websocketService.subscribeToOrders(userId, async (data: OrderUpdate) => {
      // Prevent duplicate processing
      const eventKey = `${data.event}-${data.id}-${data.timestamp}`
      if (processedEventsRef.current.has(eventKey)) {
        console.log('⏭️ Skipping duplicate event:', eventKey)
        return
      }
      processedEventsRef.current.add(eventKey)

      // Clean old events (keep last 100)
      if (processedEventsRef.current.size > 100) {
        const entries = Array.from(processedEventsRef.current)
        entries.slice(0, 50).forEach(key => processedEventsRef.current.delete(key))
      }

      console.log('📡 Order sync event:', data.event, data.id)

      switch (data.event) {
        case 'order:created':
          const createdOrder = await fetchOrderDetails(data.id)
          if (createdOrder) {
            addOrder(createdOrder)
          }
          break

        case 'order:updated':
          const updatedOrder = await fetchOrderDetails(data.id)
          if (updatedOrder) {
            replaceOrder(updatedOrder)
          }
          break

        case 'order:settled':
          const settledOrder = await fetchOrderDetails(data.id)
          if (settledOrder) {
            replaceOrder(settledOrder)
          }
          break
      }
    })

    return () => {
      console.log('🧹 Order sync cleanup for user:', userId)
      unsubscribe()
      processedEventsRef.current.clear()
    }
  }, [userId, addOrder, replaceOrder])

  // ✅ POLLING FALLBACK - When WebSocket is not connected
  useEffect(() => {
    if (!userId) return

    // Check WebSocket status
    const wsStatus = websocketService.getConnectionStatus()
    const isConnected = wsStatus.isConnected

    // Only poll if WebSocket is NOT connected
    if (isConnected) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    console.log('⏱️ Order polling started (WebSocket not connected)')

    const pollOrders = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/v1/binary-orders?status=PENDING,WON,LOST&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const polledOrders: BinaryOrder[] = data?.data?.orders || []
          
          // Merge polled orders with existing orders
          setOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id))
            const newOrders = polledOrders.filter(o => !existingIds.has(o.id))
            
            if (newOrders.length > 0) {
              newOrders.forEach(o => orderIdsRef.current.add(o.id))
              console.log('➕ New orders from polling:', newOrders.length)
              return [...newOrders, ...prev]
            }
            
            return prev
          })
        }
      } catch (error) {
        console.error('Order polling error:', error)
      }
    }

    // Initial poll
    pollOrders()

    // Setup interval (5 seconds)
    pollingIntervalRef.current = setInterval(pollOrders, 5000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [userId])

  // Combine optimistic and confirmed orders
  const allOrders = [
    ...Array.from(optimisticOrders.values()) as unknown as BinaryOrder[],
    ...orders
  ]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      rollbackTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      rollbackTimeoutsRef.current.clear()
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

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

// ✅ Aggressive polling for order results
export function useAggressiveResultPolling(
  activeOrders: BinaryOrder[],
  onResult: (order: BinaryOrder) => void
) {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPollRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (activeOrders.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      return
    }

    const pollResults = async () => {
      const now = Date.now()

      for (const order of activeOrders) {
        if (!order.exit_time) continue

        const exitTime = new Date(order.exit_time).getTime()
        const timeUntilExpiry = exitTime - now

        // ✅ Start aggressive polling 5 seconds before expiry
        if (timeUntilExpiry <= 5000 && timeUntilExpiry > -2000) {
          const lastPoll = lastPollRef.current.get(order.id) || 0
          
          // Avoid duplicate polls within 50ms
          if (now - lastPoll < 50) continue

          lastPollRef.current.set(order.id, now)

          try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/v1/binary-orders/${order.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
            })

            if (response.ok) {
              const data = await response.json()
              const updatedOrder = data?.data || data

              if (updatedOrder.status === 'WON' || updatedOrder.status === 'LOST') {
                console.log('🎯 Result detected via polling:', updatedOrder.id, updatedOrder.status)
                onResult(updatedOrder)
                lastPollRef.current.delete(order.id)
              }
            }
          } catch (error) {
            console.error('Polling error:', error)
          }
        }
      }
    }

    // ✅ Poll every 100ms for instant detection
    pollingIntervalRef.current = setInterval(pollResults, 100)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [activeOrders, onResult])
}

// ✅ Instant countdown for active orders
export function useInstantCountdown(orders: BinaryOrder[]) {
  const [timeLeft, setTimeLeft] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    // ✅ Update every 100ms for smooth countdown
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
    }, 100) // ✅ 100ms for instant visual feedback

    return () => clearInterval(interval)
  }, [orders])

  return timeLeft
}