'use client'

import { memo } from 'react'
import { useAnimatedBalance } from '@/hooks/useAnimatedBalance'
import { ChevronDown } from 'lucide-react'

interface BalanceDisplayProps {
  amount: number
  label: string
  isActive?: boolean
  onClick?: () => void
  isMobile?: boolean
}

const BalanceDisplay = memo(({ 
  amount, 
  label, 
  isActive = false, 
  onClick,
  isMobile = false
}: BalanceDisplayProps) => {
  const { formattedValue, animationClasses, icon, isAnimating, direction } = useAnimatedBalance(amount, 700)

  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={`
          flex flex-col items-end py-1 px-2.5 rounded-lg border transition-all duration-300 relative overflow-hidden
          ${isActive 
            ? 'bg-[#232936] border-blue-500/50' 
            : 'bg-[#1a1f2e] border-gray-800/50'
          }
          ${isAnimating ? 'border-opacity-100' : ''}
          ${direction === 'increasing' ? 'border-green-500/30' : ''}
          ${direction === 'decreasing' ? 'border-red-500/30' : ''}
        `}
      >
        <div className="flex items-center gap-1 relative z-10">
          <span className="text-[12px] text-gray-400">{label}</span>
          <ChevronDown className={`
            w-4 h-4 text-gray-400 transition-transform duration-300
            ${isActive ? 'rotate-180' : ''}
          `} />
        </div>
        
        <div className={`
          flex items-center gap-1 transition-all duration-500 ease-out
          text-sm font-bold leading-tight whitespace-nowrap font-mono
          ${animationClasses}
        `}>
          {icon && (
            <span className={`
              text-[10px] transition-all duration-300
              ${isAnimating ? 'opacity-100 animate-bounce' : 'opacity-0'}
            `}>
              {icon}
            </span>
          )}
          <span>{formattedValue}</span>
        </div>

        {/* Background glow effect */}
        <div className={`
          absolute inset-0 transition-opacity duration-500
          ${direction === 'increasing' ? 'bg-green-500/10' : ''}
          ${direction === 'decreasing' ? 'bg-red-500/10' : ''}
          ${isAnimating ? 'opacity-100' : 'opacity-0'}
        `} />
      </button>
    )
  }

  // Desktop version
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-start gap-0.5 
        hover:bg-[#232936] px-4 py-2.5 rounded-lg transition-all duration-300 overflow-hidden
        ${isActive ? 'bg-[#232936]' : ''}
        ${direction === 'increasing' ? 'ring-1 ring-green-500/30' : ''}
        ${direction === 'decreasing' ? 'ring-1 ring-red-500/30' : ''}
      `}
    >
      <div className="flex items-center gap-1.5 relative z-10">
        <span className="text-xs text-gray-400">{label}</span>
        <ChevronDown className={`
          w-3.5 h-3.5 text-gray-400 transition-transform duration-300
          ${isActive ? 'rotate-180' : ''}
        `} />
      </div>
      
      <div className={`
        flex items-center gap-2 transition-all duration-500 ease-out
        text-base font-bold font-mono
        ${animationClasses}
      `}>
        {icon && (
          <span className={`
            text-xs transition-all duration-300
            ${isAnimating ? 'opacity-100 animate-bounce' : 'opacity-0'}
          `}>
            {icon}
          </span>
        )}
        <span>{formattedValue}</span>
      </div>

      {/* Background glow effect */}
      <div className={`
        absolute inset-0 transition-opacity duration-500
        ${direction === 'increasing' ? 'bg-green-500/10' : ''}
        ${direction === 'decreasing' ? 'bg-red-500/10' : ''}
        ${isAnimating ? 'opacity-100' : 'opacity-0'}
      `} />
    </button>
  )
})

BalanceDisplay.displayName = 'BalanceDisplay'

export default BalanceDisplay