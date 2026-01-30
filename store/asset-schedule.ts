// store/asset-schedule.ts - Asset Schedule State Management

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  AssetSchedule,
  CreateAssetScheduleRequest,
  UpdateAssetScheduleRequest,
  GetAssetSchedulesQuery,
  AssetSchedulePagination,
  AssetScheduleStatistics,
} from '@/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface AssetScheduleState {
  // Data
  schedules: AssetSchedule[]
  currentSchedule: AssetSchedule | null
  upcomingSchedules: AssetSchedule[]
  statistics: AssetScheduleStatistics | null
  pagination: AssetSchedulePagination | null
  
  // Loading states
  loading: boolean
  loadingUpcoming: boolean
  loadingStats: boolean
  submitting: boolean
  
  // Filter states
  filters: GetAssetSchedulesQuery
  
  // Actions - Fetch
  fetchSchedules: (query?: GetAssetSchedulesQuery) => Promise<void>
  fetchScheduleById: (id: string) => Promise<void>
  fetchUpcomingSchedules: () => Promise<void>
  fetchSchedulesByAsset: (assetSymbol: string) => Promise<void>
  fetchStatistics: () => Promise<void>
  
  // Actions - Mutations
  createSchedule: (data: CreateAssetScheduleRequest) => Promise<AssetSchedule | null>
  updateSchedule: (id: string, data: UpdateAssetScheduleRequest) => Promise<AssetSchedule | null>
  cancelSchedule: (id: string) => Promise<boolean>
  deleteSchedule: (id: string) => Promise<boolean>
  executeScheduleNow: (id: string) => Promise<boolean>
  toggleScheduleStatus: (id: string, isActive: boolean) => Promise<boolean>
  
  // Actions - Bulk Operations
  bulkCancelSchedules: (ids: string[]) => Promise<boolean>
  bulkDeleteSchedules: (ids: string[]) => Promise<boolean>
  bulkUpdateStatus: (ids: string[], isActive: boolean) => Promise<boolean>
  
  // Actions - Filters & UI
  setFilters: (filters: Partial<GetAssetSchedulesQuery>) => void
  clearFilters: () => void
  setCurrentSchedule: (schedule: AssetSchedule | null) => void
  clearCache: () => void
}

const defaultFilters: GetAssetSchedulesQuery = {
  page: 1,
  limit: 50,
  sortBy: 'scheduledTime',
  sortOrder: 'asc',
}

export const useAssetScheduleStore = create<AssetScheduleState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        schedules: [],
        currentSchedule: null,
        upcomingSchedules: [],
        statistics: null,
        pagination: null,
        loading: false,
        loadingUpcoming: false,
        loadingStats: false,
        submitting: false,
        filters: defaultFilters,

        // ============================================
        // FETCH OPERATIONS
        // ============================================

        fetchSchedules: async (query?: GetAssetSchedulesQuery) => {
          set({ loading: true })
          
          try {
            const mergedQuery = { ...get().filters, ...query }
            const response = await api.getAssetSchedules(mergedQuery)
            
            if (response.data) {
              set({
                schedules: response.data.data || [],
                pagination: response.data.pagination || null,
                filters: mergedQuery,
                loading: false,
              })
            }
          } catch (error: any) {
            console.error('Failed to fetch schedules:', error)
            toast.error('Failed to load schedules')
            set({ loading: false })
          }
        },

        fetchScheduleById: async (id: string) => {
          set({ loading: true })
          
          try {
            const response = await api.getAssetScheduleById(id)
            
            if (response.data) {
              set({
                currentSchedule: response.data,
                loading: false,
              })
            }
          } catch (error: any) {
            console.error('Failed to fetch schedule:', error)
            toast.error('Failed to load schedule details')
            set({ loading: false })
          }
        },

        fetchUpcomingSchedules: async () => {
          set({ loadingUpcoming: true })
          
          try {
            const response = await api.getUpcomingAssetSchedules()
            
            if (response.data) {
              set({
                upcomingSchedules: response.data,
                loadingUpcoming: false,
              })
            }
          } catch (error: any) {
            console.error('Failed to fetch upcoming schedules:', error)
            set({ loadingUpcoming: false })
          }
        },

        fetchSchedulesByAsset: async (assetSymbol: string) => {
          set({ loading: true })
          
          try {
            const response = await api.getAssetSchedulesByAsset(assetSymbol)
            
            if (response.data) {
              set({
                schedules: response.data,
                loading: false,
              })
            }
          } catch (error: any) {
            console.error('Failed to fetch schedules by asset:', error)
            toast.error('Failed to load asset schedules')
            set({ loading: false })
          }
        },

        fetchStatistics: async () => {
          set({ loadingStats: true })
          
          try {
            const response = await api.getAssetScheduleStatistics()
            
            if (response.data) {
              set({
                statistics: response.data,
                loadingStats: false,
              })
            }
          } catch (error: any) {
            console.error('Failed to fetch statistics:', error)
            set({ loadingStats: false })
          }
        },

        // ============================================
        // MUTATION OPERATIONS
        // ============================================

        createSchedule: async (data: CreateAssetScheduleRequest) => {
          set({ submitting: true })
          
          try {
            const response = await api.createAssetSchedule(data)
            
            if (response.data) {
              toast.success('Schedule created successfully')
              set({ submitting: false })
              
              // Refresh data
              await get().fetchSchedules()
              await get().fetchUpcomingSchedules()
              await get().fetchStatistics()
              
              return response.data
            }
            
            set({ submitting: false })
            return null
          } catch (error: any) {
            console.error('Failed to create schedule:', error)
            toast.error(error.response?.data?.message || 'Failed to create schedule')
            set({ submitting: false })
            return null
          }
        },

        updateSchedule: async (id: string, data: UpdateAssetScheduleRequest) => {
          set({ submitting: true })
          
          try {
            const response = await api.updateAssetSchedule(id, data)
            
            if (response.data) {
              toast.success('Schedule updated successfully')
              set({ submitting: false })
              
              // Refresh data
              await get().fetchSchedules()
              await get().fetchUpcomingSchedules()
              
              return response.data
            }
            
            set({ submitting: false })
            return null
          } catch (error: any) {
            console.error('Failed to update schedule:', error)
            toast.error(error.response?.data?.message || 'Failed to update schedule')
            set({ submitting: false })
            return null
          }
        },

        cancelSchedule: async (id: string) => {
          set({ submitting: true })
          
          try {
            await api.cancelAssetSchedule(id)
            toast.success('Schedule cancelled successfully')
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            await get().fetchStatistics()
            
            return true
          } catch (error: any) {
            console.error('Failed to cancel schedule:', error)
            toast.error(error.response?.data?.message || 'Failed to cancel schedule')
            set({ submitting: false })
            return false
          }
        },

        deleteSchedule: async (id: string) => {
          set({ submitting: true })
          
          try {
            await api.deleteAssetSchedule(id)
            toast.success('Schedule deleted successfully')
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            await get().fetchStatistics()
            
            return true
          } catch (error: any) {
            console.error('Failed to delete schedule:', error)
            toast.error(error.response?.data?.message || 'Failed to delete schedule')
            set({ submitting: false })
            return false
          }
        },

        executeScheduleNow: async (id: string) => {
          set({ submitting: true })
          
          try {
            await api.executeAssetScheduleNow(id)
            toast.success('Schedule executed successfully')
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            await get().fetchStatistics()
            
            return true
          } catch (error: any) {
            console.error('Failed to execute schedule:', error)
            toast.error(error.response?.data?.message || 'Failed to execute schedule')
            set({ submitting: false })
            return false
          }
        },

        toggleScheduleStatus: async (id: string, isActive: boolean) => {
          set({ submitting: true })
          
          try {
            await api.toggleAssetScheduleStatus(id, isActive)
            toast.success(`Schedule ${isActive ? 'activated' : 'deactivated'} successfully`)
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            
            return true
          } catch (error: any) {
            console.error('Failed to toggle schedule status:', error)
            toast.error(error.response?.data?.message || 'Failed to update schedule status')
            set({ submitting: false })
            return false
          }
        },

        // ============================================
        // BULK OPERATIONS
        // ============================================

        bulkCancelSchedules: async (ids: string[]) => {
          set({ submitting: true })
          
          try {
            await api.bulkCancelAssetSchedules(ids)
            toast.success(`${ids.length} schedule(s) cancelled successfully`)
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            await get().fetchStatistics()
            
            return true
          } catch (error: any) {
            console.error('Failed to cancel schedules:', error)
            toast.error(error.response?.data?.message || 'Failed to cancel schedules')
            set({ submitting: false })
            return false
          }
        },

        bulkDeleteSchedules: async (ids: string[]) => {
          set({ submitting: true })
          
          try {
            await api.bulkDeleteAssetSchedules(ids)
            toast.success(`${ids.length} schedule(s) deleted successfully`)
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            await get().fetchStatistics()
            
            return true
          } catch (error: any) {
            console.error('Failed to delete schedules:', error)
            toast.error(error.response?.data?.message || 'Failed to delete schedules')
            set({ submitting: false })
            return false
          }
        },

        bulkUpdateStatus: async (ids: string[], isActive: boolean) => {
          set({ submitting: true })
          
          try {
            await api.bulkUpdateAssetScheduleStatus(ids, isActive)
            toast.success(`${ids.length} schedule(s) updated successfully`)
            set({ submitting: false })
            
            // Refresh data
            await get().fetchSchedules()
            await get().fetchUpcomingSchedules()
            
            return true
          } catch (error: any) {
            console.error('Failed to update schedules:', error)
            toast.error(error.response?.data?.message || 'Failed to update schedules')
            set({ submitting: false })
            return false
          }
        },

        // ============================================
        // FILTER & UI OPERATIONS
        // ============================================

        setFilters: (filters: Partial<GetAssetSchedulesQuery>) => {
          set((state) => ({
            filters: { ...state.filters, ...filters }
          }))
        },

        clearFilters: () => {
          set({ filters: defaultFilters })
        },

        setCurrentSchedule: (schedule: AssetSchedule | null) => {
          set({ currentSchedule: schedule })
        },

        clearCache: () => {
          set({
            schedules: [],
            currentSchedule: null,
            upcomingSchedules: [],
            statistics: null,
            pagination: null,
          })
        },
      }),
      {
        name: 'asset-schedule-storage',
        partialize: (state) => ({
          filters: state.filters,
        })
      }
    ),
    { name: 'AssetScheduleStore' }
  )
)

// Selectors
export const useSchedules = () => useAssetScheduleStore((state) => state.schedules)
export const useCurrentSchedule = () => useAssetScheduleStore((state) => state.currentSchedule)
export const useUpcomingSchedules = () => useAssetScheduleStore((state) => state.upcomingSchedules)
export const useScheduleStatistics = () => useAssetScheduleStore((state) => state.statistics)
export const useSchedulePagination = () => useAssetScheduleStore((state) => state.pagination)
export const useScheduleLoading = () => useAssetScheduleStore((state) => state.loading)
export const useScheduleSubmitting = () => useAssetScheduleStore((state) => state.submitting)
export const useScheduleFilters = () => useAssetScheduleStore((state) => state.filters)

// Actions selectors
export const useAssetScheduleActions = () => {
  const store = useAssetScheduleStore()
  return {
    fetchSchedules: store.fetchSchedules,
    fetchScheduleById: store.fetchScheduleById,
    fetchUpcomingSchedules: store.fetchUpcomingSchedules,
    fetchSchedulesByAsset: store.fetchSchedulesByAsset,
    fetchStatistics: store.fetchStatistics,
    createSchedule: store.createSchedule,
    updateSchedule: store.updateSchedule,
    cancelSchedule: store.cancelSchedule,
    deleteSchedule: store.deleteSchedule,
    executeScheduleNow: store.executeScheduleNow,
    toggleScheduleStatus: store.toggleScheduleStatus,
    bulkCancelSchedules: store.bulkCancelSchedules,
    bulkDeleteSchedules: store.bulkDeleteSchedules,
    bulkUpdateStatus: store.bulkUpdateStatus,
    setFilters: store.setFilters,
    clearFilters: store.clearFilters,
    setCurrentSchedule: store.setCurrentSchedule,
    clearCache: store.clearCache,
  }
}