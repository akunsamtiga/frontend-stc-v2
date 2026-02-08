// lib/toast-manager.ts - Toast Deduplication & Connection Manager
import { toast } from 'sonner'

interface ToastEntry {
  message: string
  timestamp: number
  toastId: string | number
}

interface ConnectionState {
  isOnline: boolean
  lastOnlineTime: number
  wasOffline: boolean
}

type ConnectionCallback = (isOnline: boolean) => void

class ToastManager {
  private recentToasts: Map<string, ToastEntry> = new Map()
  private readonly DEDUP_WINDOW = 5000 // 5 seconds
  private connectionState: ConnectionState = {
    isOnline: true,
    lastOnlineTime: Date.now(),
    wasOffline: false,
  }
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private offlineToastId: string | number | null = null
  private reconnectToastId: string | number | null = null
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())

    // Initial state
    this.connectionState.isOnline = navigator.onLine
  }

  private handleOnline() {
    const wasOffline = !this.connectionState.isOnline
    this.connectionState.isOnline = true
    this.connectionState.lastOnlineTime = Date.now()
    this.connectionState.wasOffline = wasOffline

    // Dismiss offline toast if exists
    if (this.offlineToastId) {
      toast.dismiss(this.offlineToastId)
      this.offlineToastId = null
    }

    // Show reconnected toast only if we were offline
    if (wasOffline) {
      if (this.reconnectToastId) {
        toast.dismiss(this.reconnectToastId)
      }
      this.reconnectToastId = toast.success('Koneksi terhubung kembali', {
        description: 'Memuat ulang data...',
        duration: 3000,
      })

      // Notify all listeners
      this.connectionCallbacks.forEach(callback => {
        try {
          callback(true)
        } catch (e) {
          console.error('Connection callback error:', e)
        }
      })
    }
  }

  private handleOffline() {
    this.connectionState.isOnline = false
    this.connectionState.wasOffline = true

    // Dismiss reconnect toast if exists
    if (this.reconnectToastId) {
      toast.dismiss(this.reconnectToastId)
      this.reconnectToastId = null
    }

    // Show offline toast (only one)
    if (!this.offlineToastId) {
      this.offlineToastId = toast.error('Koneksi terputus', {
        description: 'Menunggu koneksi internet...',
        duration: Infinity, // Keep until dismissed
      })
    }

    // Notify all listeners
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(false)
      } catch (e) {
        console.error('Connection callback error:', e)
      }
    })
  }

  /**
   * Show error toast with deduplication
   */
  showError(message: string, options?: { description?: string; duration?: number }): void {
    const now = Date.now()
    const key = this.getToastKey(message, options?.description)

    // Check for recent duplicate
    const existing = this.recentToasts.get(key)
    if (existing && (now - existing.timestamp) < this.DEDUP_WINDOW) {
      console.log(`🚫 Duplicate toast blocked: ${message}`)
      return
    }

    // Don't show connection errors if we're offline (offline toast already shown)
    if (!this.connectionState.isOnline && this.isConnectionError(message)) {
      console.log(`🚫 Connection error suppressed (offline): ${message}`)
      return
    }

    // Show toast
    const toastId = toast.error(message, {
      ...options,
      duration: options?.duration || 5000,
    })

    // Track it
    this.recentToasts.set(key, {
      message,
      timestamp: now,
      toastId,
    })

    // Clean up old entries periodically
    this.cleanupOldEntries()
  }

  /**
   * Show success toast with deduplication
   */
  showSuccess(message: string, options?: { description?: string; duration?: number }): void {
    const now = Date.now()
    const key = this.getToastKey(message, options?.description)

    const existing = this.recentToasts.get(key)
    if (existing && (now - existing.timestamp) < this.DEDUP_WINDOW) {
      console.log(`🚫 Duplicate toast blocked: ${message}`)
      return
    }

    const toastId = toast.success(message, {
      ...options,
      duration: options?.duration || 5000,
    })

    this.recentToasts.set(key, {
      message,
      timestamp: now,
      toastId,
    })

    this.cleanupOldEntries()
  }

  /**
   * Show info toast with deduplication
   */
  showInfo(message: string, options?: { description?: string; duration?: number }): void {
    const now = Date.now()
    const key = this.getToastKey(message, options?.description)

    const existing = this.recentToasts.get(key)
    if (existing && (now - existing.timestamp) < this.DEDUP_WINDOW) {
      return
    }

    const toastId = toast.info(message, {
      ...options,
      duration: options?.duration || 5000,
    })

    this.recentToasts.set(key, {
      message,
      timestamp: now,
      toastId,
    })

    this.cleanupOldEntries()
  }

  /**
   * Show warning toast with deduplication
   */
  showWarning(message: string, options?: { description?: string; duration?: number }): void {
    const now = Date.now()
    const key = this.getToastKey(message, options?.description)

    const existing = this.recentToasts.get(key)
    if (existing && (now - existing.timestamp) < this.DEDUP_WINDOW) {
      return
    }

    const toastId = toast.warning(message, {
      ...options,
      duration: options?.duration || 5000,
    })

    this.recentToasts.set(key, {
      message,
      timestamp: now,
      toastId,
    })

    this.cleanupOldEntries()
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.connectionState.isOnline
  }

  /**
   * Check if we were offline and just came back online
   */
  shouldAutoRefresh(): boolean {
    const shouldRefresh = this.connectionState.wasOffline && this.connectionState.isOnline
    if (shouldRefresh) {
      // Reset the flag
      this.connectionState.wasOffline = false
    }
    return shouldRefresh
  }

  private getToastKey(message: string, description?: string): string {
    return `${message}-${description || ''}`
  }

  private isConnectionError(message: string): boolean {
    const connectionErrors = [
      'network error',
      'connection',
      'internet',
      'timeout',
      'failed to fetch',
      'network',
      'offline',
      'ECONNABORTED',
      'ERR_NETWORK',
    ]
    return connectionErrors.some(err => 
      message.toLowerCase().includes(err.toLowerCase())
    )
  }

  private cleanupOldEntries() {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.recentToasts.forEach((entry, key) => {
      if (now - entry.timestamp > this.DEDUP_WINDOW) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.recentToasts.delete(key))
  }

  /**
   * Clear all tracked toasts
   */
  clear() {
    this.recentToasts.clear()
  }
}

// Singleton instance
export const toastManager = new ToastManager()

// Convenience exports
export const showError = (message: string, options?: { description?: string; duration?: number }) => 
  toastManager.showError(message, options)

export const showSuccess = (message: string, options?: { description?: string; duration?: number }) => 
  toastManager.showSuccess(message, options)

export const showInfo = (message: string, options?: { description?: string; duration?: number }) => 
  toastManager.showInfo(message, options)

export const showWarning = (message: string, options?: { description?: string; duration?: number }) => 
  toastManager.showWarning(message, options)

export const onConnectionChange = (callback: ConnectionCallback) => 
  toastManager.onConnectionChange(callback)

export const isOnline = () => toastManager.isOnline()

export const shouldAutoRefresh = () => toastManager.shouldAutoRefresh()

export const getConnectionState = () => toastManager.getConnectionState()