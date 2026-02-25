// hooks/useBatchNotification.ts 
import { useState, useCallback, useRef, useEffect } from 'react'
import { BinaryOrder } from '@/types'

interface BatchConfig {
  batchWindowMs: number
  maxBatchSize: number
}

const DEFAULT_CONFIG: BatchConfig = {
  batchWindowMs: 500,
  maxBatchSize: 10,
}

export function useBatchNotification(config: Partial<BatchConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const [currentBatch, setCurrentBatch] = useState<BinaryOrder[]>([])
  const [shouldShow, setShouldShow] = useState(false)

  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingOrdersRef = useRef<BinaryOrder[]>([])


  const shownOrdersRef = useRef<Map<string, number>>(new Map())
  const DUPLICATE_WINDOW = 5000


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


  const addToBatch = useCallback((order: BinaryOrder) => {

    if (isDuplicate(order.id)) {
      return
    }


    if (pendingOrdersRef.current.some(o => o.id === order.id)) {
      console.log(`⚠️ Order already in pending batch: ${order.id}`)
      return
    }

    console.log(`📥 Adding to batch: ${order.id} (${order.status})`)


    pendingOrdersRef.current.push(order)


    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }


    batchTimeoutRef.current = setTimeout(() => {
      flushBatch()
    }, finalConfig.batchWindowMs)


    if (pendingOrdersRef.current.length >= finalConfig.maxBatchSize) {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
      flushBatch()
    }
  }, [finalConfig.batchWindowMs, finalConfig.maxBatchSize, isDuplicate])


  const flushBatch = useCallback(() => {
    if (pendingOrdersRef.current.length === 0) {
      console.log('⚠️ Flush called but no pending orders')
      return
    }

    const orders = [...pendingOrdersRef.current]
    const now = Date.now()


    orders.forEach(order => {
      shownOrdersRef.current.set(order.id, now)
    })

    console.log(`📦 Flushing batch: ${orders.length} orders`, orders.map(o => `${o.id}-${o.status}`))


    setCurrentBatch(orders)
    setShouldShow(true)


    pendingOrdersRef.current = []
  }, [])


  const closeBatch = useCallback(() => {
    console.log('🔒 Closing batch notification')
    setShouldShow(false)


    setTimeout(() => {
      setCurrentBatch([])
    }, 1000)
  }, [])


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

export function useSmartNotification(config?: Partial<BatchConfig>) {
  const batch = useBatchNotification(config)

  const notify = useCallback((orders: BinaryOrder | BinaryOrder[]) => {
    const orderArray = Array.isArray(orders) ? orders : [orders]

    orderArray.forEach(order => {

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

export function useOrderResultNotification() {
  const notification = useSmartNotification({
    batchWindowMs: 500,
    maxBatchSize: 20,
  })

  return notification
}