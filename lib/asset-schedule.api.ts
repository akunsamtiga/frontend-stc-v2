// lib/api/asset-schedule.api.ts

import axios from 'axios'
import type {
  AssetSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleFilters,
  ScheduleStats,
  SchedulePagination,
} from '@/types/asset-schedule.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export class AssetScheduleAPI {
  private static getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Create new asset schedule
   */
  static async createSchedule(
    data: CreateScheduleDto,
    token: string
  ): Promise<{ success: boolean; data: AssetSchedule; message: string }> {
    const response = await axios.post(
      `${API_URL}/asset-schedule`,
      data,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Get all schedules with filters
   */
  static async getSchedules(
    filters: ScheduleFilters,
    token: string
  ): Promise<{
    success: boolean
    data: AssetSchedule[]
    pagination: SchedulePagination
  }> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const response = await axios.get(
      `${API_URL}/asset-schedule?${params.toString()}`,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Get schedule by ID
   */
  static async getScheduleById(
    id: string,
    token: string
  ): Promise<{ success: boolean; data: AssetSchedule }> {
    const response = await axios.get(
      `${API_URL}/asset-schedule/${id}`,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Get upcoming schedules (next 24 hours)
   */
  static async getUpcomingSchedules(
    token: string
  ): Promise<{ success: boolean; data: AssetSchedule[]; total: number }> {
    const response = await axios.get(
      `${API_URL}/asset-schedule/upcoming/next-24h`,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Get schedule statistics
   */
  static async getStatistics(
    token: string
  ): Promise<{ success: boolean; data: ScheduleStats }> {
    const response = await axios.get(
      `${API_URL}/asset-schedule/stats/overview`,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Update schedule
   */
  static async updateSchedule(
    id: string,
    data: UpdateScheduleDto,
    token: string
  ): Promise<{ success: boolean; data: AssetSchedule; message: string }> {
    const response = await axios.put(
      `${API_URL}/asset-schedule/${id}`,
      data,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Cancel schedule
   */
  static async cancelSchedule(
    id: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axios.put(
      `${API_URL}/asset-schedule/${id}/cancel`,
      {},
      { headers: this.getHeaders(token) }
    )
    return response.data
  }

  /**
   * Delete schedule
   */
  static async deleteSchedule(
    id: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(
      `${API_URL}/asset-schedule/${id}`,
      { headers: this.getHeaders(token) }
    )
    return response.data
  }
}

export const assetScheduleAPI = AssetScheduleAPI