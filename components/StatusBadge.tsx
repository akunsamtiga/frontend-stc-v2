// components/StatusBadge.tsx
import Image from 'next/image'
import { UserStatus } from '@/types'

interface StatusBadgeProps {
  status: UserStatus
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_BADGE_IMAGES: Record<UserStatus, string> = {
  standard: '/std.png', 
  gold: '/gold.png',
  vip: '/vip.png'
}

const SIZE_CONFIG = {
  sm: { container: 'w-5 h-5', image: 20 },
  md: { container: 'w-6 h-6', image: 24 },
  lg: { container: 'w-7 h-7', image: 28 }
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const badgeImage = STATUS_BADGE_IMAGES[status]
  const config = SIZE_CONFIG[size]

  if (!badgeImage) return null

  return (
    <div className={`absolute -bottom-0.5 -right-0.5 ${config.container} rounded-full bg-[#0f1419] border border-gray-800/50 shadow-lg z-50`}>
      <Image
        src={badgeImage}
        alt={`${status} status`}
        width={config.image}
        height={config.image}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}