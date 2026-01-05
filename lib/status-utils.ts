// lib/status-utils.ts - STATUS HELPER FUNCTIONS (FIXED)
import { UserStatus, STATUS_CONFIG } from '@/types'

export function getStatusConfig(status: UserStatus) {
  return STATUS_CONFIG[status]
}

export function getStatusLabel(status: UserStatus): string {
  return STATUS_CONFIG[status].label
}

export function getStatusColor(status: UserStatus): string {
  const colors = {
    standard: 'gray',
    gold: 'yellow',
    vip: 'purple'
  }
  return colors[status]
}

export function getStatusGradient(status: UserStatus): string {
  const gradients = {
    standard: 'from-gray-400 to-gray-500',
    gold: 'from-yellow-400 to-orange-500',
    vip: 'from-purple-500 to-pink-500'
  }
  return gradients[status]
}

export function getStatusBgClass(status: UserStatus): string {
  const classes = {
    standard: 'bg-gray-100 text-gray-700 border-gray-200',
    gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    vip: 'bg-purple-100 text-purple-700 border-purple-200'
  }
  return classes[status]
}

export function getStatusIcon(status: UserStatus): string {
  return STATUS_CONFIG[status].icon
}

export function getStatusProfitBonus(status: UserStatus): number {
  return STATUS_CONFIG[status].profitBonus
}

export function calculateStatusProgress(totalDeposit: number, currentStatus: UserStatus): {
  current: UserStatus
  next: UserStatus | null
  progress: number
  depositNeeded: number
} {
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']
  const currentIndex = statuses.indexOf(currentStatus)
  
  if (currentIndex === statuses.length - 1) {
    // Already VIP
    return {
      current: currentStatus,
      next: null,
      progress: 100,
      depositNeeded: 0
    }
  }
  
  const nextStatus = statuses[currentIndex + 1]
  const currentConfig = STATUS_CONFIG[currentStatus]
  const nextConfig = STATUS_CONFIG[nextStatus]
  
  const rangeStart = currentConfig.minDeposit
  const rangeEnd = nextConfig.minDeposit
  const progress = Math.min(100, Math.floor(((totalDeposit - rangeStart) / (rangeEnd - rangeStart)) * 100))
  const depositNeeded = Math.max(0, rangeEnd - totalDeposit)
  
  return {
    current: currentStatus,
    next: nextStatus,
    progress,
    depositNeeded
  }
}

export function formatStatusInfo(statusInfo: {
  current: UserStatus
  totalDeposit: number
  profitBonus: number
  nextStatus?: UserStatus | null
  progress: number
  depositNeeded?: number
}): string {
  const config = STATUS_CONFIG[statusInfo.current]
  let info = `${config.label} Status (+${statusInfo.profitBonus}% bonus)`
  
  if (statusInfo.nextStatus) {
    info += ` • ${statusInfo.progress}% to ${STATUS_CONFIG[statusInfo.nextStatus].label}`
  } else {
    info += ' • MAX TIER'
  }
  
  return info
}

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

// ✅ FIXED: Remove explicit return type to let TypeScript infer
export function getAllStatusTiers() {
  return (['standard', 'gold', 'vip'] as UserStatus[]).map(status => ({
    status,
    config: STATUS_CONFIG[status]
  }))
}