import axios, { AxiosInstance, AxiosError } from 'axios'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

// Response types
interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - return full response.data
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<any>) => {
        const message = error.response?.data?.error || error.message || 'An error occurred'
        
        // Don't show toast for silent requests
        if (!error.config?.headers?.['X-Silent-Error']) {
          toast.error(message)
        }
        
        return Promise.reject(error)
      }
    )
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

  // Auth
  async login(email: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth/login', { email, password })
  }

  async register(email: string, password: string): Promise<ApiResponse> {
    return this.client.post('/auth/register', { email, password })
  }

  // User
  async getProfile(): Promise<ApiResponse> {
    return this.client.get('/user/profile')
  }

  // Balance
  async getCurrentBalance(): Promise<ApiResponse> {
    return this.client.get('/balance/current')
  }

  async getBalanceHistory(page = 1, limit = 20): Promise<ApiResponse> {
    return this.client.get(`/balance?page=${page}&limit=${limit}`)
  }

  async createBalanceEntry(data: { 
    type: string
    amount: number
    description?: string 
  }): Promise<ApiResponse> {
    return this.client.post('/balance', data)
  }

  // Assets
  async getAssets(activeOnly = false): Promise<ApiResponse> {
    return this.client.get(`/assets?activeOnly=${activeOnly}`)
  }

  async getAssetById(id: string): Promise<ApiResponse> {
    return this.client.get(`/assets/${id}`)
  }

  async getCurrentPrice(assetId: string): Promise<ApiResponse> {
    return this.client.get(`/assets/${assetId}/price`)
  }

  async createAsset(data: any): Promise<ApiResponse> {
    return this.client.post('/assets', data)
  }

  async updateAsset(id: string, data: any): Promise<ApiResponse> {
    return this.client.put(`/assets/${id}`, data)
  }

  async deleteAsset(id: string): Promise<ApiResponse> {
    return this.client.delete(`/assets/${id}`)
  }

  // Binary Orders
  async createOrder(data: {
    asset_id: string
    direction: 'CALL' | 'PUT'
    amount: number
    duration: number
  }): Promise<ApiResponse> {
    return this.client.post('/binary-orders', data)
  }

  async getOrders(status?: string, page = 1, limit = 20): Promise<ApiResponse> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    return this.client.get(`/binary-orders?${params.toString()}`)
  }

  async getOrderById(id: string): Promise<ApiResponse> {
    return this.client.get(`/binary-orders/${id}`)
  }

  // Admin - Users
  async getAllUsers(page = 1, limit = 50): Promise<ApiResponse> {
    return this.client.get(`/admin/users?page=${page}&limit=${limit}`)
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
}

export const api = new ApiClient()