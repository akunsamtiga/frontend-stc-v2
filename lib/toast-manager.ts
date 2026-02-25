// lib/toast-manager.ts 
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
  private readonly DEDUP_WINDOW = 5000
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


    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())


    this.connectionState.isOnline = navigator.onLine
  }

  private handleOnline() {
    const wasOffline = !this.connectionState.isOnline
    this.connectionState.isOnline = true
    this.connectionState.lastOnlineTime = Date.now()
    this.connectionState.wasOffline = wasOffline


    if (this.offlineToastId) {
      toast.dismiss(this.offlineToastId)
      this.offlineToastId = null
    }


    if (wasOffline) {
      if (this.reconnectToastId) {
        toast.dismiss(this.reconnectToastId)
      }
      this.reconnectToastId = toast.success('Koneksi terhubung kembali', {
        description: 'Memuat ulang data...',
        duration: 3000,
      })


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


    if (this.reconnectToastId) {
      toast.dismiss(this.reconnectToastId)
      this.reconnectToastId = null
    }


    if (!this.offlineToastId) {
      this.offlineToastId = toast.error('Koneksi terputus', {
        description: 'Menunggu koneksi internet...',
        duration: Infinity,
      })
    }


    this.connectionCallbacks.forEach(callback => {
      try {
        callback(false)
      } catch (e) {
        console.error('Connection callback error:', e)
      }
    })
  }


  showError(message: string, options?: { description?: string; duration?: number }): void {
    const now = Date.now()
    const key = this.getToastKey(message, options?.description)


    const existing = this.recentToasts.get(key)
    if (existing && (now - existing.timestamp) < this.DEDUP_WINDOW) {
      console.log(`🚫 Duplicate toast blocked: ${message}`)
      return
    }


    if (!this.connectionState.isOnline && this.isConnectionError(message)) {
      console.log(`🚫 Connection error suppressed (offline): ${message}`)
      return
    }


    const toastId = toast.error(message, {
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


  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }


  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }


  isOnline(): boolean {
    return this.connectionState.isOnline
  }


  shouldAutoRefresh(): boolean {
    const shouldRefresh = this.connectionState.wasOffline && this.connectionState.isOnline
    if (shouldRefresh) {

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


  clear() {
    this.recentToasts.clear()
  }
}

export const toastManager = new ToastManager()

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