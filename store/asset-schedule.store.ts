// store/asset-schedule.store.ts

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
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

export const useAssetScheduleStore = create<AssetScheduleState>()(
  devtools(
    (set, get) => ({
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
        set((state) => ({
          filters: { ...state.filters, ...newFilters, page: 1 }
        }), false, { type: 'setFilters' })
      },

      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS }, false, { type: 'resetFilters' })
      },

      // Fetch actions
      fetchSchedules: async (token) => {
        const { filters } = get()
        set({ isLoading: true }, false, { type: 'fetchSchedules/pending' })

        try {
          const response = await assetScheduleAPI.getSchedules(filters, token)
          
          set({
            schedules: response.data,
            pagination: response.pagination,
            isLoading: false,
          }, false, { type: 'fetchSchedules/fulfilled' })
        } catch (error: any) {
          console.error('Failed to fetch schedules:', error)
          toast.error(error.response?.data?.message || 'Failed to fetch schedules')
          set({ isLoading: false }, false, { type: 'fetchSchedules/rejected' })
        }
      },

      fetchUpcomingSchedules: async (token) => {
        try {
          const response = await assetScheduleAPI.getUpcomingSchedules(token)
          set({ upcomingSchedules: response.data }, false, { type: 'fetchUpcomingSchedules/fulfilled' })
        } catch (error: any) {
          console.error('Failed to fetch upcoming schedules:', error)
          toast.error(error.response?.data?.message || 'Failed to fetch upcoming schedules')
        }
      },

      fetchStatistics: async (token) => {
        try {
          const response = await assetScheduleAPI.getStatistics(token)
          set({ stats: response.data }, false, { type: 'fetchStatistics/fulfilled' })
        } catch (error: any) {
          console.error('Failed to fetch statistics:', error)
          toast.error(error.response?.data?.message || 'Failed to fetch statistics')
        }
      },

      fetchScheduleById: async (id, token) => {
        set({ isLoading: true }, false, { type: 'fetchScheduleById/pending' })

        try {
          const response = await assetScheduleAPI.getScheduleById(id, token)
          set({
            selectedSchedule: response.data,
            isLoading: false,
          }, false, { type: 'fetchScheduleById/fulfilled' })
        } catch (error: any) {
          console.error('Failed to fetch schedule:', error)
          toast.error(error.response?.data?.message || 'Failed to fetch schedule')
          set({ isLoading: false }, false, { type: 'fetchScheduleById/rejected' })
        }
      },

      // Create action
      createSchedule: async (data, token) => {
        set({ isCreating: true }, false, { type: 'createSchedule/pending' })

        try {
          const response = await assetScheduleAPI.createSchedule(data, token)
          
          toast.success(response.message || 'Schedule created successfully')
          
          // Refresh data
          await get().fetchSchedules(token)
          await get().fetchStatistics(token)
          
          set({ isCreating: false }, false, { type: 'createSchedule/fulfilled' })
          return true
        } catch (error: any) {
          console.error('Failed to create schedule:', error)
          toast.error(error.response?.data?.message || 'Failed to create schedule')
          set({ isCreating: false }, false, { type: 'createSchedule/rejected' })
          return false
        }
      },

      // Update action
      updateSchedule: async (id, data, token) => {
        set({ isUpdating: true }, false, { type: 'updateSchedule/pending' })

        try {
          const response = await assetScheduleAPI.updateSchedule(id, data, token)
          
          toast.success(response.message || 'Schedule updated successfully')
          
          // Refresh data
          await get().fetchSchedules(token)
          
          set({ isUpdating: false }, false, { type: 'updateSchedule/fulfilled' })
          return true
        } catch (error: any) {
          console.error('Failed to update schedule:', error)
          toast.error(error.response?.data?.message || 'Failed to update schedule')
          set({ isUpdating: false }, false, { type: 'updateSchedule/rejected' })
          return false
        }
      },

      // Cancel action
      cancelSchedule: async (id, token) => {
        set({ isUpdating: true }, false, { type: 'cancelSchedule/pending' })

        try {
          const response = await assetScheduleAPI.cancelSchedule(id, token)
          
          toast.success(response.message || 'Schedule cancelled successfully')
          
          // Refresh data
          await get().fetchSchedules(token)
          await get().fetchStatistics(token)
          
          set({ isUpdating: false }, false, { type: 'cancelSchedule/fulfilled' })
          return true
        } catch (error: any) {
          console.error('Failed to cancel schedule:', error)
          toast.error(error.response?.data?.message || 'Failed to cancel schedule')
          set({ isUpdating: false }, false, { type: 'cancelSchedule/rejected' })
          return false
        }
      },

      // Delete action
      deleteSchedule: async (id, token) => {
        set({ isDeleting: true }, false, { type: 'deleteSchedule/pending' })

        try {
          const response = await assetScheduleAPI.deleteSchedule(id, token)
          
          toast.success(response.message || 'Schedule deleted successfully')
          
          // Refresh data
          await get().fetchSchedules(token)
          await get().fetchStatistics(token)
          
          set({ isDeleting: false }, false, { type: 'deleteSchedule/fulfilled' })
          return true
        } catch (error: any) {
          console.error('Failed to delete schedule:', error)
          toast.error(error.response?.data?.message || 'Failed to delete schedule')
          set({ isDeleting: false }, false, { type: 'deleteSchedule/rejected' })
          return false
        }
      },

      // Utility actions
      setSelectedSchedule: (schedule) => {
        set({ selectedSchedule: schedule }, false, { type: 'setSelectedSchedule' })
      },

      clearState: () => {
        set({
          schedules: [],
          upcomingSchedules: [],
          selectedSchedule: null,
          stats: null,
          pagination: null,
          filters: DEFAULT_FILTERS,
        }, false, { type: 'clearState' })
      },
    }),
    { name: 'AssetScheduleStore' }
  )
)

// Hooks
export const useSchedules = () => useAssetScheduleStore(state => state.schedules)
export const useUpcomingSchedules = () => useAssetScheduleStore(state => state.upcomingSchedules)
export const useScheduleStats = () => useAssetScheduleStore(state => state.stats)
export const useSchedulePagination = () => useAssetScheduleStore(state => state.pagination)
export const useScheduleFilters = () => useAssetScheduleStore(state => state.filters)
export const useScheduleLoading = () => useAssetScheduleStore(state => ({
  isLoading: state.isLoading,
  isCreating: state.isCreating,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting,
}))

export const useScheduleActions = () => {
  const store = useAssetScheduleStore()
  return {
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    fetchSchedules: store.fetchSchedules,
    fetchUpcomingSchedules: store.fetchUpcomingSchedules,
    fetchStatistics: store.fetchStatistics,
    createSchedule: store.createSchedule,
    updateSchedule: store.updateSchedule,
    cancelSchedule: store.cancelSchedule,
    deleteSchedule: store.deleteSchedule,
    setSelectedSchedule: store.setSelectedSchedule,
  }
}