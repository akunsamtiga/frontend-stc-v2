// lib/status-utils.ts - FIXED VERSION
// ✅ Returns React Components, not strings

import { UserStatus, STATUS_CONFIG } from '@/types'
import { User, Award, Crown, LucideIcon } from 'lucide-react'

/**
 * Get status configuration
 */
export function getStatusConfig(status: UserStatus) {
  return STATUS_CONFIG[status]
}

/**
 * Get status label (string)
 */
export function getStatusLabel(status: UserStatus): string {
  return STATUS_CONFIG[status].label
}

/**
 * Get status color name (string)
 */
export function getStatusColor(status: UserStatus): string {
  const colors = {
    standard: 'gray',
    gold: 'yellow',
    vip: 'purple'
  }
  return colors[status]
}

/**
 * Get Tailwind gradient classes (string)
 */
export function getStatusGradient(status: UserStatus): string {
  const gradients = {
    standard: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-orange-600',
    vip: 'from-purple-400 to-pink-600'
  }
  return gradients[status]
}

/**
 * Get Tailwind background classes (string)
 */
export function getStatusBgClass(status: UserStatus): string {
  const classes = {
    standard: 'bg-gray-100 text-gray-700 border-gray-200',
    gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    vip: 'bg-purple-100 text-purple-700 border-purple-200'
  }
  return classes[status]
}

/**
 * ✅ CRITICAL: Returns React component class (LucideIcon)
 * NOT a string - this is a React component you can render
 */
export function getStatusIcon(status: UserStatus): LucideIcon {
  const icons: Record<UserStatus, LucideIcon> = {
    standard: User,
    gold: Award,
    vip: Crown
  }
  return icons[status]
}

/**
 * Get profit bonus percentage
 */
export function getStatusProfitBonus(status: UserStatus): number {
  return STATUS_CONFIG[status].profitBonus
}

/**
 * Calculate status progress
 */
export function calculateStatusProgress(
  totalDeposit: number, 
  currentStatus: UserStatus
) {
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']
  
  // Validasi dan fallback
  let validatedCurrent = currentStatus
  if (!statuses.includes(currentStatus)) {
    console.warn('Invalid currentStatus:', currentStatus, 'using standard')
    validatedCurrent = 'standard'
  }
  
  const currentIndex = statuses.indexOf(validatedCurrent)
  
  if (currentIndex === statuses.length - 1) {
    return {
      current: validatedCurrent,
      next: null,
      progress: 100,
      depositNeeded: 0
    }
  }
  
  const nextStatus = statuses[currentIndex + 1]
  const currentConfig = STATUS_CONFIG[validatedCurrent]
  const nextConfig = STATUS_CONFIG[nextStatus]
  
  const rangeStart = currentConfig.minDeposit
  const rangeEnd = nextConfig.minDeposit
  const progress = Math.min(100, Math.floor(((totalDeposit - rangeStart) / (rangeEnd - rangeStart)) * 100))
  const depositNeeded = Math.max(0, rangeEnd - totalDeposit)
  
  return {
    current: validatedCurrent,
    next: nextStatus,
    progress,
    depositNeeded
  }
}

/**
 * Format status information to readable string
 * ✅ FIXED: Only show MAX TIER for VIP status
 */
export function formatStatusInfo(statusInfo: {
  current: UserStatus
  totalDeposit: number
  profitBonus: number
  nextStatus?: UserStatus | null
  progress: number
  depositNeeded?: number
}): string {
  // Fallback ke 'standard' jika status tidak valid
  const config = STATUS_CONFIG[statusInfo.current] || STATUS_CONFIG.standard
  
  let info = `${config.label} Status (${statusInfo.profitBonus} bonus)`
  
  // ✅ FIX: Only show MAX TIER if current status is VIP
  if (statusInfo.current === 'vip') {
    info += ' • MAX TIER'
  } else if (statusInfo.nextStatus && STATUS_CONFIG[statusInfo.nextStatus]) {
    info += ` • ${statusInfo.progress}% to ${STATUS_CONFIG[statusInfo.nextStatus].label}`
  }
  
  return info
}

/**
 * Get status tier information
 */
export function getStatusTierInfo(status: UserStatus): {
  tier: number
  totalTiers: number
  isMax: boolean
} {
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']
  const tier = statuses.indexOf(status) + 1
  
  return {
    tier,
    totalTiers: statuses.length,
    isMax: tier === statuses.length
  }
}

/**
 * Get all status tiers with their configurations
 */
export function getAllStatusTiers() {
  return (['standard', 'gold', 'vip'] as UserStatus[]).map(status => ({
    status,
    config: STATUS_CONFIG[status],
    icon: getStatusIcon(status) // React component
  }))
}

/**
 * Format currency for deposit requirements
 */
export function formatDepositRequirement(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get status color for progress bar
 */
export function getStatusProgressColor(status: UserStatus): string {
  const colors = {
    standard: '#6B7280', // gray-500
    gold: '#F59E0B',     // amber-500
    vip: '#8B5CF6'       // purple-500
  }
  return colors[status]
}

/**
 * Check if user can upgrade status
 */
export function canUpgradeStatus(
  currentStatus: UserStatus, 
  totalDeposit: number
): boolean {
  if (currentStatus === 'vip') return false
  
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']
  const currentIndex = statuses.indexOf(currentStatus)
  const nextStatus = statuses[currentIndex + 1]
  const nextConfig = STATUS_CONFIG[nextStatus]
  
  return totalDeposit >= nextConfig.minDeposit
}

/**
 * Get next status info
 */
export function getNextStatusInfo(currentStatus: UserStatus): {
  status: UserStatus | null
  depositRequired: number
  profitBonus: number
} | null {
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']
  const currentIndex = statuses.indexOf(currentStatus)
  
  if (currentIndex === statuses.length - 1) {
    return null // Already max tier
  }
  
  const nextStatus = statuses[currentIndex + 1]
  const nextConfig = STATUS_CONFIG[nextStatus]
  
  return {
    status: nextStatus,
    depositRequired: nextConfig.minDeposit,
    profitBonus: nextConfig.profitBonus
  }
}