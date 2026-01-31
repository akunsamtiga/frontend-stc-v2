// lib/api-wrapper.ts - API WRAPPER untuk mengatasi issue
import { api } from './api'
import type {
  AssetSchedule,
  CreateAssetScheduleRequest,
  UpdateAssetScheduleRequest,
  GetAssetSchedulesQuery,
  AssetSchedulePagination,
  AssetScheduleStatistics,
  Asset,
  ApiResponse
} from '@/types'

/**
 * Wrapper functions untuk Asset Schedule API
 * Dibuat karena ada issue dengan method detection di runtime
 */

export const assetScheduleApi = {
  /**
   * Get all schedules with pagination
   */
  async getSchedules(query?: GetAssetSchedulesQuery): Promise<ApiResponse<{
    data: AssetSchedule[]
    pagination: AssetSchedulePagination
  }>> {
    const params = new URLSearchParams()
    
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.assetSymbol) params.append('assetSymbol', query.assetSymbol)
    if (query?.trend) params.append('trend', query.trend)
    if (query?.timeframe) params.append('timeframe', query.timeframe)
    if (query?.status && query.status !== 'all') params.append('status', query.status)
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString())
    if (query?.scheduledFrom) params.append('scheduledFrom', query.scheduledFrom)
    if (query?.scheduledTo) params.append('scheduledTo', query.scheduledTo)
    if (query?.sortBy) params.append('sortBy', query.sortBy)
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder)
    
    return (api as any).client.get(`/asset-schedule?${params}`)
  },

  /**
   * Get statistics
   */
  async getStatistics(): Promise<ApiResponse<AssetScheduleStatistics>> {
    return (api as any).client.get('/asset-schedule/stats/overview')
  },

  /**
   * Create schedule
   */
  async create(data: CreateAssetScheduleRequest): Promise<ApiResponse<AssetSchedule>> {
    const result = await (api as any).client.post('/asset-schedule', data)
    api.clearCache('/asset-schedule')
    return result
  },

  /**
   * Update schedule
   */
  async update(id: string, data: UpdateAssetScheduleRequest): Promise<ApiResponse<AssetSchedule>> {
    const result = await (api as any).client.put(`/asset-schedule/${id}`, data)
    api.clearCache('/asset-schedule')
    return result
  },

  /**
   * Delete schedule
   */
  async delete(id: string): Promise<ApiResponse> {
    const result = await (api as any).client.delete(`/asset-schedule/${id}`)
    api.clearCache('/asset-schedule')
    return result
  },

  /**
   * Cancel schedule
   */
  async cancel(id: string): Promise<ApiResponse> {
    const result = await (api as any).client.delete(`/asset-schedule/${id}/cancel`)
    api.clearCache('/asset-schedule')
    return result
  },

  /**
   * Execute schedule now
   */
  async executeNow(id: string): Promise<ApiResponse> {
    const result = await (api as any).client.post(`/asset-schedule/${id}/execute`, {})
    api.clearCache('/asset-schedule')
    return result
  }
}

/**
 * Wrapper function untuk get assets
 */
export const assetsApi = {
  async getAll(): Promise<ApiResponse<{ assets: Asset[]; total: number }>> {
    return (api as any).client.get('/assets')
  }
}