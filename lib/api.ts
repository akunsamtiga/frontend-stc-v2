// lib/api.ts - ULTRA OPTIMIZED VERSION
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

interface CacheEntry {
  data: any
  timestamp: number
  expiresIn: number
}

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class ApiClient {
  private client: AxiosInstance
  private cache: Map<string, CacheEntry>
  private pendingRequests: Map<string, PendingRequest>
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }

  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
    
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.startCacheCleanup()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        if (!config.headers['X-Request-ID']) {
          config.headers['X-Request-ID'] = this.generateRequestId(config)
        }
        
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError<any>) => {
        const config = error.config as AxiosRequestConfig & { _retry?: number }
        
        if (!config) return Promise.reject(error)
        
        const shouldRetry = this.shouldRetry(error, config)
        
        if (shouldRetry) {
          config._retry = (config._retry || 0) + 1
          const delay = this.getRetryDelay(config._retry)
          await this.sleep(delay)
          return this.client.request(config)
        }
        
        const message = 
          error.response?.data?.error || 
          error.response?.data?.message ||
          error.message || 
          'An error occurred'
        
        if (!config.headers?.['X-Silent-Error']) {
          toast.error(message)
        }
        
        return Promise.reject(error)
      }
    )
  }

  private shouldRetry(error: AxiosError, config: AxiosRequestConfig & { _retry?: number }): boolean {
    const retryCount = config._retry || 0
    
    if (retryCount >= this.retryConfig.maxRetries) {
      return false
    }
    
    if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '') && 
        !config.headers?.['X-Idempotent']) {
      return false
    }
    
    if (!error.response) {
      return true
    }
    
    return this.retryConfig.retryableStatuses.includes(error.response.status)
  }

  private getRetryDelay(retryCount: number): number {
    return this.retryConfig.retryDelay * Math.pow(2, retryCount - 1)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private generateRequestId(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase()
    const url = config.url
    const params = JSON.stringify(config.params || {})
    return `${method}-${url}-${params}`
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  // ===================================
  // OPTIMIZED CACHING
  // ===================================

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}-${JSON.stringify(params || {})}`
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  private setCache(key: string, data: any, expiresIn: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    })
  }

  private invalidateCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  private startCacheCleanup() {
    if (typeof window === 'undefined') return
    
    setInterval(() => {
      const now = Date.now()
      const entries = Array.from(this.cache.entries())
      
      entries.forEach(([key, entry]) => {
        if (now - entry.timestamp > entry.expiresIn) {
          this.cache.delete(key)
        }
      })
    }, 60000)
  }

  private async withDeduplication<T>(
    key: string, 
    request: () => Promise<T>
  ): Promise<T> {
    const pending = this.pendingRequests.get(key)
    
    if (pending) {
      return pending.promise as Promise<T>
    }
    
    const promise = request()
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })
    
    try {
      const result = await promise
      return result
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  // ===================================
  // AUTH
  // ===================================

  async login(email: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth/login', { email, password })
  }

  async register(email: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth/register', { email, password })
  }

  // ===================================
  // USER
  // ===================================

  async getProfile(): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey('/user/profile')
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/user/profile')
      this.setCache(cacheKey, data, 30000)
      return data
    })
  }

  // ===================================
  // BALANCE - OPTIMIZED
  // ===================================

  async getBothBalances(): Promise<ApiResponse> {
    // Very short cache for balances
    const cacheKey = this.getCacheKey('/balance/both')
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/balance/both')
      this.setCache(cacheKey, data, 1000) // 1s cache only
      return data
    })
  }

  async getAccountBalance(accountType: 'real' | 'demo'): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey(`/balance/${accountType}`)
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/balance/${accountType}`)
      this.setCache(cacheKey, data, 1000)
      return data
    })
  }

  async getBalanceHistory(
    page = 1, 
    limit = 20, 
    accountType?: 'real' | 'demo'
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (accountType) {
      params.append('accountType', accountType)
    }
    
    const cacheKey = this.getCacheKey('/balance', { page, limit, accountType })
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/balance?${params}`)
      this.setCache(cacheKey, data, 5000)
      return data
    })
  }

  async createBalanceEntry(data: { 
    accountType: 'real' | 'demo'
    type: 'deposit' | 'withdrawal'
    amount: number
    description?: string 
  }): Promise<ApiResponse> {
    const result = await this.client.post('/balance', data)
    
    // Clear all balance caches immediately
    this.invalidateCache('/balance')
    
    return result
  }

  // ===================================
  // LEGACY
  // ===================================
  async getCurrentBalance(): Promise<ApiResponse> {
    return this.getBothBalances()
  }

  // ===================================
  // ASSETS
  // ===================================

  async getAssets(activeOnly = false): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey('/assets', { activeOnly })
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/assets?activeOnly=${activeOnly}`)
      this.setCache(cacheKey, data, 60000) // 1 min cache
      return data
    })
  }

  async getAssetById(id: string): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey(`/assets/${id}`)
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/assets/${id}`)
      this.setCache(cacheKey, data, 60000)
      return data
    })
  }

  async getCurrentPrice(assetId: string): Promise<ApiResponse> {
    // No cache for real-time prices
    return this.client.get(`/assets/${assetId}/price`)
  }

  async createAsset(data: any): Promise<ApiResponse> {
    const result = await this.client.post('/assets', data)
    this.invalidateCache('/assets')
    return result
  }

  async updateAsset(id: string, data: any): Promise<ApiResponse> {
    const result = await this.client.put(`/assets/${id}`, data)
    this.invalidateCache('/assets')
    return result
  }

  async deleteAsset(id: string): Promise<ApiResponse> {
    const result = await this.client.delete(`/assets/${id}`)
    this.invalidateCache('/assets')
    return result
  }

  // ===================================
  // BINARY ORDERS - CRITICAL OPTIMIZATIONS
  // ===================================

  async createOrder(data: {
    accountType: 'real' | 'demo'
    asset_id: string
    direction: 'CALL' | 'PUT'
    amount: number
    duration: number
  }): Promise<ApiResponse> {
    const result = await this.client.post('/binary-orders', data)
    
    // Immediately invalidate caches
    this.invalidateCache('/binary-orders')
    this.invalidateCache('/balance')
    
    return result
  }

  async getOrders(
    status?: string, 
    page = 1, 
    limit = 20,
    accountType?: 'real' | 'demo'
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (status) params.append('status', status)
    if (accountType) params.append('accountType', accountType)
    
    // NO CACHE for orders - always fresh
    return this.client.get(`/binary-orders?${params}`)
  }

  async getOrderById(id: string): Promise<ApiResponse> {
    // No cache for individual orders
    return this.client.get(`/binary-orders/${id}`)
  }

  // ===================================
  // ADMIN ENDPOINTS
  // ===================================

  async getAllUsers(page = 1, limit = 50): Promise<ApiResponse> {
    return this.client.get(`/admin/users?page=${page}&limit=${limit}`)
  }

  async getAllUsersWithBalance(): Promise<ApiResponse> {
    return this.client.get('/admin/users/with-balance')
  }

  async getAdminUserById(id: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${id}`)
  }

  async createUser(data: { 
    email: string
    password: string
    role: string 
  }): Promise<ApiResponse> {
    return this.client.post('/admin/users', data)
  }

  async updateUser(id: string, data: any): Promise<ApiResponse> {
    return this.client.put(`/admin/users/${id}`, data)
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.client.delete(`/admin/users/${id}`)
  }

  async manageUserBalance(userId: string, data: {
    accountType: 'real' | 'demo'
    type: 'deposit' | 'withdrawal'
    amount: number
    description: string
  }): Promise<ApiResponse> {
    return this.client.post(`/admin/users/${userId}/balance`, data)
  }

  async getUserBalance(userId: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${userId}/balance`)
  }

  async getUserHistory(userId: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${userId}/history`)
  }

  async getUserTradingStats(userId: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${userId}/trading-stats`)
  }

  async getSystemStatistics(): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey('/admin/statistics')
    const cached = this.getFromCache(cacheKey)
    
    if (cached) return cached
    
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/admin/statistics')
      this.setCache(cacheKey, data, 5000) // 5s cache
      return data
    })
  }

  clearCache(pattern?: string) {
    this.invalidateCache(pattern)
  }
}

export const api = new ApiClient()