// types/index.ts - COMPLETE TYPE DEFINITIONS
export interface User {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'user'
  isActive: boolean
  createdAt: string
  updatedAt?: string
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
  simulatorSettings?: {
    initialPrice?: number
    secondVolatilityMin?: number
    secondVolatilityMax?: number
    minPrice?: number
    maxPrice?: number
  }
  createdAt: string
  updatedAt?: string
}

export interface BinaryOrder {
  id: string
  user_id: string
  accountType: 'real' | 'demo'
  asset_id: string
  asset_name: string
  direction: 'CALL' | 'PUT'
  amount: number
  duration: number
  entry_price: number
  entry_time: string
  exit_price: number | null
  exit_time: string | null
  status: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | 'CANCELLED'
  profit: number | null
  profitRate: number
  createdAt: string
  updatedAt?: string
}

export interface Balance {
  id: string
  user_id: string
  accountType: 'real' | 'demo'
  type: 'deposit' | 'withdrawal' | 'win' | 'lose' | 'order_debit' | 'order_profit' | 'order_refund'
  amount: number
  balance_before?: number
  balance_after?: number
  description?: string
  related_order_id?: string
  createdAt: string
}

export interface PriceData {
  price: number
  timestamp: number
  datetime: string
  datetime_iso?: string
  timezone?: string
  change?: number
}

export interface OHLCData {
  timestamp: number
  datetime: string
  datetime_iso?: string
  timezone?: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  isCompleted?: boolean
}

export interface AuthResponse {
  success: boolean
  message: string
  user: User
  token: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export interface BalanceSummary {
  realBalance: number
  demoBalance: number
  realTransactions: number
  demoTransactions: number
}

export type AccountType = 'real' | 'demo'

export interface SystemStatistics {
  users: {
    total: number
    active: number
    admins: number
  }
  realAccount: {
    trading: {
      totalOrders: number
      activeOrders: number
      wonOrders: number
      lostOrders: number
      winRate: number
      totalVolume: number
      totalProfit: number
    }
    financial: {
      totalDeposits: number
      totalWithdrawals: number
      netFlow: number
      currentBalance: number
    }
  }
  demoAccount: {
    trading: {
      totalOrders: number
      activeOrders: number
      wonOrders: number
      lostOrders: number
      winRate: number
      totalVolume: number
      totalProfit: number
    }
    financial: {
      totalDeposits: number
      totalWithdrawals: number
      netFlow: number
      currentBalance: number
    }
  }
  combined: {
    totalOrders: number
    totalVolume: number
    totalProfit: number
  }
  timestamp: string
}

export interface OrderStats {
  total: number
  active: number
  won: number
  lost: number
  cancelled: number
  winRate: number
  totalProfit: number
  averageProfit: number
}

export interface TradingSession {
  id: string
  user_id: string
  start_time: string
  end_time?: string
  total_trades: number
  won_trades: number
  lost_trades: number
  total_profit: number
  createdAt: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'order_won' | 'order_lost' | 'balance_update' | 'system' | 'promotion'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: string
}

export interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    trade_alerts: boolean
  }
  trading: {
    default_amount: number
    default_duration: number
    default_account: AccountType
    sound_enabled: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
  }
}

export interface ChartIndicator {
  id: string
  name: string
  type: 'sma' | 'ema' | 'bollinger' | 'rsi' | 'macd' | 'volume' | 'stochastic' | 'atr'
  enabled: boolean
  settings: Record<string, any>
  color?: string
}

export interface TradingSignal {
  id: string
  asset_id: string
  asset_name: string
  signal: 'CALL' | 'PUT' | 'NEUTRAL'
  strength: number
  indicators: string[]
  created_at: string
  expires_at: string
}

// Utility types
export type OrderStatus = BinaryOrder['status']
export type OrderDirection = BinaryOrder['direction']
export type BalanceType = Balance['type']
export type AssetDataSource = Asset['dataSource']

// Request types
export interface CreateOrderRequest {
  accountType: AccountType
  asset_id: string
  direction: OrderDirection
  amount: number
  duration: number
}

export interface CreateBalanceEntryRequest {
  accountType: AccountType
  type: 'deposit' | 'withdrawal'
  amount: number
  description?: string
}

export interface UpdateUserRequest {
  email?: string
  password?: string
  role?: User['role']
  isActive?: boolean
}

export interface FilterOptions {
  status?: OrderStatus | 'all'
  accountType?: AccountType | 'all'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Response wrappers
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OrdersResponse extends PaginatedResponse<BinaryOrder> {}
export interface BalanceHistoryResponse extends PaginatedResponse<Balance> {}
export interface AssetsResponse {
  assets: Asset[]
  total: number
}

// Error types
export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: any
}

// WebSocket message types
export interface WSMessage {
  type: 'price_update' | 'order_update' | 'balance_update' | 'notification'
  data: any
  timestamp: number
}

export interface WSPriceUpdate {
  asset_id: string
  price: number
  change: number
  timestamp: number
}

export interface WSOrderUpdate {
  order_id: string
  status: OrderStatus
  exit_price?: number
  profit?: number
  timestamp: number
}

export interface WSBalanceUpdate {
  accountType: AccountType
  balance: number
  change: number
  timestamp: number
}

// Chart data types
export interface CandlestickData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface LineData {
  time: number
  value: number
}

export interface HistogramData {
  time: number
  value: number
  color?: string
}

// State types for stores
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  hydrated: boolean
}

export interface TradingState {
  selectedAsset: Asset | null
  selectedAccountType: AccountType
  currentPrice: PriceData | null
  priceHistory: PriceData[]
  isChartReady: boolean
  lastUpdate: number
}

export interface BalanceState {
  realBalance: number
  demoBalance: number
  loading: boolean
  lastUpdate: number
}

export interface OrderState {
  activeOrders: BinaryOrder[]
  completedOrders: BinaryOrder[]
  loading: boolean
  lastUpdate: number
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
}

export interface OrderFormData {
  accountType: AccountType
  asset_id: string
  direction: OrderDirection
  amount: number
  duration: number
}

export interface BalanceFormData {
  accountType: AccountType
  type: 'deposit' | 'withdrawal'
  amount: number
  description?: string
}

// Constants
export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'ACTIVE', 'WON', 'LOST', 'EXPIRED', 'CANCELLED']
export const ORDER_DIRECTIONS: OrderDirection[] = ['CALL', 'PUT']
export const ACCOUNT_TYPES: AccountType[] = ['real', 'demo']
export const DURATIONS = [1, 2, 3, 4, 5, 10, 15, 30, 45, 60] as const
export const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000] as const
export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const

export type Duration = typeof DURATIONS[number]
export type QuickAmount = typeof QUICK_AMOUNTS[number]
export type Timeframe = typeof TIMEFRAMES[number]