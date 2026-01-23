// types/index.ts - Full 1-second trading support

// ============================================
// AUTH & USER TYPES
// ============================================
export interface User {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'user'
  status: 'standard' | 'gold' | 'vip'
  isActive: boolean
  referralCode: string
  referredBy?: string
  isNewUser: boolean  
  tutorialCompleted: boolean 
  loginCount: number   
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
  profileInfo?: UserProfileInfo  
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

// Update this function in types/index.ts

export function formatWithdrawalStatus(request: { status: WithdrawalStatus } | WithdrawalRequest): {
  label: string;
  bgClass: string;
  canCancel: boolean;
} {
  const status = request.status;
  
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        bgClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        canCancel: true
      };
    case 'approved':
      return {
        label: 'Approved',
        bgClass: 'bg-blue-100 text-blue-800 border-blue-200',
        canCancel: false
      };
    case 'completed':
      return {
        label: 'Completed',
        bgClass: 'bg-green-100 text-green-800 border-green-200',
        canCancel: false
      };
    case 'rejected':
      return {
        label: 'Rejected',
        bgClass: 'bg-red-100 text-red-800 border-red-200',
        canCancel: false
      };
    default:
      return {
        label: status,
        bgClass: 'bg-gray-100 text-gray-800 border-gray-200',
        canCancel: false
      };
  }
}

export function getWithdrawalStatusLabel(status: WithdrawalStatus): string {
  const labels: Record<WithdrawalStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return labels[status] || status;
}

export function getWithdrawalStatusBg(status: WithdrawalStatus): string {
  const bgClasses: Record<WithdrawalStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };
  return bgClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}


export interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  description?: string
  
  userEmail: string
  userName?: string
  bankAccount?: {
    bankName: string
    accountNumber: string
    accountHolderName: string
  }
  
  ktpVerified: boolean
  selfieVerified: boolean
  currentBalance: number
  
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  adminNotes?: string
  
  createdAt: string
  updatedAt?: string
}

export interface WithdrawalSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  completed: number
}

export interface RequestWithdrawalDto {
  amount: number
  description?: string
}

export interface ApproveWithdrawalDto {
  approve: boolean
  adminNotes?: string
  rejectionReason?: string
}

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const

export type WithdrawalStatus = typeof WITHDRAWAL_STATUS[keyof typeof WITHDRAWAL_STATUS]

export const WITHDRAWAL_CONFIG = {
  MIN_AMOUNT: 100000,
  REQUIRE_KTP: true,
  REQUIRE_SELFIE: true,
  REQUIRE_BANK_ACCOUNT: true,
} as const

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
  address?: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
  } | null
  identity?: {
    type?: 'ktp' | 'passport' | 'sim'
    number?: string
    isVerified?: boolean
    verifiedAt?: string
    verifiedBy?: string
    rejectionReason?: string
    rejectedAt?: string
    rejectedBy?: string
    photoFront?: {
      url: string
      uploadedAt: string
      fileSize?: number
      mimeType?: string
    } | null
    photoBack?: {
      url: string
      uploadedAt: string
      fileSize?: number
      mimeType?: string
    } | null
  } | null
  bankAccount?: {
    bankName?: string
    accountNumber?: string
    accountHolderName?: string
    isVerified?: boolean
    verifiedAt?: string
  } | null
  avatar?: {
    url: string
    uploadedAt: string
    fileSize?: number
    mimeType?: string
  } | null
  selfie?: {
    url: string
    uploadedAt: string
    isVerified: boolean
    verifiedAt?: string
    verifiedBy?: string
    rejectionReason?: string
    rejectedAt?: string
    rejectedBy?: string
    fileSize?: number
    mimeType?: string
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
    selfieVerified: boolean
    bankVerified: boolean
    verificationLevel: 'unverified' | 'basic' | 'intermediate' | 'advanced'
  }
}

export interface PendingKTPVerification {
  userId: string
  email: string
  fullName?: string
  documentType?: 'ktp' | 'passport' | 'sim'
  documentNumber?: string
  photoFront?: {
    url: string
    uploadedAt: string
  }
  photoBack?: {
    url: string
    uploadedAt: string
  }
  uploadedAt: string
}

export interface PendingSelfieVerification {
  userId: string
  email: string
  fullName?: string
  photoUrl: string
  uploadedAt: string
}

export interface PendingVerifications {
  ktpVerifications: PendingKTPVerification[]
  selfieVerifications: PendingSelfieVerification[]
  summary: {
    totalPendingKTP: number
    totalPendingSelfie: number
    total: number
  }
}

export interface VerifyDocumentRequest {
  approve: boolean
  adminNotes?: string
  rejectionReason?: string
}

// ============================================
// ASSET TYPES - Binance Support
// ============================================
export interface Asset {
  id: string
  name: string
  symbol: string
  type: 'forex' | 'stock' | 'commodity' | 'crypto' | 'index'
  category: 'normal' | 'crypto'
  profitRate: number
  isActive: boolean
  icon?: string
  dataSource: 'realtime_db' | 'api' | 'mock' | 'binance'
  realtimeDbPath?: string
  apiEndpoint?: string
  cryptoConfig?: {
    baseCurrency: string
    quoteCurrency: string
    exchange?: string
  }
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
  createdBy?: string
}

export const ASSET_TYPES = ['forex', 'stock', 'commodity', 'crypto', 'index'] as const
export type AssetType = typeof ASSET_TYPES[number]

export const ASSET_TYPE_INFO = {
  forex: {
    label: 'Forex',
    description: 'Foreign Exchange Currency Pairs',
    examples: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
    icon: '💱',
    color: 'blue'
  },
  stock: {
    label: 'Stocks',
    description: 'Company Shares & Equities',
    examples: ['AAPL', 'GOOGL', 'TSLA'],
    icon: '📈',
    color: 'green'
  },
  commodity: {
    label: 'Commodities',
    description: 'Raw Materials & Resources',
    examples: ['Gold', 'Silver', 'Oil'],
    icon: '🛢️',
    color: 'yellow'
  },
  crypto: {
    label: 'Cryptocurrency',
    description: 'Digital Currencies',
    examples: ['BTC/USD', 'ETH/USD', 'BNB/USD'],
    icon: '₿',
    color: 'orange'
  },
  index: {
    label: 'Indices',
    description: 'Stock Market Indices',
    examples: ['S&P 500', 'NASDAQ', 'Dow Jones'],
    icon: '📊',
    color: 'purple'
  }
} as const

export function getAssetTypeLabel(type: AssetType): string {
  return ASSET_TYPE_INFO[type]?.label || type
}

export function getAssetTypeIcon(type: AssetType): string {
  return ASSET_TYPE_INFO[type]?.icon || '📊'
}

export function getAssetTypeColor(type: AssetType): string {
  return ASSET_TYPE_INFO[type]?.color || 'gray'
}

// ============================================
// BINARY ORDER TYPES
// ============================================
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
  baseProfitRate?: number
  statusBonus?: number
  userStatus?: string
  createdAt: string
  updatedAt?: string
  durationDisplay?: string
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

// ============================================
// BALANCE & SUMMARY
// ============================================
export interface BalanceSummary {
  realBalance: number
  demoBalance: number
  realTransactions: number
  demoTransactions: number
}

// ============================================
// TRADING STATS
// ============================================
export interface TradingStats {
  totalOrders: number
  activeOrders: number
  wonOrders: number
  lostOrders: number
  winRate: number
  totalProfit: number
}

// ============================================
// PRICE & OHLC DATA
// ============================================
export interface PriceData {
  price: number
  timestamp: number
  datetime: string
  datetime_iso?: string
  timezone?: string
  change?: number
  volume24h?: number
  change24h?: number
  changePercent24h?: number
  high24h?: number
  low24h?: number
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

export interface BinancePrice {
  price: number
  timestamp: number
  datetime: string
  datetime_iso?: string
  timezone?: string
  volume24h: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  source?: 'binance'
  pair?: string
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  error?: string
  [key: string]: any
}

export interface AuthResponse {
  success: boolean
  message: string
  user: User
  token: string
}

// ============================================
// PROFILE & PREFERENCES
// ============================================
export interface UpdateProfileRequest {
  fullName?: string
  phoneNumber?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  nationality?: string
  address?: {
    street?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
  }
  identityDocument?: {
    type?: 'ktp' | 'passport' | 'sim'
    number?: string
    issuedDate?: string
    expiryDate?: string
    photoFront?: {
      url: string
      fileSize?: number
      mimeType?: string
    }
    photoBack?: {
      url: string
      fileSize?: number
      mimeType?: string
    }
  }
  bankAccount?: {
    bankName?: string
    accountNumber?: string
    accountHolderName?: string
  }
  settings?: {
    emailNotifications?: boolean
    smsNotifications?: boolean
    tradingAlerts?: boolean
    twoFactorEnabled?: boolean
    language?: string
    timezone?: string
  }
}

// ============================================
// SYSTEM STATS & ADMIN
// ============================================
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
   withdrawal?: {
    pending: number
    approved: number
    rejected: number
    completed: number
    totalAmount: number
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

// ============================================
// CRYPTO SCHEDULER STATUS
// ============================================
export interface CryptoSchedulerStatus {
  isRunning: boolean
  schedulerActive: boolean
  assetCount: number
  updateCount: number
  errorCount: number
  lastUpdate: string
  updateInterval: string
  api: string
  assets: Array<{
    symbol: string
    pair: string
    path: string
  }>
  ohlcStats?: any
}

// ============================================
// CREATE/UPDATE ASSET REQUESTS
// ============================================
export interface CreateAssetRequest {
  name: string
  symbol: string
  category: 'normal' | 'crypto'
  profitRate: number
  icon?: string
  isActive: boolean
  dataSource: 'realtime_db' | 'api' | 'mock' | 'binance'
  realtimeDbPath?: string
  apiEndpoint?: string
  cryptoConfig?: {
    baseCurrency: string
    quoteCurrency: string
    exchange?: string
  }
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
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

// ============================================
// UTILITY TYPES
// ============================================
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

// ============================================
// DURATION CONSTANTS - With 1s Support
// ============================================

export const DURATIONS = [
  0.0167,
  1, 2, 3, 4, 5, 
  10, 15, 30, 45, 60
] as const

export const DURATION_DISPLAY_MAP: Record<number, string> = {
  0.0167: '1s',
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

export const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000] as const

export const TIMEFRAMES = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const

export type Duration = typeof DURATIONS[number]
export type QuickAmount = typeof QUICK_AMOUNTS[number]
export type Timeframe = typeof TIMEFRAMES[number]
export type AccountType = 'real' | 'demo'
export type UserStatus = 'standard' | 'gold' | 'vip'
export type OrderStatus = BinaryOrder['status']
export type OrderDirection = BinaryOrder['direction']
export type BalanceType = Balance['type']
export type AssetDataSource = 'realtime_db' | 'api' | 'mock' | 'binance'
export type AssetCategory = Asset['category']

// ============================================
// UTILITY FUNCTIONS - Enhanced for 1s
// ============================================

export function formatDurationDisplay(durationMinutes: number): string {
  return DURATION_DISPLAY_MAP[durationMinutes] || `${durationMinutes}m`
}

export function parseDurationFromDisplay(display: string): number | null {
  const entry = Object.entries(DURATION_DISPLAY_MAP).find(([_, d]) => d === display)
  return entry ? parseFloat(entry[0]) : null
}

export function isDurationAllowed(duration: number, allowedDurations?: number[]): boolean {
  if (!allowedDurations || allowedDurations.length === 0) return true
  
  const tolerance = 0.0001
  return allowedDurations.some(allowed => Math.abs(allowed - duration) < tolerance)
}

export function getDurationInSeconds(durationMinutes: number): number {
  return Math.round(durationMinutes * 60)
}

export function getDurationDisplayFromSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m`
}

export function getDurationLabel(durationMinutes: number): string {
  if (durationMinutes < 1) {
    const seconds = Math.round(durationMinutes * 60)
    return `${seconds} second${seconds > 1 ? 's' : ''}`
  } else if (durationMinutes < 60) {
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

export function isUltraShortDuration(duration: number): boolean {
  return duration < 1
}

export function formatUltraShortDuration(durationMinutes: number): string {
  if (durationMinutes >= 1) return formatDurationDisplay(durationMinutes)
  const seconds = Math.round(durationMinutes * 60)
  return `${seconds}s`
}

export const DURATION_CATEGORIES = {
  ULTRA_SHORT: [0.0167],
  SHORT: [1, 2, 3, 4, 5],
  MEDIUM: [10, 15, 30, 45],
  LONG: [60]
} as const

export function getDurationCategory(duration: number): 'ultra_short' | 'short' | 'medium' | 'long' {
  if (duration < 1) return 'ultra_short'
  if (duration <= 5) return 'short'
  if (duration < 60) return 'medium'
  return 'long'
}

export interface TradingSettings {
  minOrderAmount: number
  maxOrderAmount: number
  allowedDurations: number[]
}

export const DEFAULT_TRADING_SETTINGS: TradingSettings = {
  minOrderAmount: 1000,
  maxOrderAmount: 1000000,
  allowedDurations: [
    0.0167,
    1, 2, 3, 4, 5,
    10, 15, 30, 45, 60
  ]
}

export function getRecommendedDurations(assetType: string): number[] {
  const recommendations: Record<string, number[]> = {
    'crypto': [0.0167, 1, 5, 15, 30, 60],
    'forex': [1, 5, 15, 30, 60],
    'stock': [5, 15, 30, 60],
    'commodity': [15, 30, 60],
    'index': [15, 30, 60]
  }
  
  return recommendations[assetType] || DEFAULT_TRADING_SETTINGS.allowedDurations
}

export function supports1sTradingInternal(asset: Asset): boolean {
  if (!asset.tradingSettings?.allowedDurations) return false
  
  const tolerance = 0.0001
  return asset.tradingSettings.allowedDurations.some(
    duration => Math.abs(duration - 0.0167) < tolerance
  )
}

export function isCryptoAsset(asset: Asset): boolean {
  return asset.category === 'crypto'
}

export function isNormalAsset(asset: Asset): boolean {
  return asset.category === 'normal'
}

export function usesBinance(asset: Asset): boolean {
  return asset.dataSource === 'binance' || (asset.category === 'crypto' && !!asset.cryptoConfig)
}

export function getAssetCategoryLabel(category: AssetCategory): string {
  return category === 'crypto' ? 'Cryptocurrency' : 'Normal Asset'
}

export function getDataSourceLabel(dataSource: AssetDataSource): string {
  const labels: Record<AssetDataSource, string> = {
    'realtime_db': 'Realtime Database',
    'api': 'External API',
    'mock': 'Mock Data',
    'binance': 'Binance API (FREE)'
  }
  return labels[dataSource] || dataSource
}

export function getCryptoPairDisplay(asset: Asset): string | null {
  if (!isCryptoAsset(asset) || !asset.cryptoConfig) return null
  
  const { baseCurrency, quoteCurrency } = asset.cryptoConfig
  return `${baseCurrency}/${quoteCurrency}`
}

export function getAssetDisplayName(asset: Asset): string {
  if (isCryptoAsset(asset)) {
    const pair = getCryptoPairDisplay(asset)
    return pair || asset.name
  }
  return asset.name
}

export const BINANCE_SUPPORTED_COINS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE', 
  'MATIC', 'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 
  'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'ETC', 'NEAR', 'APT', 'ARB', 'OP'
] as const

export const BINANCE_SUPPORTED_QUOTE_CURRENCIES = [
  'USD', 'USDT', 'BUSD', 'EUR', 'GBP'
] as const

export type BinanceSupportedCoin = typeof BINANCE_SUPPORTED_COINS[number]
export type BinanceSupportedQuote = typeof BINANCE_SUPPORTED_QUOTE_CURRENCIES[number]

export function isBinanceSupported(baseCurrency: string, quoteCurrency: string): boolean {
  return BINANCE_SUPPORTED_COINS.includes(baseCurrency.toUpperCase() as any) &&
         BINANCE_SUPPORTED_QUOTE_CURRENCIES.includes(quoteCurrency.toUpperCase() as any)
}

// ============================================
// STATUS CONFIGURATION
// ============================================
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

// ============================================
// VALIDATION UTILITIES
// ============================================
export function validatePhoneNumber(phone: string): boolean {
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
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('62')) {
    return '+' + cleaned
  } else if (cleaned.startsWith('0')) {
    return '+62' + cleaned.substring(1)
  }
  
  return '+62' + cleaned
}

export function calculateProfileCompletion(profile?: UserProfileInfo): number {
  if (!profile) return 10

  let completion = 10

  if (profile.personal?.fullName) completion += 10
  if (profile.personal?.phoneNumber) completion += 10
  if (profile.personal?.dateOfBirth) completion += 5
  if (profile.personal?.gender) completion += 5

  if (profile.address?.street) completion += 5
  if (profile.address?.city) completion += 5
  if (profile.address?.province) completion += 5
  if (profile.address?.postalCode) completion += 5

  if (profile.identity?.number) completion += 10
  if (profile.identity?.isVerified) completion += 10

  if (profile.bankAccount?.accountNumber) completion += 10
  if (profile.bankAccount?.isVerified) completion += 10

  if (profile.avatar?.url) completion += 10

  return Math.min(100, completion)
}

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

// ============================================
// API REQUEST TYPES
// ============================================
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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// WEBSOCKET & REAL-TIME
// ============================================
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

// ============================================
// CHART & INDICATOR TYPES
// ============================================
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

// ============================================
// STATE MANAGEMENT
// ============================================
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

// ============================================
// FORM TYPES
// ============================================
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

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}