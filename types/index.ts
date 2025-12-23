export interface User {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'user'
  isActive: boolean
  createdAt: string
}

export interface Asset {
  id: string
  name: string
  symbol: string
  profitRate: number
  isActive: boolean
  dataSource: 'realtime_db' | 'api' | 'mock'
  realtimeDbPath?: string
  apiEndpoint?: string
  description?: string
  createdAt: string
  updatedAt?: string
}

export interface BinaryOrder {
  id: string
  user_id: string
  asset_id: string
  asset_name: string
  direction: 'CALL' | 'PUT'
  amount: number
  duration: number
  entry_price: number
  entry_time: string
  exit_price: number | null
  exit_time: string | null
  status: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED'
  profit: number | null
  profitRate: number
  createdAt: string
}

export interface Balance {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'win' | 'lose' | 'order_debit' | 'order_profit'  // ← UPDATE
  amount: number
  description?: string
  createdAt: string
}

export interface PriceData {
  price: number
  timestamp: number
  datetime: string
  change?: number
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}