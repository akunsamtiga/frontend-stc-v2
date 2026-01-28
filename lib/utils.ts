import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export class TimezoneUtil {
  static readonly TIMEZONE = 'Asia/Jakarta'
  static readonly OFFSET_HOURS = 7

  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000)
  }

  static formatDateTime(date: Date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  static toISOString(date: Date = new Date()): string {
    return date.toISOString()
  }

  static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000)
  }

  static toTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000)
  }

  static getDateTimeInfo(date: Date = new Date()) {
    return {
      datetime: this.formatDateTime(date),
      datetime_iso: this.toISOString(date),
      timestamp: this.toTimestamp(date),
      timezone: this.TIMEZONE
    }
  }

  static formatWIBTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: this.TIMEZONE
    })
  }

  static formatWIBDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: this.TIMEZONE
    })
  }
}

export function formatDuration(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${durationMinutes}m`
  } else {
    const hours = Math.floor(durationMinutes / 60)
    const mins = durationMinutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
}

export function getDurationDisplay(minutes: number): string {
  const DISPLAY_MAP: Record<number, string> = {
    1: '1m',
    2: '2m',
    3: '3m',
    4: '4m',
    5: '5m',
    10: '10m',
    15: '15m',
    30: '30m',
    45: '45m',
    60: '1h',
  }
  
  return DISPLAY_MAP[minutes] || formatDuration(minutes)
}

export function parseDuration(display: string): number {
  const match = display.match(/^(\d+)(m|h)$/)
  if (!match) return 0
  
  const [, value, unit] = match
  const numValue = parseInt(value)
  
  switch (unit) {
    case 'm':
      return numValue
    case 'h':
      return numValue * 60
    default:
      return 0
  }
}

export function getDurationLabel(durationMinutes: number): string {
  if (durationMinutes < 60) {
    return `${durationMinutes} minute${durationMinutes > 1 ? 's' : ''}`
  } else {
    const hours = Math.floor(durationMinutes / 60)
    const mins = durationMinutes % 60
    if (mins > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
}

export function calculateTimeLeft(exitTime: string | Date): string {
  const now = new Date()
  const exit = new Date(exitTime)
  const diff = exit.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  
  return `${seconds}s`
}

export function calculateTimeLeftSeconds(exitTime: string | Date): number {
  const now = new Date()
  const exit = new Date(exitTime)
  const diff = exit.getTime() - now.getTime()
  
  return Math.max(0, Math.floor(diff / 1000))
}

export function calculateTimeLeftShort(exitTime: string | Date): string {
  const seconds = calculateTimeLeftSeconds(exitTime)
  
  if (seconds === 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

export function getDuration(startTime: string | Date, endTime: string | Date): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diff = end.getTime() - start.getTime()

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  
  return `${seconds}s`
}

const currencyCache = new Map<number, string>()
const MAX_CACHE_SIZE = 1000

export function formatCurrency(amount: number, compact = false): string {
  // ✅ FIXED: Validate amount to prevent NaN display
  const validAmount = Number(amount)
  if (!isFinite(validAmount) || isNaN(validAmount)) {
    return 'Rp0'
  }
  
  const cacheKey = compact ? `${validAmount}-compact` : validAmount
  
  if (currencyCache.has(cacheKey as any)) {
    return currencyCache.get(cacheKey as any)!
  }
  
  let formatted: string
  
  if (compact && Math.abs(validAmount) >= 1000000) {
    formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(validAmount)
  } else {
    formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount)
  }
  
  if (currencyCache.size < MAX_CACHE_SIZE) {
    currencyCache.set(cacheKey as any, formatted)
  }
  
  return formatted
}

export function formatNumber(value: number, decimals = 3): string {
  return value.toFixed(decimals)
}

export function formatPrice(price: number, decimals?: number): string {
  if (decimals === undefined) {
    if (price >= 1000) {
      decimals = 2
    } else if (price >= 1) {
      decimals = 6
    } else {
      decimals = 8
    }
  }
  
  return price.toFixed(decimals)
}

export function formatPriceAuto(price: number, assetType?: string): string {
  if (assetType === 'crypto') {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(8)
    return price.toFixed(10)
  }
  
  if (price >= 1000) return price.toFixed(2)
  if (price >= 1) return price.toFixed(6)
  return price.toFixed(8)
}

export function formatPercentage(value: number, decimals: number = 2, includeSign: boolean = false): string {
  const formatted = `${(value * 100).toFixed(decimals)}%`
  return includeSign && value > 0 ? `+${formatted}` : formatted
}

export function formatCompactNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

const dateCache = new Map<string, string>()

export function formatDate(date: string | Date, formatStr = 'MMM dd, yyyy HH:mm:ss'): string {
  const key = typeof date === 'string' ? `${date}-${formatStr}` : `${date.toISOString()}-${formatStr}`
  
  if (dateCache.has(key)) {
    return dateCache.get(key)!
  }
  
  const formatted = format(new Date(date), formatStr)
  
  if (dateCache.size < MAX_CACHE_SIZE) {
    dateCache.set(key, formatted)
  }
  
  return formatted
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm:ss')
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateLong(date: string | Date): string {
  return format(new Date(date), 'MMMM dd, yyyy HH:mm')
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = new Date(date)
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'HH:mm')}`
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'HH:mm')}`
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

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

export function getPriceChangeClass(change: number): string {
  if (change > 0) return 'text-green-400'
  if (change < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-blue-400'
    case 'WON':
      return 'text-green-400'
    case 'LOST':
      return 'text-red-400'
    case 'PENDING':
      return 'text-yellow-400'
    case 'EXPIRED':
      return 'text-gray-400'
    case 'CANCELLED':
      return 'text-orange-400'
    default:
      return 'text-gray-400'
  }
}

export function getOrderStatusBg(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'WON':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'LOST':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'PENDING':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'EXPIRED':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    case 'CANCELLED':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function getAccountTypeColor(accountType: 'real' | 'demo'): string {
  return accountType === 'real' ? 'text-green-400' : 'text-blue-400'
}

export function getAccountTypeBg(accountType: 'real' | 'demo'): string {
  return accountType === 'real' 
    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0
  return ((newValue - oldValue) / oldValue) * 100
}

export function calculateProfit(amount: number, profitRate: number): number {
  return (amount * profitRate) / 100
}

export function calculatePayout(amount: number, profitRate: number): number {
  return amount + calculateProfit(amount, profitRate)
}

export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function isValidAmount(amount: number, min: number = 0, max?: number): boolean {
  if (!isValidNumber(amount)) return false
  if (amount <= min) return false
  if (max !== undefined && amount > max) return false
  return true
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

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

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    return defaultValue
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error)
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error)
  }
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

export function playSound(soundPath: string, volume: number = 0.3): void {
  if (typeof window === 'undefined') return
  
  try {
    const audio = new Audio(soundPath)
    audio.volume = volume
    audio.play().catch(e => console.log('Audio play failed:', e))
  } catch (error) {
    console.error('Failed to play sound:', error)
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return roundTo(Math.random() * (max - min) + min, decimals)
}

export const DURATIONS = [
  1, 2, 3, 4, 5, 
  10, 15, 30, 45, 60
] as const

export const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000] as const
export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const

export function clearAllCaches(): void {
  currencyCache.clear()
  dateCache.clear()
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    if (currencyCache.size > MAX_CACHE_SIZE * 0.8) {
      currencyCache.clear()
    }
    if (dateCache.size > MAX_CACHE_SIZE * 0.8) {
      dateCache.clear()
    }
  }, 300000)
}

if (typeof window !== 'undefined') {
  (window as any).utils = {
    clearAllCaches,
    getCacheStats: () => ({
      currency: currencyCache.size,
      date: dateCache.size
    })
  }
}