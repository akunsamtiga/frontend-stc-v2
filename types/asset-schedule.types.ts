// types/asset-schedule.types.ts

export type ScheduleTrend = 'buy' | 'sell'
export type ScheduleStatus = 'pending' | 'executed' | 'failed' | 'cancelled'
export type ScheduleTimeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d'

export interface AssetSchedule {
  id: string
  assetSymbol: string
  scheduledTime: string
  trend: ScheduleTrend
  timeframe: ScheduleTimeframe
  notes?: string
  isActive: boolean
  status: ScheduleStatus
  createdBy: string
  createdByEmail: string
  createdAt: string
  updatedAt: string
  executedAt?: string
  executionDetails?: {
    startPrice?: number
    endPrice?: number
    priceChange?: number
    success: boolean
    errorMessage?: string
  }
}

export interface CreateScheduleDto {
  assetSymbol: string
  scheduledTime: string
  trend: ScheduleTrend
  timeframe: ScheduleTimeframe
  notes?: string
  isActive?: boolean
}

export interface UpdateScheduleDto {
  assetSymbol?: string
  scheduledTime?: string
  trend?: ScheduleTrend
  timeframe?: ScheduleTimeframe
  notes?: string
  isActive?: boolean
}

export interface ScheduleFilters {
  page?: number
  limit?: number
  assetSymbol?: string
  trend?: ScheduleTrend
  timeframe?: ScheduleTimeframe
  status?: ScheduleStatus
  isActive?: boolean
  fromDate?: string
  toDate?: string
}

export interface ScheduleStats {
  total: number
  todayTotal: number
  pending: number
  executed: number
  failed: number
  cancelled: number
}

export interface SchedulePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}