// lib/performance-monitor.ts
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private startTimes: Map<string, number> = new Map()

  start(label: string): void {
    this.startTimes.set(label, performance.now())
  }

  end(label: string): number {
    const startTime = this.startTimes.get(label)
    if (!startTime) {
      console.warn(`No start time found for: ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.startTimes.delete(label)

    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)

    const metrics = this.metrics.get(label)!
    if (metrics.length > 100) {
      metrics.shift()
    }

    return duration
  }

  getAverage(label: string): number {
    const metrics = this.metrics.get(label)
    if (!metrics || metrics.length === 0) return 0

    const sum = metrics.reduce((acc, val) => acc + val, 0)
    return sum / metrics.length
  }

  getStats(label: string): {
    count: number
    average: number
    min: number
    max: number
    last: number
  } | null {
    const metrics = this.metrics.get(label)
    if (!metrics || metrics.length === 0) return null

    return {
      count: metrics.length,
      average: this.getAverage(label),
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      last: metrics[metrics.length - 1]
    }
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    this.metrics.forEach((_, label) => {
      stats[label] = this.getStats(label)
    })

    return stats
  }

  clear(label?: string): void {
    if (label) {
      this.metrics.delete(label)
      this.startTimes.delete(label)
    } else {
      this.metrics.clear()
      this.startTimes.clear()
    }
  }

  logStats(): void {
    console.log('📊 Performance Stats:')
    console.table(this.getAllStats())
  }
}

export const performanceMonitor = new PerformanceMonitor()

if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor
}

export function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.start(label)
  
  return fn().finally(() => {
    const duration = performanceMonitor.end(label)
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`)
    } else if (duration > 500) {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    } else {
      console.log(`✅ ${label}: ${duration.toFixed(2)}ms`)
    }
  })
}

export function logPerformance(label: string, duration: number): void {
  const emoji = duration < 500 ? '✅' : duration < 1000 ? '⏱️' : '⚠️'
  console.log(`${emoji} ${label}: ${duration.toFixed(2)}ms`)
  
  if (duration > 2000) {
    console.warn(`❌ CRITICAL: ${label} is too slow!`)
  }
}