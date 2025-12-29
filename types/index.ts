// types/index.ts - UPDATED with Real/Demo support
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
  status: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED'
  profit: number | null
  profitRate: number
  createdAt: string
}

export interface Balance {
  id: string
  user_id: string
  accountType: 'real' | 'demo'
  type: 'deposit' | 'withdrawal' | 'win' | 'lose' | 'order_debit' | 'order_profit'
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

export interface BalanceSummary {
  realBalance: number
  demoBalance: number
  realTransactions: number
  demoTransactions: number
}

export type AccountType = 'real' | 'demo'

// ✅ NEW: System Statistics with Real/Demo separation
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
    }
  }
  combined: {
    totalOrders: number
    totalVolume: number
    totalProfit: number
  }
  timestamp: string
}