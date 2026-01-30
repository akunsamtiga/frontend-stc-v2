// store/asset-schedule.store.ts - CLEAN VERSION
'use client'

import { create } from 'zustand'
import type {
  AssetSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleFilters,
  ScheduleStats,
  SchedulePagination,
} from '@/types/asset-schedule.types'
import { assetScheduleAPI } from '@/lib/asset-schedule.api'
import { toast } from 'sonner'

interface AssetScheduleState {
  // Data
  schedules: AssetSchedule[]
  upcomingSchedules: AssetSchedule[]
  selectedSchedule: AssetSchedule | null
  stats: ScheduleStats | null
  pagination: SchedulePagination | null
  
  // Filters
  filters: ScheduleFilters
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Actions
  setFilters: (filters: Partial<ScheduleFilters>) => void
  resetFilters: () => void
  
  fetchSchedules: (token: string) => Promise<void>
  fetchUpcomingSchedules: (token: string) => Promise<void>
  fetchStatistics: (token: string) => Promise<void>
  fetchScheduleById: (id: string, token: string) => Promise<void>
  
  createSchedule: (data: CreateScheduleDto, token: string) => Promise<boolean>
  updateSchedule: (id: string, data: UpdateScheduleDto, token: string) => Promise<boolean>
  cancelSchedule: (id: string, token: string) => Promise<boolean>
  deleteSchedule: (id: string, token: string) => Promise<boolean>
  
  setSelectedSchedule: (schedule: AssetSchedule | null) => void
  clearState: () => void
}

const DEFAULT_FILTERS: ScheduleFilters = {
  page: 1,
  limit: 50,
}

export const useAssetScheduleStore = create<AssetScheduleState>()((set, get) => ({
  // Initial state
  schedules: [],
  upcomingSchedules: [],
  selectedSchedule: null,
  stats: null,
  pagination: null,
  filters: DEFAULT_FILTERS,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,

  // Filter actions
  setFilters: (newFilters) => {
    const current = get().filters
    const updated = { ...current, ...newFilters, page: 1 }
    
    // Prevent unnecessary updates
    if (JSON.stringify(current) === JSON.stringify(updated)) {
      return
    }
    
    set({ filters: updated })
  },

  resetFilters: () => {
    const current = get().filters
    
    if (JSON.stringify(current) === JSON.stringify(DEFAULT_FILTERS)) {
      return
    }
    
    set({ filters: DEFAULT_FILTERS })
  },

  // Fetch actions
  fetchSchedules: async (token) => {
    const { filters } = get()
    set({ isLoading: true })

    try {
      const response = await assetScheduleAPI.getSchedules(filters, token)
      
      set({
        schedules: response.data,
        pagination: response.pagination,
        isLoading: false,
      })
    } catch (error: any) {
      console.error('Failed to fetch schedules:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch schedules')
      set({ isLoading: false })
    }
  },

  fetchUpcomingSchedules: async (token) => {
    try {
      const response = await assetScheduleAPI.getUpcomingSchedules(token)
      set({ upcomingSchedules: response.data })
    } catch (error: any) {
      console.error('Failed to fetch upcoming schedules:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch upcoming schedules')
    }
  },

  fetchStatistics: async (token) => {
    try {
      const response = await assetScheduleAPI.getStatistics(token)
      set({ stats: response.data })
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch statistics')
    }
  },

  fetchScheduleById: async (id, token) => {
    set({ isLoading: true })

    try {
      const response = await assetScheduleAPI.getScheduleById(id, token)
      set({
        selectedSchedule: response.data,
        isLoading: false,
      })
    } catch (error: any) {
      console.error('Failed to fetch schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch schedule')
      set({ isLoading: false })
    }
  },

  // Create action
  createSchedule: async (data, token) => {
    set({ isCreating: true })

    try {
      const response = await assetScheduleAPI.createSchedule(data, token)
      
      toast.success(response.message || 'Schedule created successfully')
      
      // Refresh data
      await get().fetchSchedules(token)
      await get().fetchStatistics(token)
      
      set({ isCreating: false })
      return true
    } catch (error: any) {
      console.error('Failed to create schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to create schedule')
      set({ isCreating: false })
      return false
    }
  },

  // Update action
  updateSchedule: async (id, data, token) => {
    set({ isUpdating: true })

    try {
      const response = await assetScheduleAPI.updateSchedule(id, data, token)
      
      toast.success(response.message || 'Schedule updated successfully')
      
      // Refresh data
      await get().fetchSchedules(token)
      
      set({ isUpdating: false })
      return true
    } catch (error: any) {
      console.error('Failed to update schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to update schedule')
      set({ isUpdating: false })
      return false
    }
  },

  // Cancel action
  cancelSchedule: async (id, token) => {
    set({ isUpdating: true })

    try {
      const response = await assetScheduleAPI.cancelSchedule(id, token)
      
      toast.success(response.message || 'Schedule cancelled successfully')
      
      // Refresh data
      await get().fetchSchedules(token)
      await get().fetchStatistics(token)
      
      set({ isUpdating: false })
      return true
    } catch (error: any) {
      console.error('Failed to cancel schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to cancel schedule')
      set({ isUpdating: false })
      return false
    }
  },

  // Delete action
  deleteSchedule: async (id, token) => {
    set({ isDeleting: true })

    try {
      const response = await assetScheduleAPI.deleteSchedule(id, token)
      
      toast.success(response.message || 'Schedule deleted successfully')
      
      // Refresh data
      await get().fetchSchedules(token)
      await get().fetchStatistics(token)
      
      set({ isDeleting: false })
      return true
    } catch (error: any) {
      console.error('Failed to delete schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to delete schedule')
      set({ isDeleting: false })
      return false
    }
  },

  // Utility actions
  setSelectedSchedule: (schedule) => {
    set({ selectedSchedule: schedule })
  },

  clearState: () => {
    set({
      schedules: [],
      upcomingSchedules: [],
      selectedSchedule: null,
      stats: null,
      pagination: null,
      filters: DEFAULT_FILTERS,
    })
  },
}))

// Simple hooks - no shallow comparison needed
export const useSchedules = () => useAssetScheduleStore(state => state.schedules)
export const useUpcomingSchedules = () => useAssetScheduleStore(state => state.upcomingSchedules)
export const useScheduleStats = () => useAssetScheduleStore(state => state.stats)
export const useSchedulePagination = () => useAssetScheduleStore(state => state.pagination)
export const useScheduleFilters = () => useAssetScheduleStore(state => state.filters)

export const useScheduleLoading = () => {
  const isLoading = useAssetScheduleStore(state => state.isLoading)
  const isCreating = useAssetScheduleStore(state => state.isCreating)
  const isUpdating = useAssetScheduleStore(state => state.isUpdating)
  const isDeleting = useAssetScheduleStore(state => state.isDeleting)
  
  return { isLoading, isCreating, isUpdating, isDeleting }
}

export const useScheduleActions = () => {
  const setFilters = useAssetScheduleStore(state => state.setFilters)
  const resetFilters = useAssetScheduleStore(state => state.resetFilters)
  const fetchSchedules = useAssetScheduleStore(state => state.fetchSchedules)
  const fetchUpcomingSchedules = useAssetScheduleStore(state => state.fetchUpcomingSchedules)
  const fetchStatistics = useAssetScheduleStore(state => state.fetchStatistics)
  const createSchedule = useAssetScheduleStore(state => state.createSchedule)
  const updateSchedule = useAssetScheduleStore(state => state.updateSchedule)
  const cancelSchedule = useAssetScheduleStore(state => state.cancelSchedule)
  const deleteSchedule = useAssetScheduleStore(state => state.deleteSchedule)
  const setSelectedSchedule = useAssetScheduleStore(state => state.setSelectedSchedule)
  
  return {
    setFilters,
    resetFilters,
    fetchSchedules,
    fetchUpcomingSchedules,
    fetchStatistics,
    createSchedule,
    updateSchedule,
    cancelSchedule,
    deleteSchedule,
    setSelectedSchedule,
  }
}