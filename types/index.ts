// types/index.ts - COMPLETE TYPE DEFINITIONS WITH STATUS & AFFILIATE
export interface User {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'user'
  status: 'standard' | 'gold' | 'vip'
  isActive: boolean
  referralCode: string
  referredBy?: string
  createdAt: string
  updatedAt?: string
}

export interface StatusInfo {
  current: 'standard' | 'gold' | 'vip'
  totalDeposit: number
  profitBonus: number
  nextStatus?: 'gold' | 'vip' | null
  progress: number
  depositNeeded?: number
}

export interface AffiliateInfo {
  referralCode: string
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  totalCommission: number
}

export interface UserProfile {
  user: User
  statusInfo: StatusInfo
  affiliate: AffiliateInfo
  balances: {
    real: number
    demo: number
    combined: number
  }
  recentActivity: {
    real: {
      transactions: Balance[]
      orders: BinaryOrder[]
    }
    demo: {
      transactions: Balance[]
      orders: BinaryOrder[]
    }
  }
  statistics: {
    real: TradingStats
    demo: TradingStats
    combined: TradingStats
  }
}

export interface TradingStats {
  totalOrders: number
  activeOrders: number
  wonOrders: number
  lostOrders: number
  winRate: number
  totalProfit: number
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
    initialPrice: number
    dailyVolatilityMin: number
    dailyVolatilityMax: number
    secondVolatilityMin: number
    secondVolatilityMax: number
    minPrice?: number
    maxPrice?: number
  }
  tradingSettings?: {
    minOrderAmount: number
    maxOrderAmount: number
    allowedDurations: number[]
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
  baseProfitRate: number
  statusBonus: number
  userStatus: 'standard' | 'gold' | 'vip'
  createdAt: string
  updatedAt?: string
}

export interface Balance {
  id: string
  user_id: string
  accountType: 'real' | 'demo'
  type: 'deposit' | 'withdrawal' | 'win' | 'lose' | 'order_debit' | 'order_profit' | 'order_refund' | 'affiliate_commission'
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
    statusDistribution?: {
      standard: number
      gold: number
      vip: number
    }
  }
  affiliate?: {
    totalReferrals: number
    completedReferrals: number
    pendingReferrals: number
    totalCommissionsPaid: number
    commissionRate: number
    conversionRate: number
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
      currentBalance?: number
      affiliateCommissions?: number
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
      currentBalance?: number
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
export type UserStatus = 'standard' | 'gold' | 'vip'

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
  referralCode?: string
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

export interface UserProfileInfo {
  completion: number
  personal: {
    fullName: string | null
    email: string
    phoneNumber: string | null
    dateOfBirth: string | null
    gender: 'male' | 'female' | 'other' | null
    nationality: string | null
  }
  address: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
  } | null
  identity: {
    type?: 'ktp' | 'passport' | 'sim'
    number?: string
    isVerified?: boolean
    verifiedAt?: string
  } | null
  bankAccount: {
    bankName?: string
    accountNumber?: string
    accountHolderName?: string
    isVerified?: boolean
    verifiedAt?: string
  } | null
  avatar: {
    url?: string
    uploadedAt?: string
  } | null
  settings: {
    emailNotifications: boolean
    smsNotifications: boolean
    tradingAlerts: boolean
    twoFactorEnabled: boolean
    language: string
    timezone: string
  }
  verification: {
    emailVerified: boolean
    phoneVerified: boolean
    identityVerified: boolean
    bankVerified: boolean
    verificationLevel: 'unverified' | 'basic' | 'intermediate' | 'advanced'
  }
}


export interface UpdateProfileRequest {
  // Personal Information
  fullName?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  nationality?: string
  
  // Address Information
  address?: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
  }
  
  // Identity Document
  identityDocument?: {
    type?: 'ktp' | 'passport' | 'sim'
    number?: string
    issuedDate?: string
    expiryDate?: string
  }
  
  // Bank Account
  bankAccount?: {
    bankName?: string
    accountNumber?: string
    accountHolderName?: string
  }
  
  // Settings
  settings?: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    tradingAlerts?: boolean
    twoFactorEnabled?: boolean
    language?: string
    timezone?: string
  }
}


export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UploadAvatarRequest {
  url: string
}

export interface VerifyPhoneRequest {
  phoneNumber: string
  verificationCode: string
}

export function calculateProfileCompletion(profile?: UserProfileInfo): number {
  if (!profile) return 10 // Base: email registered

  let completion = 10 // Base

  // Personal info (30%)
  if (profile.personal?.fullName) completion += 10
  if (profile.personal?.phoneNumber) completion += 10
  if (profile.personal?.dateOfBirth) completion += 5
  if (profile.personal?.gender) completion += 5

  // Address (20%)
  if (profile.address?.street) completion += 5
  if (profile.address?.city) completion += 5
  if (profile.address?.province) completion += 5
  if (profile.address?.postalCode) completion += 5

  // Identity (20%)
  if (profile.identity?.number) completion += 10
  if (profile.identity?.isVerified) completion += 10

  // Bank Account (20%)
  if (profile.bankAccount?.accountNumber) completion += 10
  if (profile.bankAccount?.isVerified) completion += 10

  // Avatar (10%)
  if (profile.avatar?.url) completion += 10

  return Math.min(100, completion)
}

// ===================================
// VALIDATION HELPERS
// ===================================

export function validatePhoneNumber(phone: string): boolean {
  // Indonesian phone number format
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/
  return phoneRegex.test(phone)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function formatPhoneNumber(phone: string): string {
  // Format Indonesian phone number
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('62')) {
    return '+' + cleaned
  } else if (cleaned.startsWith('0')) {
    return '+62' + cleaned.substring(1)
  }
  
  return '+62' + cleaned
}

// ===================================
// PROFILE DATA MASKING
// ===================================

export function maskIdentityNumber(number?: string): string {
  if (!number) return '****'
  if (number.length <= 4) return '****'
  
  const visible = number.slice(-4)
  const masked = '*'.repeat(number.length - 4)
  return masked + visible
}

export function maskBankAccount(accountNumber?: string): string {
  if (!accountNumber) return '****'
  if (accountNumber.length <= 4) return '****'
  
  const visible = accountNumber.slice(-4)
  const masked = '*'.repeat(accountNumber.length - 4)
  return masked + visible
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '****'
  if (phone.length <= 4) return '****'
  
  const visible = phone.slice(-4)
  const masked = '*'.repeat(Math.min(phone.length - 4, 8))
  return masked + visible
}

// Constants
export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'ACTIVE', 'WON', 'LOST', 'EXPIRED', 'CANCELLED']
export const ORDER_DIRECTIONS: OrderDirection[] = ['CALL', 'PUT']
export const ACCOUNT_TYPES: AccountType[] = ['real', 'demo']
export const USER_STATUSES: UserStatus[] = ['standard', 'gold', 'vip']
export const DURATIONS = [1, 2, 3, 4, 5, 10, 15, 30, 45, 60] as const
export const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000] as const
export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const

export type Duration = typeof DURATIONS[number]
export type QuickAmount = typeof QUICK_AMOUNTS[number]
export type Timeframe = typeof TIMEFRAMES[number]

// Status configuration
export const STATUS_CONFIG = {
  standard: {
    label: 'Standard',
    minDeposit: 0,
    maxDeposit: 199999,
    profitBonus: 0,
    color: 'gray',
    icon: 'User'
  },
  gold: {
    label: 'Gold',
    minDeposit: 200000,
    maxDeposit: 1599999,
    profitBonus: 5,
    color: 'yellow',
    icon: 'Award'
  },
  vip: {
    label: 'VIP',
    minDeposit: 1600000,
    maxDeposit: Infinity,
    profitBonus: 10,
    color: 'purple',
    icon: 'Crown'
  }
} as const