// components/BalanceDisplay.tsx
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
  isLightMode?: boolean
}

const BalanceDisplay = memo(({
  amount,
  label,
  isActive = false,
  onClick,
  isMobile = false,
  hideBalance = false,
  onToggleHide,
  isLightMode = false,
}: BalanceDisplayProps) => {
  const { formattedValue, animationClasses } = useAnimatedBalance(amount, 700)

  const maskedValue = '*********'

  if (isMobile) {
    return (
      <div
        className={`
          flex flex-col items-end py-1 px-2.5 rounded-lg border transition-all duration-300
          ${isActive
            ? 'bg-[#232936] border-blue-500/50'
            : 'bg-[#1a1f2e] border-gray-800/50'
          }
        `}
        style={isLightMode ? {
          backgroundColor: isActive ? '#e8f0fe' : '#f1f5f9',
          borderColor: isActive ? 'rgba(59,130,246,0.4)' : 'rgba(0,0,0,0.1)',
        } : undefined}
      >
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
            <span className={`text-[12px] ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{label}</span>
            <ChevronDown className={`
              w-4 h-4 transition-transform duration-300
              ${isLightMode ? 'text-slate-600' : 'text-gray-400'}
              ${isActive ? 'rotate-180' : ''}
            `} />
          </button>
        </div>

        <button onClick={onClick} className={`
          transition-all duration-500 ease-out
          text-sm font-bold leading-tight whitespace-nowrap
          ${hideBalance
            ? (isLightMode ? 'text-slate-800 tracking-widest' : 'text-white tracking-widest')
            : animationClasses
          }
        `}
          style={isLightMode && !hideBalance && animationClasses === 'text-white' ? { color: '#1e293b' } : undefined}
        >
          {hideBalance ? maskedValue : formattedValue}
        </button>
      </div>
    )
  }


  return (
    <div
      className={`
        flex flex-col items-start gap-0.5
        hover:scale-105 px-4 py-2.5 rounded-lg transition-all duration-300 cursor-pointer
        ${isActive ? 'bg-[#232936]' : ''}
      `}
      style={isLightMode ? {
        backgroundColor: isActive ? '#e8f0fe' : undefined,
      } : undefined}
    >
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
          <span className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{label}</span>
          <ChevronDown className={`
            w-3.5 h-3.5 transition-transform duration-300
            ${isLightMode ? 'text-slate-600' : 'text-gray-400'}
            ${isActive ? 'rotate-180' : ''}
          `} />
        </button>
      </div>

      <button onClick={onClick} className={`
        transition-all duration-500 ease-out
        text-base font-bold
        ${hideBalance
          ? (isLightMode ? 'text-slate-800 tracking-widest' : 'text-white tracking-widest')
          : animationClasses
        }
      `}
        style={isLightMode && !hideBalance && animationClasses === 'text-white' ? { color: '#1e293b' } : undefined}
      >
        {hideBalance ? maskedValue : formattedValue}
      </button>
    </div>
  )
})

BalanceDisplay.displayName = 'BalanceDisplay'

export default BalanceDisplay