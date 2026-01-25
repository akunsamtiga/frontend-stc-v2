// hooks/useInstantOrders.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { BinaryOrder } from '@/types'

interface OptimisticOrder extends Partial<BinaryOrder> {
  id: string
  isOptimistic: true
  optimisticTimestamp: number
}

export function useOptimisticOrders() {
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [optimisticOrders, setOptimisticOrders] = useState<Map<string, OptimisticOrder>>(new Map())
  const rollbackTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

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
      if (prev.some(o => o.id === confirmedOrder.id)) {
        return prev
      }
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

  // Update existing orders
  const updateOrder = useCallback((orderId: string, updates: Partial<BinaryOrder>) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ))
  }, [])

  // Remove order
  const removeOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId))
  }, [])

  // Set all orders (from API)
  const setAllOrders = useCallback((newOrders: BinaryOrder[]) => {
    setOrders(newOrders)
  }, [])

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
    }
  }, [])

  return {
    orders: allOrders,
    confirmedOrders: orders,
    optimisticOrders: Array.from(optimisticOrders.values()),
    addOptimisticOrder,
    confirmOrder,
    rollbackOrder,
    updateOrder,
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