// lib/utils.ts - FIXED VERSION (No ESM import)
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

// ===================================
// CORE UTILITIES
// ===================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===================================
// FORMATTING WITH CACHING
// ===================================

// Cache for formatted currencies
const currencyCache = new Map<number, string>()
const MAX_CACHE_SIZE = 1000

export function formatCurrency(amount: number): string {
  // Check cache
  if (currencyCache.has(amount)) {
    return currencyCache.get(amount)!
  }
  
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  
  // Store in cache
  if (currencyCache.size < MAX_CACHE_SIZE) {
    currencyCache.set(amount, formatted)
  } else {
    // Clear cache if too large
    currencyCache.clear()
    currencyCache.set(amount, formatted)
  }
  
  return formatted
}

export function formatNumber(value: number, decimals = 3): string {
  return value.toFixed(decimals)
}

// Cache for formatted dates
const dateCache = new Map<string, string>()

export function formatDate(date: string | Date): string {
  const key = typeof date === 'string' ? date : date.toISOString()
  
  if (dateCache.has(key)) {
    return dateCache.get(key)!
  }
  
  const formatted = format(new Date(date), 'MMM dd, yyyy HH:mm:ss')
  
  if (dateCache.size < MAX_CACHE_SIZE) {
    dateCache.set(key, formatted)
  }
  
  return formatted
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm:ss')
}

// ===================================
// PERFORMANCE UTILITIES
// ===================================

/**
 * Debounce function - delays execution until after wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function - limits execution to once per wait time
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = func(...args)
    
    if (cache.size < MAX_CACHE_SIZE) {
      cache.set(key, result)
    }
    
    return result
  }) as T
}

/**
 * Request animation frame throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  
  return (...args: Parameters<T>) => {
    if (rafId) return
    
    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

// ===================================
// TIME CALCULATIONS
// ===================================

export function calculateTimeLeft(exitTime: string): string {
  const now = new Date()
  const exit = new Date(exitTime)
  const diff = exit.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  
  return `${seconds}s`
}

// ===================================
// STYLE HELPERS
// ===================================

export function getPriceChangeClass(change: number): string {
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-danger'
  return 'text-gray-400'
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-blue-400'
    case 'WON':
      return 'text-success'
    case 'LOST':
      return 'text-danger'
    default:
      return 'text-gray-400'
  }
}

// ===================================
// ARRAY UTILITIES
// ===================================

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

// ===================================
// NUMBER UTILITIES
// ===================================

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round to decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// ===================================
// VALIDATION
// ===================================

/**
 * Check if value is valid number
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// ===================================
// LOCAL STORAGE HELPERS
// ===================================

/**
 * Safe localStorage getter
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Safe localStorage setter
 */
export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error)
  }
}

/**
 * Safe localStorage remover
 */
export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error)
  }
}

// ===================================
// CONSTANTS
// ===================================

export const DURATIONS = [1, 2, 3, 4, 5, 15, 30, 45, 60] as const

export const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000] as const

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const

// ===================================
// CLEANUP
// ===================================

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  currencyCache.clear()
  dateCache.clear()
  console.log('🗑️ All utility caches cleared')
}

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (currencyCache.size > MAX_CACHE_SIZE * 0.8) {
      currencyCache.clear()
    }
    if (dateCache.size > MAX_CACHE_SIZE * 0.8) {
      dateCache.clear()
    }
  }, 300000) // 5 minutes
}