// hooks/useBatchNotification.ts - FIXED: Better duplicate detection
import { useState, useCallback, useRef, useEffect } from 'react'
import { BinaryOrder } from '@/types'

interface BatchConfig {
  batchWindowMs: number
  maxBatchSize: number
}

const DEFAULT_CONFIG: BatchConfig = {
  batchWindowMs: 0, // ⚡ INSTANT - no batching delay
  maxBatchSize: 10,
}

export function useBatchNotification(config: Partial<BatchConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [currentBatch, setCurrentBatch] = useState<BinaryOrder[]>([])
  const [shouldShow, setShouldShow] = useState(false)
  
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingOrdersRef = useRef<BinaryOrder[]>([])
  
  // ✅ FIXED: Track shown orders with timestamp to prevent duplicates
  const shownOrdersRef = useRef<Map<string, number>>(new Map())
  const DUPLICATE_WINDOW = 5000 // 5 seconds

  // ✅ FIXED: Clean up old entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const entriesToDelete: string[] = []
      
      shownOrdersRef.current.forEach((timestamp, orderId) => {
        if (now - timestamp > DUPLICATE_WINDOW) {
          entriesToDelete.push(orderId)
        }
      })
      
      entriesToDelete.forEach(id => shownOrdersRef.current.delete(id))
      
      if (entriesToDelete.length > 0) {
        console.log(`🧹 Cleaned ${entriesToDelete.length} old notification entries`)
      }
    }, 1000)

    return () => clearInterval(cleanupInterval)
  }, [])

  // ✅ FIXED: Better duplicate detection
  const isDuplicate = useCallback((orderId: string): boolean => {
    const lastShown = shownOrdersRef.current.get(orderId)
    if (!lastShown) return false
    
    const timeSinceShown = Date.now() - lastShown
    if (timeSinceShown < DUPLICATE_WINDOW) {
      console.log(`⚠️ Duplicate notification blocked: ${orderId} (shown ${timeSinceShown}ms ago)`)
      return true
    }
    
    return false
  }, [])

  // Add order to batch
  const addToBatch = useCallback((order: BinaryOrder) => {
    // ✅ FIXED: Skip if duplicate
    if (isDuplicate(order.id)) {
      return
    }

    // ✅ FIXED: Skip if already in pending batch
    if (pendingOrdersRef.current.some(o => o.id === order.id)) {
      console.log(`⚠️ Order already in pending batch: ${order.id}`)
      return
    }

    console.log(`📥 Adding to batch: ${order.id} (${order.status})`)

    // Add to pending
    pendingOrdersRef.current.push(order)

    // ⚡ INSTANT: Flush immediately on next frame for instant feedback
    if (finalConfig.batchWindowMs === 0) {
      requestAnimationFrame(() => {
        flushBatch()
      })
      return
    }

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }

    // Set new timeout to flush batch
    batchTimeoutRef.current = setTimeout(() => {
      flushBatch()
    }, finalConfig.batchWindowMs)

    // If batch is full, flush immediately
    if (pendingOrdersRef.current.length >= finalConfig.maxBatchSize) {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
      flushBatch()
    }
  }, [finalConfig.batchWindowMs, finalConfig.maxBatchSize, isDuplicate])

  // Flush pending orders to visible batch
  const flushBatch = useCallback(() => {
    if (pendingOrdersRef.current.length === 0) {
      console.log('⚠️ Flush called but no pending orders')
      return
    }

    const orders = [...pendingOrdersRef.current]
    const now = Date.now()
    
    // ✅ FIXED: Mark all as shown with timestamp
    orders.forEach(order => {
      shownOrdersRef.current.set(order.id, now)
    })

    console.log(`📦 Flushing batch: ${orders.length} orders`, orders.map(o => `${o.id}-${o.status}`))

    // Show batch
    setCurrentBatch(orders)
    setShouldShow(true)

    // Clear pending
    pendingOrdersRef.current = []
  }, [])

  // Close notification
  const closeBatch = useCallback(() => {
    console.log('🔒 Closing batch notification')
    setShouldShow(false)
    
    // Clear batch after animation
    setTimeout(() => {
      setCurrentBatch([])
    }, 1000)
  }, [])

  // Force flush on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
    }
  }, [])

  return {
    currentBatch,
    shouldShow,
    addToBatch,
    closeBatch,
    pendingCount: pendingOrdersRef.current.length,
  }
}

/**
 * Smart notification manager - decides when to show single vs batch
 */
export function useSmartNotification(config?: Partial<BatchConfig>) {
  const batch = useBatchNotification(config)

  const notify = useCallback((orders: BinaryOrder | BinaryOrder[]) => {
    const orderArray = Array.isArray(orders) ? orders : [orders]
    
    orderArray.forEach(order => {
      // ✅ FIXED: Only notify settled orders
      if (order.status === 'WON' || order.status === 'LOST') {
        batch.addToBatch(order)
      } else {
        console.log(`⚠️ Skipping non-settled order: ${order.id} (${order.status})`)
      }
    })
  }, [batch])

  return {
    ...batch,
    notify,
  }
}

/**
 * Hook for instant order result notifications with batching
 */
export function useOrderResultNotification() {
  const notification = useSmartNotification({
    batchWindowMs: 500,
    maxBatchSize: 20,
  })

  return notification
}