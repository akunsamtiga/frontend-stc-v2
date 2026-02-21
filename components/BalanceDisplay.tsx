'use client'

import { memo } from 'react'
import { useAnimatedBalance } from '@/hooks/useAnimatedBalance'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'

interface BalanceDisplayProps {
  amount: number
  label: string
  isActive?: boolean
  onClick?: () => void
  isMobile?: boolean
  hideBalance?: boolean
  onToggleHide?: () => void
}

const BalanceDisplay = memo(({ 
  amount, 
  label, 
  isActive = false, 
  onClick,
  isMobile = false,
  hideBalance = false,
  onToggleHide,
}: BalanceDisplayProps) => {
  const { formattedValue, animationClasses } = useAnimatedBalance(amount, 700)

  const maskedValue = '*********'

  if (isMobile) {
    return (
      <div className={`
        flex flex-col items-end py-1 px-2.5 rounded-lg border transition-all duration-300
        ${isActive 
          ? 'bg-[#232936] border-blue-500/50' 
          : 'bg-[#1a1f2e] border-gray-800/50'
        }
      `}>
        <div className="flex items-center gap-1">
          {onToggleHide && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHide() }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {hideBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
          <button onClick={onClick} className="flex items-center gap-1">
            <span className="text-[12px] text-gray-400">{label}</span>
            <ChevronDown className={`
              w-4 h-4 text-gray-400 transition-transform duration-300
              ${isActive ? 'rotate-180' : ''}
            `} />
          </button>
        </div>
        
        <button onClick={onClick} className={`
          transition-all duration-500 ease-out
          text-sm font-bold leading-tight whitespace-nowrap
          ${hideBalance ? 'text-white tracking-widest' : animationClasses}
        `}>
          {hideBalance ? maskedValue : formattedValue}
        </button>
      </div>
    )
  }

  // Desktop version
  return (
    <div className={`
      flex flex-col items-start gap-0.5
      hover:scale-105 px-4 py-2.5 rounded-lg transition-all duration-300 cursor-pointer
      ${isActive ? 'bg-[#232936]' : ''}
    `}>
      <div className="flex items-center gap-1.5">
        {onToggleHide && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleHide() }}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {hideBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
        <button onClick={onClick} className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">{label}</span>
          <ChevronDown className={`
            w-3.5 h-3.5 text-gray-400 transition-transform duration-300
            ${isActive ? 'rotate-180' : ''}
          `} />
        </button>
      </div>
      
      <button onClick={onClick} className={`
        transition-all duration-500 ease-out
        text-base font-bold
        ${hideBalance ? 'text-white tracking-widest' : animationClasses}
      `}>
        {hideBalance ? maskedValue : formattedValue}
      </button>
    </div>
  )
})

BalanceDisplay.displayName = 'BalanceDisplay'

export default BalanceDisplay