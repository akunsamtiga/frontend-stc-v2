// components/WithdrawalStatusBadge.tsx
import { WithdrawalStatus, getWithdrawalStatusBg, getWithdrawalStatusLabel } from '@/types'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface WithdrawalStatusBadgeProps {
  status: WithdrawalStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function WithdrawalStatusBadge({ 
  status, 
  size = 'md',
  showIcon = true 
}: WithdrawalStatusBadgeProps) {
  const bgClass = getWithdrawalStatusBg(status)
  const label = getWithdrawalStatusLabel(status)
  
  const icons = {
    pending: Clock,
    approved: AlertCircle,
    rejected: XCircle,
    completed: CheckCircle,
  }
  
  const Icon = icons[status]
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-bold border ${bgClass} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </span>
  )
}