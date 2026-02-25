// lib/status-utils.ts 

import { UserStatus, STATUS_CONFIG } from '@/types'
import { User, Award, Crown, LucideIcon } from 'lucide-react'

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
    standard: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-orange-600',
    vip: 'from-purple-400 to-pink-600'
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

export function getStatusIcon(status: UserStatus): LucideIcon {
  const icons: Record<UserStatus, LucideIcon> = {
    standard: User,
    gold: Award,
    vip: Crown
  }
  return icons[status]
}

export function getStatusProfitBonus(status: UserStatus): number {
  return STATUS_CONFIG[status].profitBonus
}

export function calculateStatusProgress(
  totalDeposit: number,
  currentStatus: UserStatus
) {
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']


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

export function formatStatusInfo(statusInfo: {
  current: UserStatus
  totalDeposit: number
  profitBonus: number
  nextStatus?: UserStatus | null
  progress: number
  depositNeeded?: number
}): string {

  const config = STATUS_CONFIG[statusInfo.current] || STATUS_CONFIG.standard

  let info = `${config.label} Status (${statusInfo.profitBonus} bonus)`


  if (statusInfo.current === 'vip') {
    info += ' • MAX TIER'
  } else if (statusInfo.nextStatus && STATUS_CONFIG[statusInfo.nextStatus]) {
    info += ` • ${statusInfo.progress}% to ${STATUS_CONFIG[statusInfo.nextStatus].label}`
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

export function getAllStatusTiers() {
  return (['standard', 'gold', 'vip'] as UserStatus[]).map(status => ({
    status,
    config: STATUS_CONFIG[status],
    icon: getStatusIcon(status)
  }))
}

export function formatDepositRequirement(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getStatusProgressColor(status: UserStatus): string {
  const colors = {
    standard: '#6B7280',
    gold: '#F59E0B',
    vip: '#8B5CF6'
  }
  return colors[status]
}

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

export function getNextStatusInfo(currentStatus: UserStatus): {
  status: UserStatus | null
  depositRequired: number
  profitBonus: number
} | null {
  const statuses: UserStatus[] = ['standard', 'gold', 'vip']
  const currentIndex = statuses.indexOf(currentStatus)

  if (currentIndex === statuses.length - 1) {
    return null
  }

  const nextStatus = statuses[currentIndex + 1]
  const nextConfig = STATUS_CONFIG[nextStatus]

  return {
    status: nextStatus,
    depositRequired: nextConfig.minDeposit,
    profitBonus: nextConfig.profitBonus
  }
}