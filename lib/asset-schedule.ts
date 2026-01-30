// lib/asset-schedule.ts - Asset Schedule Utility Functions

import type {
  AssetSchedule,
  AssetScheduleTrend,
  AssetScheduleStatus,
  AssetScheduleTimeframe,
} from '@/types'

/**
 * Format scheduled time to readable format
 */
export function formatScheduledTime(scheduledTime: string): string {
  const date = new Date(scheduledTime)
  
  return date.toLocaleString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

/**
 * Format scheduled time to short format (date only)
 */
export function formatScheduledDate(scheduledTime: string): string {
  const date = new Date(scheduledTime)
  
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

/**
 * Format scheduled time to time only
 */
export function formatScheduledTimeOnly(scheduledTime: string): string {
  const date = new Date(scheduledTime)
  
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

/**
 * Get time until scheduled execution
 */
export function getTimeUntilExecution(scheduledTime: string): {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
  formatted: string
} {
  const now = new Date()
  const scheduled = new Date(scheduledTime)
  const diff = scheduled.getTime() - now.getTime()
  
  const isPast = diff < 0
  const absDiff = Math.abs(diff)
  
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000)
  
  let formatted = ''
  if (isPast) {
    formatted = 'Passed'
  } else if (days > 0) {
    formatted = `${days}d ${hours}h`
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`
  } else {
    formatted = `${seconds}s`
  }
  
  return {
    total: diff,
    days,
    hours,
    minutes,
    seconds,
    isPast,
    formatted,
  }
}

/**
 * Check if schedule is upcoming (future)
 */
export function isScheduleUpcoming(scheduledTime: string): boolean {
  return new Date(scheduledTime) > new Date()
}

/**
 * Check if schedule is past
 */
export function isSchedulePast(scheduledTime: string): boolean {
  return new Date(scheduledTime) < new Date()
}

/**
 * Check if schedule is soon (within 1 hour)
 */
export function isScheduleSoon(scheduledTime: string): boolean {
  const diff = new Date(scheduledTime).getTime() - new Date().getTime()
  return diff > 0 && diff <= 60 * 60 * 1000 // 1 hour
}

/**
 * Check if schedule is today
 */
export function isScheduleToday(scheduledTime: string): boolean {
  const scheduled = new Date(scheduledTime)
  const today = new Date()
  
  return (
    scheduled.getDate() === today.getDate() &&
    scheduled.getMonth() === today.getMonth() &&
    scheduled.getFullYear() === today.getFullYear()
  )
}

/**
 * Get schedule status badge info
 */
export function getStatusBadgeInfo(status: AssetScheduleStatus): {
  label: string
  icon: string
  className: string
} {
  const statusMap = {
    pending: {
      label: 'Pending',
      icon: '⏳',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    executed: {
      label: 'Executed',
      icon: '✅',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    failed: {
      label: 'Failed',
      icon: '❌',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    cancelled: {
      label: 'Cancelled',
      icon: '🚫',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
  }
  
  return statusMap[status] || statusMap.pending
}

/**
 * Get trend badge info
 */
export function getTrendBadgeInfo(trend: AssetScheduleTrend): {
  label: string
  icon: string
  className: string
} {
  const trendMap = {
    buy: {
      label: 'Buy (Naik)',
      icon: '📈',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    sell: {
      label: 'Sell (Turun)',
      icon: '📉',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
  }
  
  return trendMap[trend]
}

/**
 * Get timeframe label
 */
export function getTimeframeLabel(timeframe: AssetScheduleTimeframe): string {
  const timeframeMap: Record<AssetScheduleTimeframe, string> = {
    '1m': '1 Minute',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '30m': '30 Minutes',
    '1h': '1 Hour',
    '4h': '4 Hours',
    '1d': '1 Day',
  }
  
  return timeframeMap[timeframe] || timeframe
}

/**
 * Validate schedule data
 */
export function validateScheduleData(data: {
  assetSymbol: string
  scheduledTime: string
  trend: string
  timeframe: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validate asset symbol
  if (!data.assetSymbol || data.assetSymbol.trim().length === 0) {
    errors.push('Asset symbol is required')
  }
  
  // Validate scheduled time
  if (!data.scheduledTime) {
    errors.push('Scheduled time is required')
  } else {
    const scheduledDate = new Date(data.scheduledTime)
    const now = new Date()
    
    if (isNaN(scheduledDate.getTime())) {
      errors.push('Invalid scheduled time format')
    } else if (scheduledDate <= now) {
      errors.push('Scheduled time must be in the future')
    }
  }
  
  // Validate trend
  if (!data.trend || !['buy', 'sell'].includes(data.trend)) {
    errors.push('Invalid trend. Must be "buy" or "sell"')
  }
  
  // Validate timeframe
  const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
  if (!data.timeframe || !validTimeframes.includes(data.timeframe)) {
    errors.push('Invalid timeframe')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if schedule can be edited
 */
export function canEditSchedule(schedule: AssetSchedule): boolean {
  return schedule.status === 'pending' && isScheduleUpcoming(schedule.scheduledTime)
}

/**
 * Check if schedule can be cancelled
 */
export function canCancelSchedule(schedule: AssetSchedule): boolean {
  return schedule.status === 'pending' && isScheduleUpcoming(schedule.scheduledTime)
}

/**
 * Check if schedule can be executed manually
 */
export function canExecuteSchedule(schedule: AssetSchedule): boolean {
  return schedule.status === 'pending' && schedule.isActive
}

/**
 * Check if schedule can be deleted
 */
export function canDeleteSchedule(schedule: AssetSchedule): boolean {
  return schedule.status !== 'executed' || isSchedulePast(schedule.scheduledTime)
}

/**
 * Format execution details
 */
export function formatExecutionDetails(
  executionDetails?: AssetSchedule['executionDetails']
): string {
  if (!executionDetails) return 'No execution details'
  
  const parts: string[] = []
  
  if (executionDetails.startPrice !== undefined) {
    parts.push(`Start: $${executionDetails.startPrice.toFixed(2)}`)
  }
  
  if (executionDetails.endPrice !== undefined) {
    parts.push(`End: $${executionDetails.endPrice.toFixed(2)}`)
  }
  
  if (executionDetails.priceChange !== undefined) {
    const sign = executionDetails.priceChange >= 0 ? '+' : ''
    parts.push(`Change: ${sign}${executionDetails.priceChange.toFixed(2)}%`)
  }
  
  if (executionDetails.errorMessage) {
    parts.push(`Error: ${executionDetails.errorMessage}`)
  }
  
  return parts.length > 0 ? parts.join(' | ') : 'Executed successfully'
}

/**
 * Sort schedules by scheduled time
 */
export function sortSchedulesByTime(
  schedules: AssetSchedule[],
  order: 'asc' | 'desc' = 'asc'
): AssetSchedule[] {
  return [...schedules].sort((a, b) => {
    const timeA = new Date(a.scheduledTime).getTime()
    const timeB = new Date(b.scheduledTime).getTime()
    return order === 'asc' ? timeA - timeB : timeB - timeA
  })
}

/**
 * Group schedules by status
 */
export function groupSchedulesByStatus(schedules: AssetSchedule[]): {
  pending: AssetSchedule[]
  executed: AssetSchedule[]
  failed: AssetSchedule[]
  cancelled: AssetSchedule[]
} {
  return {
    pending: schedules.filter((s) => s.status === 'pending'),
    executed: schedules.filter((s) => s.status === 'executed'),
    failed: schedules.filter((s) => s.status === 'failed'),
    cancelled: schedules.filter((s) => s.status === 'cancelled'),
  }
}

/**
 * Group schedules by asset
 */
export function groupSchedulesByAsset(schedules: AssetSchedule[]): Record<string, AssetSchedule[]> {
  return schedules.reduce((acc, schedule) => {
    if (!acc[schedule.assetSymbol]) {
      acc[schedule.assetSymbol] = []
    }
    acc[schedule.assetSymbol].push(schedule)
    return acc
  }, {} as Record<string, AssetSchedule[]>)
}

/**
 * Filter upcoming schedules
 */
export function filterUpcomingSchedules(schedules: AssetSchedule[]): AssetSchedule[] {
  return schedules.filter(
    (s) => s.status === 'pending' && isScheduleUpcoming(s.scheduledTime)
  )
}

/**
 * Filter schedules for today
 */
export function filterTodaySchedules(schedules: AssetSchedule[]): AssetSchedule[] {
  return schedules.filter((s) => isScheduleToday(s.scheduledTime))
}

/**
 * Get schedule priority (for sorting by urgency)
 */
export function getSchedulePriority(schedule: AssetSchedule): number {
  if (schedule.status !== 'pending') return 999
  if (!isScheduleUpcoming(schedule.scheduledTime)) return 998
  
  const timeUntil = getTimeUntilExecution(schedule.scheduledTime)
  
  // Priority based on time remaining (sooner = higher priority)
  if (timeUntil.total < 5 * 60 * 1000) return 1 // < 5 minutes
  if (timeUntil.total < 30 * 60 * 1000) return 2 // < 30 minutes
  if (timeUntil.total < 60 * 60 * 1000) return 3 // < 1 hour
  if (timeUntil.total < 6 * 60 * 60 * 1000) return 4 // < 6 hours
  if (timeUntil.total < 24 * 60 * 60 * 1000) return 5 // < 24 hours
  
  return 6 // > 24 hours
}

/**
 * Sort schedules by priority
 */
export function sortSchedulesByPriority(schedules: AssetSchedule[]): AssetSchedule[] {
  return [...schedules].sort((a, b) => {
    const priorityA = getSchedulePriority(a)
    const priorityB = getSchedulePriority(b)
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Same priority, sort by scheduled time
    return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  })
}

/**
 * Get schedule countdown timer data
 */
export function getScheduleCountdown(scheduledTime: string): {
  isActive: boolean
  display: string
  percentage: number
  urgency: 'critical' | 'warning' | 'normal' | 'low'
} {
  const timeUntil = getTimeUntilExecution(scheduledTime)
  
  if (timeUntil.isPast) {
    return {
      isActive: false,
      display: 'Passed',
      percentage: 100,
      urgency: 'low',
    }
  }
  
  const totalMs = timeUntil.total
  const oneHourMs = 60 * 60 * 1000
  
  let urgency: 'critical' | 'warning' | 'normal' | 'low'
  let percentage: number
  
  if (totalMs < 5 * 60 * 1000) {
    // < 5 minutes
    urgency = 'critical'
    percentage = 100
  } else if (totalMs < 30 * 60 * 1000) {
    // < 30 minutes
    urgency = 'warning'
    percentage = 75
  } else if (totalMs < oneHourMs) {
    // < 1 hour
    urgency = 'normal'
    percentage = 50
  } else {
    urgency = 'low'
    percentage = 25
  }
  
  return {
    isActive: true,
    display: timeUntil.formatted,
    percentage,
    urgency,
  }
}

/**
 * Export schedule to CSV format
 */
export function exportSchedulesToCSV(schedules: AssetSchedule[]): string {
  const headers = [
    'ID',
    'Asset Symbol',
    'Scheduled Time',
    'Trend',
    'Timeframe',
    'Status',
    'Is Active',
    'Notes',
    'Created By',
    'Created At',
  ]
  
  const rows = schedules.map((schedule) => [
    schedule.id,
    schedule.assetSymbol,
    formatScheduledTime(schedule.scheduledTime),
    getTrendBadgeInfo(schedule.trend).label,
    getTimeframeLabel(schedule.timeframe),
    getStatusBadgeInfo(schedule.status).label,
    schedule.isActive ? 'Yes' : 'No',
    schedule.notes || '-',
    schedule.createdByEmail,
    formatScheduledTime(schedule.createdAt),
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')
  
  return csv
}

/**
 * Download schedules as CSV file
 */
export function downloadSchedulesCSV(schedules: AssetSchedule[], filename = 'schedules.csv') {
  const csv = exportSchedulesToCSV(schedules)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}