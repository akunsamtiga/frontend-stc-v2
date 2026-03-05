// lib/api.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { toast } from 'sonner'
import type {
  AffiliatorDashboard,
  AffiliatorInvitesDetailedResponse,
  AffiliatorInvitesSummary,   // kept for legacy compat
  CommissionDetails,
  CommissionWithdrawalHistory,
  RequestCommissionWithdrawalDto,
  AdminAffiliatorsResponse,
  AdminCommissionWithdrawalsResponse,
  AssignAffiliatorDto,
  UpdateAffiliatorConfigDto,
  ApproveCommissionWithdrawalDto,
} from '@/types'
import type {
  CreateAssetRequest,
  UpdateAssetRequest,
  CryptoSchedulerStatus,
  ApiResponse,
  User,
  UserProfile,
  UpdateProfileRequest,
  Asset,
  BinaryOrder,
  Balance,
  BalanceSummary,
  TradingStats,
  SystemStatistics,
  CreateBalanceEntryRequest,
  CreateOrderRequest,
  WithdrawalRequest,
  WithdrawalSummary,
  PendingVerifications,
  VerifyDocumentRequest,
  CreateVoucherRequest,
  Voucher,
  VoucherStatistics,
  ValidateVoucherResponse,
  VoucherUsage,
  AssetSchedule,
  CreateAssetScheduleRequest,
  UpdateAssetScheduleRequest,
  GetAssetSchedulesQuery,
  AssetSchedulePagination,
  AssetScheduleStatistics,
  Information,
  CreateInformationRequest,
  UpdateInformationRequest,
  GetInformationQuery,
  InformationPagination
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

interface CacheEntry {
  data: any
  timestamp: number
  expiresIn: number
}

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private maxConcurrent = 6

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent)
      await Promise.allSettled(batch.map(fn => fn()))
    }

    this.processing = false
  }
}

class ApiClient {
  private client: AxiosInstance
  private cache: Map<string, CacheEntry>
  private pendingRequests: Map<string, PendingRequest>
  private requestQueue: RequestQueue
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    timeoutRetries: 2
  }
  private consecutiveErrors = 0
  private maxConsecutiveErrors = 5
  private isOnline = true

  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
    this.requestQueue = new RequestQueue()

    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false,
    })

    this.setupInterceptors()
    this.startCacheCleanup()
    this.setupOnlineStatusMonitor()
  }

  private setupOnlineStatusMonitor() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.consecutiveErrors = 0
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
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
      (error) => {
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => {
        const serverTime = response.headers['x-server-timestamp'];
        if (serverTime) {
          response.data._serverTimestamp = parseInt(serverTime);
        }
        this.consecutiveErrors = 0;
        return response.data;
      },
      async (error: AxiosError<any>) => {
        const config = error.config as AxiosRequestConfig & { _retry?: number; _timeoutRetry?: number }

        if (!config) {
          return Promise.reject(error)
        }

        if (!error.response && error.code === 'ECONNABORTED') {
          config._timeoutRetry = (config._timeoutRetry || 0) + 1

          if (config._timeoutRetry <= this.retryConfig.timeoutRetries) {
            await this.sleep(this.retryConfig.retryDelay)
            return this.client.request(config)
          }
        }

        this.consecutiveErrors++

        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
          toast.error('Connection issues detected. Please check your internet connection.')
        }

        const shouldRetry = this.shouldRetry(error, config)

        if (shouldRetry) {
          config._retry = (config._retry || 0) + 1
          const delay = this.getRetryDelay(config._retry)

          await this.sleep(delay)
          return this.client.request(config)
        }

        const message = this.getErrorMessage(error)

        if (!config.headers?.['X-Silent-Error']) {
          toast.error(message)
        }

        return Promise.reject(error)
      }
    )
  }

  private getErrorMessage(error: AxiosError<any>): string {
    if (!error.response) {
      if (!this.isOnline) {
        return 'No internet connection'
      }
      return 'Network error. Please check your connection.'
    }

    const status = error.response.status
    const data = error.response.data

    if (data?.error) return data.error
    if (data?.message) return data.message

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.'
      case 401:
        return 'Session expired. Please login again.'
      case 403:
        return 'Access denied.'
      case 404:
        return 'Resource not found.'
      case 409:
        return 'Conflict. This action cannot be completed.'
      case 422:
        return 'Validation error. Please check your input.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
        return 'Server error. Please try again later.'
      case 502:
        return 'Bad gateway. Server is temporarily unavailable.'
      case 503:
        return 'Service unavailable. Please try again later.'
      case 504:
        return 'Gateway timeout. Server is taking too long to respond.'
      default:
        return error.message || 'An error occurred'
    }
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

    if (error.response.status >= 400 && error.response.status < 500) {
      return false
    }

    return this.retryConfig.retryableStatuses.includes(error.response.status)
  }

  private getRetryDelay(retryCount: number): number {
    return this.retryConfig.retryDelay * Math.pow(1.5, retryCount - 1)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private generateRequestId(config: AxiosRequestConfig): string {
    const method = config.method?.toUpperCase()
    const url = config.url
    const params = JSON.stringify(config.params || {})
    return `${method}-${url}-${params}-${Date.now()}`
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
    if (this.client?.defaults?.headers?.common) {
      delete this.client.defaults.headers.common['Authorization']
    }
  }

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

    const promise = this.requestQueue.add(request)

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

  async login(email: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth/login', { email, password })
  }

  async googleSignIn(idToken: string, referralCode?: string, affiliateCode?: string): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/auth/google', { idToken, referralCode, affiliateCode })
      return response
    } catch (error: any) {
      throw error
    }
  }

  async register(email: string, password: string, referralCode?: string, affiliateCode?: string): Promise<ApiResponse> {
    return this.client.post('/auth/register', { email, password, referralCode, affiliateCode })
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return this.client.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
  }

  async resendVerificationEmail(): Promise<ApiResponse> {
    return this.client.post('/auth/resend-verification')
  }

  async completeTutorial(): Promise<ApiResponse> {
    try {
      const result = await this.client.post('/user/complete-tutorial')
      this.invalidateCache('/user/profile')
      return result
    } catch (error) {
      throw error
    }
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const cacheKey = this.getCacheKey('/user/profile')

    try {
      return this.withDeduplication(cacheKey, async () => {
        const data = await this.client.get('/user/profile')

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid profile response')
        }

        return data
      })
    } catch (error) {
      throw error
    }
  }

  async requestWithdrawal(data: {
    amount: number
    description?: string
  }): Promise<ApiResponse> {
    try {
      const result = await this.client.post('/balance/withdrawal/request', data, {
        headers: {
          'X-Idempotent': 'true'
        }
      })

      this.invalidateCache('/balance')
      this.invalidateCache('/user/profile')

      return result
    } catch (error) {
      throw error
    }
  }

  async getMyWithdrawalRequests(): Promise<ApiResponse<{
    requests: WithdrawalRequest[]
    summary: WithdrawalSummary
  }>> {
    const cacheKey = this.getCacheKey('/balance/withdrawal/my-requests')
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/balance/withdrawal/my-requests')
      this.setCache(cacheKey, data, 5000)
      return data
    })
  }

  async cancelWithdrawalRequest(requestId: string): Promise<ApiResponse> {
    try {
      const result = await this.client.delete(`/balance/withdrawal/cancel/${requestId}`)

      this.invalidateCache('/balance/withdrawal')
      this.invalidateCache('/balance')

      return result
    } catch (error) {
      throw error
    }
  }

  async getAllWithdrawalRequests(status?: string): Promise<ApiResponse<{
    requests: WithdrawalRequest[]
    summary: WithdrawalSummary
  }>> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)

    const cacheKey = this.getCacheKey('/admin/withdrawals', { status })
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/admin/withdrawals?${params}`)
      this.setCache(cacheKey, data, 3000)
      return data
    })
  }

  async getWithdrawalRequestById(requestId: string): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey(`/admin/withdrawals/${requestId}`)
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/admin/withdrawals/${requestId}`)
      this.setCache(cacheKey, data, 5000)
      return data
    })
  }

  async approveWithdrawal(
    requestId: string,
    data: {
      approve: boolean
      adminNotes?: string
      rejectionReason?: string
    }
  ): Promise<ApiResponse> {
    try {
      if (!data.approve && !data.rejectionReason) {
        throw new Error('Rejection reason is required when rejecting withdrawal')
      }

      const result = await this.client.post(`/admin/withdrawals/${requestId}/approve`, data)

      this.invalidateCache('/admin/withdrawals')
      this.invalidateCache('/balance')
      this.invalidateCache('/admin/statistics')

      return result
    } catch (error) {
      throw error
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse> {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid profile data')
      }

      const result = await this.client.put('/user/profile', data, {
        headers: {
          'X-Silent-Error': 'false'
        }
      })

      this.invalidateCache('/user/profile')

      return result
    } catch (error) {
      throw error
    }
  }

  async uploadAvatar(data: { url: string; fileSize?: number; mimeType?: string }): Promise<ApiResponse> {
    try {
      if (!data?.url) {
        throw new Error('Avatar URL is required')
      }

      if (!data.url.startsWith('data:image/')) {
        throw new Error('Invalid image format')
      }

      const result = await this.client.post('/user/avatar', data, {
        timeout: 30000,
        headers: {
          'X-Silent-Error': 'false'
        }
      })

      this.invalidateCache('/user/profile')

      return result
    } catch (error) {
      throw error
    }
  }

  async uploadKTP(data: {
    photoFront: { url: string; fileSize?: number; mimeType?: string }
    photoBack?: { url: string; fileSize?: number; mimeType?: string }
  }): Promise<ApiResponse> {
    try {
      if (!data?.photoFront?.url) {
        throw new Error('Front photo is required')
      }

      if (!data.photoFront.url.startsWith('data:image/')) {
        throw new Error('Invalid front photo format')
      }

      if (data.photoBack?.url && !data.photoBack.url.startsWith('data:image/')) {
        throw new Error('Invalid back photo format')
      }

      const result = await this.client.post('/user/ktp', data, {
        timeout: 30000,
        headers: {
          'X-Silent-Error': 'false'
        }
      })

      this.invalidateCache('/user/profile')

      return result
    } catch (error: any) {
      throw error
    }
  }

  async uploadSelfie(data: { url: string; fileSize?: number; mimeType?: string }): Promise<ApiResponse> {
    try {
      if (!data?.url) {
        throw new Error('Selfie is required')
      }

      if (!data.url.startsWith('data:image/')) {
        throw new Error('Invalid selfie format')
      }

      const result = await this.client.post('/user/selfie', data, {
        timeout: 30000,
        headers: {
          'X-Silent-Error': 'false'
        }
      })

      this.invalidateCache('/user/profile')

      return result
    } catch (error) {
      throw error
    }
  }

  async changePassword(data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }): Promise<ApiResponse> {
    try {
      if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
        throw new Error('All password fields are required')
      }

      if (data.newPassword !== data.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (data.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      const result = await this.client.post('/user/change-password', data, {
        headers: {
          'X-Silent-Error': 'false'
        }
      })

      return result
    } catch (error) {
      throw error
    }
  }


  async verifyPhone(data: { idToken: string }): Promise<ApiResponse> {
    try {
      if (!data.idToken) {
        throw new Error('Firebase ID token is required')
      }

      const result = await this.client.post('/user/verify-phone', data, {
        headers: {
          'X-Silent-Error': 'false'
        }
      })

      this.invalidateCache('/user/profile')

      return result
    } catch (error) {
      throw error
    }
  }

  async uploadAssetIcon(assetId: string, iconUrl: string): Promise<ApiResponse> {
    try {
      const result = await this.client.post(`/assets/${assetId}/icon`, { iconUrl })
      this.invalidateCache('/assets')
      return result
    } catch (error) {
      throw error
    }
  }

  async getBothBalances(): Promise<ApiResponse<BalanceSummary>> {
    const cacheKey = this.getCacheKey('/balance/both')
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/balance/both')
      this.setCache(cacheKey, data, 1000)
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

  async createBalanceEntry(data: CreateBalanceEntryRequest): Promise<ApiResponse> {
    const result = await this.client.post('/balance', data)
    this.invalidateCache('/balance')
    this.invalidateCache('/user/profile')
    return result
  }

  async getBalanceSummary(): Promise<ApiResponse> {
    return this.client.get('/balance/summary')
  }

  async getAssets(activeOnly = false): Promise<ApiResponse<{ assets: Asset[]; total: number }>> {
    const cacheKey = this.getCacheKey('/assets', { activeOnly })
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/assets?activeOnly=${activeOnly}`)
      this.setCache(cacheKey, data, 120000)
      return data
    })
  }

  async getAssetById(id: string): Promise<ApiResponse<Asset>> {
    const cacheKey = this.getCacheKey(`/assets/${id}`)
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/assets/${id}`)
      this.setCache(cacheKey, data, 120000)
      return data
    })
  }

  async getCurrentPrice(assetId: string): Promise<ApiResponse<{ price: number; timestamp: number }>> {
    const cacheKey = this.getCacheKey(`/assets/${assetId}/price`)
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/assets/${assetId}/price`)
      this.setCache(cacheKey, data, 1000)
      return data
    })
  }

  async createAsset(data: CreateAssetRequest): Promise<ApiResponse> {
    const result = await this.client.post('/assets', data)
    this.invalidateCache('/assets')
    return result
  }

  async updateAsset(id: string, data: UpdateAssetRequest): Promise<ApiResponse> {
    const result = await this.client.put(`/assets/${id}`, data)
    this.invalidateCache('/assets')
    return result
  }

  async deleteAsset(id: string): Promise<ApiResponse> {
    const result = await this.client.delete(`/assets/${id}`)
    this.invalidateCache('/assets')
    return result
  }

  async getAssetSettings(id: string): Promise<ApiResponse> {
    return this.client.get(`/assets/${id}/settings`)
  }

  async getCryptoSchedulerStatus(): Promise<ApiResponse<CryptoSchedulerStatus>> {
    const cacheKey = this.getCacheKey('/assets/crypto/scheduler/status')
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/assets/crypto/scheduler/status')
      this.setCache(cacheKey, data, 5000)
      return data
    })
  }

  async triggerCryptoUpdate(): Promise<ApiResponse> {
    const result = await this.client.post('/assets/crypto/scheduler/trigger')
    this.invalidateCache('/assets/crypto')
    return result
  }

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse> {
    const result = await this.client.post('/binary-orders', data, {
      headers: {
        'X-Idempotent': 'true'
      }
    })

    this.invalidateCache('/binary-orders')
    this.invalidateCache('/balance')
    this.invalidateCache('/user/profile')

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

    const cacheKey = this.getCacheKey('/binary-orders', { status, page, limit, accountType })
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/binary-orders?${params}`)
      this.setCache(cacheKey, data, 1000)
      return data
    })
  }

  async getOrderById(id: string): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey(`/binary-orders/${id}`)
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/binary-orders/${id}`)
      this.setCache(cacheKey, data, 2000)
      return data
    })
  }

  async getAllUsers(page = 1, limit = 50, withBalance = false): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    if (withBalance) {
      params.append('withBalance', 'true')
    }

    return this.client.get(`/admin/users?${params}`)
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
    role: 'user' | 'admin' | 'super_admin'
  }): Promise<ApiResponse> {
    return this.client.post('/admin/users', data)
  }

  async updateUser(id: string, data: {
    role?: 'user' | 'admin' | 'super_admin'
    isActive?: boolean
  }): Promise<ApiResponse> {
    return this.client.put(`/admin/users/${id}`, data)
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.client.delete(`/admin/users/${id}`)
  }

  async getUserBalance(userId: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${userId}/balance`)
  }

  async manageUserBalance(userId: string, data: {
    accountType: 'real' | 'demo'
    type: 'deposit' | 'withdrawal'
    amount: number
    description: string
  }): Promise<ApiResponse> {
    return this.client.post(`/admin/users/${userId}/balance`, data)
  }

  async getUserHistory(userId: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${userId}/history`)
  }

  async getUserTradingStats(userId: string): Promise<ApiResponse> {
    return this.client.get(`/admin/users/${userId}/trading-stats`)
  }

  async getSystemStatistics(): Promise<ApiResponse<SystemStatistics>> {
    const cacheKey = this.getCacheKey('/admin/statistics')
    const cached = this.getFromCache(cacheKey)

    if (cached) {
      const age = Date.now() - (cached as any).timestamp
      if (age < 3000) {
        return cached
      }
    }

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/admin/statistics')
      this.setCache(cacheKey, data, 3000)
      return data
    })
  }

  async getPendingVerifications(): Promise<ApiResponse<PendingVerifications>> {
    const cacheKey = this.getCacheKey('/admin/verifications/pending')
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/admin/verifications/pending')
      this.setCache(cacheKey, data, 30000)
      return data
    })
  }

  async verifyKTP(userId: string, data: VerifyDocumentRequest): Promise<ApiResponse> {
    try {
      const result = await this.client.post(`/admin/verifications/${userId}/ktp`, data)

      this.invalidateCache('/admin/verifications')
      this.invalidateCache('/admin/users')

      return result
    } catch (error) {
      throw error
    }
  }

  async verifySelfie(userId: string, data: VerifyDocumentRequest): Promise<ApiResponse> {
    try {
      const result = await this.client.post(`/admin/verifications/${userId}/selfie`, data)

      this.invalidateCache('/admin/verifications')
      this.invalidateCache('/admin/users')

      return result
    } catch (error) {
      throw error
    }
  }

  async createMidtransDeposit(data: {
    amount: number
    description?: string
    voucherCode?: string
  }): Promise<ApiResponse> {
    try {
      const result = await this.client.post('/payment/deposit', {
        amount: data.amount,
        description: data.description || 'Top up balance',
        voucherCode: data.voucherCode
      }, {
        headers: {
          'X-Idempotent': 'true'
        }
      })

      this.invalidateCache('/balance')
      this.invalidateCache('/user/profile')
      this.invalidateCache('/vouchers/my/history')

      return result
    } catch (error) {
      throw error
    }
  }

  async getDepositHistory(): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey('/payment/deposits')
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/payment/deposits')
      this.setCache(cacheKey, data, 5000)
      return data
    })
  }

async checkMidtransDepositStatus(orderId: string): Promise<ApiResponse<{
  deposit: {
    orderId: string
    status: 'pending' | 'success' | 'failed' | 'expired'
    amount: number
    voucherCode?: string
    voucherBonus?: number
    paymentType?: string
    transactionTime?: string
    settlementTime?: string
  }
}>> {
  const cacheKey = this.getCacheKey(`/payment/deposit/${orderId}/status`)


  return this.withDeduplication(cacheKey, async () => {
    const data = await this.client.get(`/payment/deposit/${orderId}/status`)
    return data
  })
}

  async createVoucher(data: CreateVoucherRequest): Promise<ApiResponse> {
    try {
      const result = await this.client.post('/vouchers', data)
      this.invalidateCache('/vouchers')
      toast.success('Voucher created successfully')
      return result
    } catch (error) {
      throw error
    }
  }

  async getAllVouchers(options?: {
    isActive?: boolean
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ vouchers: Voucher[]; pagination: any }>> {
    const params = new URLSearchParams()
    if (options?.isActive !== undefined) params.append('isActive', String(options.isActive))
    if (options?.page) params.append('page', String(options.page))
    if (options?.limit) params.append('limit', String(options.limit))

    const cacheKey = this.getCacheKey('/vouchers', options)
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/vouchers?${params}`)
      this.setCache(cacheKey, data, 30000)
      return data
    })
  }

  async getVoucherById(voucherId: string): Promise<ApiResponse<Voucher>> {
    return this.client.get(`/vouchers/${voucherId}`)
  }

  async getVoucherStatistics(voucherId: string): Promise<ApiResponse<VoucherStatistics>> {
    return this.client.get(`/vouchers/${voucherId}/statistics`)
  }

  async updateVoucher(voucherId: string, data: Partial<CreateVoucherRequest>): Promise<ApiResponse> {
    try {
      const result = await this.client.put(`/vouchers/${voucherId}`, data)
      this.invalidateCache('/vouchers')
      toast.success('Voucher updated successfully')
      return result
    } catch (error) {
      throw error
    }
  }

  async deleteVoucher(voucherId: string): Promise<ApiResponse> {
    try {
      const result = await this.client.delete(`/vouchers/${voucherId}`)
      this.invalidateCache('/vouchers')
      toast.success('Voucher deleted successfully')
      return result
    } catch (error) {
      throw error
    }
  }

  async validateVoucher(code: string, depositAmount: number): Promise<ApiResponse<ValidateVoucherResponse>> {
    return this.client.post('/vouchers/validate', {
      code,
      depositAmount
    })
  }

  async createAssetSchedule(data: CreateAssetScheduleRequest): Promise<ApiResponse<AssetSchedule>> {
  try {
    const result = await this.client.post('/asset-schedule', data)
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async getAssetSchedules(query?: GetAssetSchedulesQuery): Promise<ApiResponse<{
  data: AssetSchedule[]
  pagination: AssetSchedulePagination
}>> {
  const params = new URLSearchParams()

  if (query?.page) params.append('page', query.page.toString())
  if (query?.limit) params.append('limit', query.limit.toString())
  if (query?.assetSymbol) params.append('assetSymbol', query.assetSymbol)
  if (query?.trend) params.append('trend', query.trend)
  if (query?.timeframe) params.append('timeframe', query.timeframe)



  if (query?.status && query.status !== 'all') {
    params.append('status', query.status)
  }

  if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString())
  if (query?.scheduledFrom) params.append('scheduledFrom', query.scheduledFrom)
  if (query?.scheduledTo) params.append('scheduledTo', query.scheduledTo)
  if (query?.sortBy) params.append('sortBy', query.sortBy)
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder)

  const cacheKey = this.getCacheKey('/asset-schedule', query)
  const cached = this.getFromCache(cacheKey)

  if (cached) return cached

  return this.withDeduplication(cacheKey, async () => {
    const data = await this.client.get(`/asset-schedule?${params}`)
    this.setCache(cacheKey, data, 5000)
    return data
  })
}

async getAssetScheduleById(id: string): Promise<ApiResponse<AssetSchedule>> {
  const cacheKey = this.getCacheKey(`/asset-schedule/${id}`)
  const cached = this.getFromCache(cacheKey)

  if (cached) return cached

  return this.withDeduplication(cacheKey, async () => {
    const data = await this.client.get(`/asset-schedule/${id}`)
    this.setCache(cacheKey, data, 10000)
    return data
  })
}

async getUpcomingAssetSchedules(): Promise<ApiResponse<AssetSchedule[]>> {
  const cacheKey = this.getCacheKey('/asset-schedule/upcoming/next-24h')
  const cached = this.getFromCache(cacheKey)

  if (cached) return cached

  return this.withDeduplication(cacheKey, async () => {
    const data = await this.client.get('/asset-schedule/upcoming/next-24h')
    this.setCache(cacheKey, data, 5000)
    return data
  })
}

async getAssetSchedulesByAsset(assetSymbol: string): Promise<ApiResponse<AssetSchedule[]>> {
  const cacheKey = this.getCacheKey(`/asset-schedule/by-asset/${assetSymbol}`)
  const cached = this.getFromCache(cacheKey)

  if (cached) return cached

  return this.withDeduplication(cacheKey, async () => {
    const data = await this.client.get(`/asset-schedule/by-asset/${assetSymbol}`)
    this.setCache(cacheKey, data, 5000)
    return data
  })
}

async getAssetScheduleStatistics(): Promise<ApiResponse<AssetScheduleStatistics>> {

  const cacheKey = this.getCacheKey('/asset-schedule/stats/overview')
  const cached = this.getFromCache(cacheKey)

  if (cached) return cached

  return this.withDeduplication(cacheKey, async () => {

    const data = await this.client.get('/asset-schedule/stats/overview')
    this.setCache(cacheKey, data, 10000)
    return data
  })
}

async updateAssetSchedule(
  id: string,
  data: UpdateAssetScheduleRequest
): Promise<ApiResponse<AssetSchedule>> {
  try {
    const result = await this.client.put(`/asset-schedule/${id}`, data)
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async cancelAssetSchedule(id: string): Promise<ApiResponse> {
  try {
    const result = await this.client.delete(`/asset-schedule/${id}/cancel`)
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async deleteAssetSchedule(id: string): Promise<ApiResponse> {
  try {
    const result = await this.client.delete(`/asset-schedule/${id}`)
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async executeAssetScheduleNow(id: string): Promise<ApiResponse> {
  try {
    const result = await this.client.post(`/asset-schedule/${id}/execute`, {})
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async toggleAssetScheduleStatus(
  id: string,
  isActive: boolean
): Promise<ApiResponse<AssetSchedule>> {
  try {
    const result = await this.client.patch(`/asset-schedule/${id}/status`, { isActive })
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async bulkCancelAssetSchedules(ids: string[]): Promise<ApiResponse> {
  try {
    const result = await this.client.post('/asset-schedule/bulk/cancel', { ids })
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async bulkDeleteAssetSchedules(ids: string[]): Promise<ApiResponse> {
  try {
    const result = await this.client.post('/asset-schedule/bulk/delete', { ids })
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

async getAllInformation(query?: GetInformationQuery): Promise<InformationPagination> {
  try {
    const params = new URLSearchParams()

    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString())
    if (query?.isPinned !== undefined) params.append('isPinned', query.isPinned.toString())
    if (query?.type) params.append('type', query.type)
    if (query?.priority) params.append('priority', query.priority)
    if (query?.search) params.append('search', query.search)
    if (query?.sortBy) params.append('sortBy', query.sortBy)
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `/admin/information?${queryString}` : '/admin/information'

    const response: ApiResponse<Information[]> = await this.client.get(url)

    console.log('📊 API getAllInformation raw response:', response)


    let items: Information[] = []
    let total = 0
    let page = 1
    let limit = 20
    let totalPages = 0


    if (Array.isArray(response.data)) {
      items = response.data
      total = items.length
      totalPages = 1
    }

    else if (response.data && typeof response.data === 'object') {
      const data = response.data as any


      if (Array.isArray(data.items)) {
        items = data.items
        total = data.total || items.length
        page = data.page || 1
        limit = data.limit || 20
        totalPages = data.totalPages || Math.ceil(total / limit)
      } else if (Array.isArray(data.data)) {
        items = data.data
        total = data.total || items.length
        page = data.page || 1
        limit = data.limit || 20
        totalPages = data.totalPages || Math.ceil(total / limit)
      } else if (Array.isArray(data.information)) {
        items = data.information
        total = data.total || items.length
        page = data.page || 1
        limit = data.limit || 20
        totalPages = data.totalPages || Math.ceil(total / limit)
      }

      else if (data.id) {
        items = [data]
        total = 1
        totalPages = 1
      }
    }

    console.log('📊 Parsed information:', { items: items.length, total, page, totalPages })

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    }
  } catch (error) {
    console.error('❌ getAllInformation API error:', error)
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    }
  }
}

async getInformationById(id: string): Promise<Information> {
  try {
    const response: ApiResponse<Information> = await this.client.get(`/admin/information/${id}`)
    return response.data!
  } catch (error) {
    throw error
  }
}

async createInformation(data: CreateInformationRequest): Promise<Information> {
  try {
    const response: ApiResponse<Information> = await this.client.post('/admin/information', data)

    if (response.success) {
      toast.success('Informasi berhasil dibuat')
    }

    return response.data!
  } catch (error) {
    throw error
  }
}

async updateInformation(id: string, data: UpdateInformationRequest): Promise<Information> {
  try {
    const response: ApiResponse<Information> = await this.client.put(`/admin/information/${id}`, data)

    if (response.success) {
      toast.success('Informasi berhasil diperbarui')
    }

    return response.data!
  } catch (error) {
    throw error
  }
}

async deleteInformation(id: string): Promise<void> {
  try {
    const response: ApiResponse<void> = await this.client.delete(`/admin/information/${id}`)

    if (response.success) {
      toast.success('Informasi berhasil dihapus')
    }
  } catch (error) {
    throw error
  }
}

async toggleInformationStatus(id: string): Promise<Information> {
  try {
    const response: ApiResponse<Information> = await this.client.patch(`/admin/information/${id}/toggle-active`)

    if (response.success) {
      const status = response.data?.isActive ? 'diaktifkan' : 'dinonaktifkan'
      toast.success(`Informasi berhasil ${status}`)
    }

    return response.data!
  } catch (error) {
    throw error
  }
}

async getActiveInformation(page: number = 1, limit: number = 20): Promise<InformationPagination> {
  try {
    const response: ApiResponse<Information[]> = await this.client.get(`/information?page=${page}&limit=${limit}`)

    console.log('📊 API getActiveInformation response:', {
      hasData: !!response.data,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
    })


    const items = Array.isArray(response.data) ? response.data : []

    return {
      items,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 20,
      totalPages: response.pagination?.totalPages || 0,
    }
  } catch (error) {
    console.error('❌ getActiveInformation API error:', error)
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    }
  }
}

async getPinnedInformation(): Promise<Information | null> {
  try {
    const response: any = await this.client.get('/information/pinned')

    console.log('📌 API getPinnedInformation response:', response)





    let info: Information | null = null

    if (response?.data?.data && typeof response.data.data === 'object' && response.data.data.title) {

      info = response.data.data
      console.log('✅ Unwrapped double-nested response')
    } else if (response?.data && typeof response.data === 'object' && response.data.title) {

      info = response.data
      console.log('✅ Unwrapped single-nested response')
    } else if (response?.title) {

      info = response
      console.log('✅ Direct response, no unwrapping needed')
    }

    if (info) {
      console.log('✅ Found pinned banner:', info.title)
      return info
    }

    console.log('ℹ️ No pinned banner found')
    return null

  } catch (error) {
    console.error('❌ getPinnedInformation API error:', error)
    return null
  }
}

async getInformationDetail(id: string): Promise<Information> {
  try {
    const response: ApiResponse<Information> = await this.client.get(`/information/${id}`)
    return response.data!
  } catch (error) {
    throw error
  }
}

async trackInformationClick(id: string): Promise<void> {
  try {
    await this.client.post(`/information/${id}/click`)
  } catch (error) {
    throw error
  }
}

    async uploadInformationImage(file: File): Promise<{ url: string; path: string; size: number }> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      console.log('📤 Uploading image:', {
        name: file.name,
        size: file.size,
        type: file.type
      });


      const response = await this.client.post(
        '/admin/information/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      )

      console.log('📥 Upload response (raw):', JSON.stringify(response, null, 2));
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', response ? Object.keys(response) : 'null');


      interface UploadImageResponse {
        url: string;
        path: string;
        size: number;
      }

      let result: UploadImageResponse | null = null;


      const hasRequiredFields = (obj: any): obj is UploadImageResponse => {
        return obj &&
               typeof obj === 'object' &&
               typeof obj.url === 'string' &&
               typeof obj.path === 'string' &&
               obj.url.length > 0 &&
               obj.path.length > 0;
      };

      if (response && typeof response === 'object') {

        if (hasRequiredFields(response)) {
          result = response;
          console.log('✅ Response format: direct data object');
        }

        else if ('success' in response && 'data' in response && hasRequiredFields(response.data)) {
          result = response.data;
          console.log('✅ Response format: wrapped with success/data');
        }

        else if ('data' in response && hasRequiredFields(response.data)) {
          result = response.data;
          console.log('✅ Response format: data wrapper');
        }

        else if ('data' in response && response.data && typeof response.data === 'object' && 'data' in response.data) {
          if (hasRequiredFields(response.data.data)) {
            result = response.data.data;
            console.log('✅ Response format: double-nested data');
          }
        }

        else {
          console.warn('⚠️ Searching for url/path in response tree...');
          const searchForFields = (obj: any, depth = 0): UploadImageResponse | null => {
            if (depth > 3) return null;

            if (hasRequiredFields(obj)) {
              return obj;
            }


            for (const key in obj) {
              if (obj[key] && typeof obj[key] === 'object') {
                const found = searchForFields(obj[key], depth + 1);
                if (found) return found;
              }
            }

            return null;
          };

          result = searchForFields(response);
          if (result) {
            console.log('✅ Response format: found via deep search');
          }
        }
      }

      if (!result) {
        console.error('❌ Could not extract url/path from response:', JSON.stringify(response, null, 2));
        throw new Error('Invalid response from server: missing url or path. Full response logged to console.');
      }

      console.log('✅ Extracted result:', result);
      toast.success('Gambar berhasil diupload')

      return {
        url: result.url,
        path: result.path,
        size: result.size || file.size
      };
    } catch (error: any) {
      console.error('❌ Upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });


      let errorMessage = 'Gagal upload gambar';

      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error || errorData.message || errorData.detail || JSON.stringify(errorData);
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage)
      throw error
    }
  }


  async deleteInformationImage(imagePath: string): Promise<void> {
    try {
      console.log('🗑️ Deleting image:', imagePath);

      const response: ApiResponse<void> = await this.client.delete('/admin/information/delete-image', {
        data: { imagePath }
      })

      console.log('🗑️ Delete response:', response);

      if (response.success) {
        toast.success('Gambar berhasil dihapus')
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      const message = error.response?.data?.message || error.message || 'Gagal menghapus gambar'
      toast.error(message)
      throw error
    }
  }

async bulkUpdateAssetScheduleStatus(ids: string[], isActive: boolean): Promise<ApiResponse> {
  try {
    const result = await this.client.post('/asset-schedule/bulk/status', { ids, isActive })
    this.invalidateCache('/asset-schedule')
    return result
  } catch (error) {
    throw error
  }
}

  async getMyVoucherHistory(): Promise<ApiResponse<{
    usages: VoucherUsage[]
    summary: {
      totalUsed: number
      totalBonusReceived: number
    }
  }>> {
    const cacheKey = this.getCacheKey('/vouchers/my/history')
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/vouchers/my/history')
      this.setCache(cacheKey, data, 60000)
      return data
    })
  }

  clearCache(pattern?: string) {
    this.invalidateCache(pattern)
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingRequests: this.pendingRequests.size,
      consecutiveErrors: this.consecutiveErrors,
      isOnline: this.isOnline
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      consecutiveErrors: this.consecutiveErrors,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    }
  }





  // ── Public (no auth) ──────────────────────────────────────────────────────

  async getAffiliatorPublicInfo(code: string): Promise<ApiResponse<{ name: string }>> {
    return this.client.get(`/affiliate-program/public/${code.toUpperCase()}`)
  }

  async getMyAffiliatorProgram(): Promise<ApiResponse<AffiliatorDashboard>> {
    const cacheKey = this.getCacheKey('/affiliate-program/my-program')
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/affiliate-program/my-program', {
        headers: { 'X-Silent-Error': 'true' }
      })
      this.setCache(cacheKey, data, 10_000)
      return data
    })
  }

  async getMyAffiliatorInvites(): Promise<ApiResponse<AffiliatorInvitesDetailedResponse>> {
    const cacheKey = this.getCacheKey('/affiliate-program/my-invites')
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/affiliate-program/my-invites')
      this.setCache(cacheKey, data, 15_000)
      return data
    })
  }

  async getMyCommissions(): Promise<ApiResponse<CommissionDetails>> {
    const cacheKey = this.getCacheKey('/affiliate-program/my-commissions')
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/affiliate-program/my-commissions')
      this.setCache(cacheKey, data, 10_000)
      return data
    })
  }

  async requestCommissionWithdrawal(dto: RequestCommissionWithdrawalDto): Promise<ApiResponse> {
    try {
      const result = await this.client.post('/affiliate-program/commission-withdrawals', dto)
      this.invalidateCache('/affiliate-program/my-program')
      this.invalidateCache('/affiliate-program/my-commissions')
      this.invalidateCache('/affiliate-program/commission-withdrawals')
      return result
    } catch (error) {
      throw error
    }
  }

  async getMyCommissionWithdrawals(): Promise<ApiResponse<CommissionWithdrawalHistory>> {
    const cacheKey = this.getCacheKey('/affiliate-program/commission-withdrawals')
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get('/affiliate-program/commission-withdrawals')
      this.setCache(cacheKey, data, 8_000)
      return data
    })
  }

  async cancelCommissionWithdrawal(withdrawalId: string): Promise<ApiResponse> {
    try {
      const result = await this.client.delete(
        `/affiliate-program/commission-withdrawals/${withdrawalId}/cancel`
      )
      this.invalidateCache('/affiliate-program/my-program')
      this.invalidateCache('/affiliate-program/my-commissions')
      this.invalidateCache('/affiliate-program/commission-withdrawals')
      return result
    } catch (error) {
      throw error
    }
  }





  async adminGetAllAffiliators(params?: {
    page?: number
    limit?: number
    isActive?: boolean
  }): Promise<ApiResponse<AdminAffiliatorsResponse>> {
    const query = new URLSearchParams()
    if (params?.page)    query.append('page', String(params.page))
    if (params?.limit)   query.append('limit', String(params.limit))
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive))
    const cacheKey = this.getCacheKey('/admin/affiliate-program/affiliators', params)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/admin/affiliate-program/affiliators?${query}`)
      this.setCache(cacheKey, data, 10_000)
      return data
    })
  }

  async adminGetAffiliatorDetail(userId: string): Promise<ApiResponse> {
    const cacheKey = this.getCacheKey(`/admin/affiliate-program/affiliators/${userId}`)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/admin/affiliate-program/affiliators/${userId}`)
      this.setCache(cacheKey, data, 10_000)
      return data
    })
  }

  async adminAssignAffiliator(userId: string, dto: AssignAffiliatorDto): Promise<ApiResponse> {
    try {
      const result = await this.client.post(`/admin/affiliate-program/affiliators/${userId}`, dto)
      this.invalidateCache('/admin/affiliate-program/affiliators')
      return result
    } catch (error) {
      throw error
    }
  }

  async adminRevokeAffiliator(userId: string): Promise<ApiResponse> {
    try {
      const result = await this.client.delete(`/admin/affiliate-program/affiliators/${userId}/revoke`)
      this.invalidateCache('/admin/affiliate-program/affiliators')
      return result
    } catch (error) {
      throw error
    }
  }

  async adminUpdateAffiliatorConfig(programId: string, dto: UpdateAffiliatorConfigDto): Promise<ApiResponse> {
    try {
      const result = await this.client.put(`/admin/affiliate-program/affiliators/${programId}/config`, dto)
      this.invalidateCache('/admin/affiliate-program/affiliators')
      return result
    } catch (error) {
      throw error
    }
  }

  async adminGetCommissionWithdrawals(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<ApiResponse<AdminCommissionWithdrawalsResponse>> {
    const query = new URLSearchParams()
    if (params?.page)   query.append('page', String(params.page))
    if (params?.limit)  query.append('limit', String(params.limit))
    if (params?.status) query.append('status', params.status)
    const cacheKey = this.getCacheKey('/admin/affiliate-program/commission-withdrawals', params)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    return this.withDeduplication(cacheKey, async () => {
      const data = await this.client.get(`/admin/affiliate-program/commission-withdrawals?${query}`)
      this.setCache(cacheKey, data, 8_000)
      return data
    })
  }

  async adminApproveCommissionWithdrawal(
    withdrawalId: string,
    dto: ApproveCommissionWithdrawalDto
  ): Promise<ApiResponse> {
    try {
      if (!dto.approve && !dto.rejectionReason) {
        throw new Error('Alasan penolakan wajib diisi saat menolak request.')
      }
      const result = await this.client.post(
        `/admin/affiliate-program/commission-withdrawals/${withdrawalId}/approve`,
        dto
      )
      this.invalidateCache('/admin/affiliate-program/commission-withdrawals')
      this.invalidateCache('/admin/affiliate-program/affiliators')
      return result
    } catch (error) {
      throw error
    }
  }
}

export const api = new ApiClient()

if (typeof window !== 'undefined') {
  (window as any).api = api
}