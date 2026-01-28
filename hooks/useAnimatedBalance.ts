'use client'

import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'

export function useAnimatedBalance(currentValue: number, duration = 600) {
  const [displayValue, setDisplayValue] = useState(currentValue)
  const [animationState, setAnimationState] = useState<'idle' | 'increasing' | 'decreasing'>('idle')
  const previousValueRef = useRef(currentValue)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const previousValue = previousValueRef.current
    const diff = currentValue - previousValue

    if (diff === 0) return

    setAnimationState(diff > 0 ? 'increasing' : 'decreasing')
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const startTime = Date.now()
    const startValue = displayValue
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentDisplay = startValue + (currentValue - startValue) * easeOut
      setDisplayValue(currentDisplay)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(currentValue)
        timeoutRef.current = setTimeout(() => setAnimationState('idle'), 1000)
      }
    }
    
    requestAnimationFrame(animate)
    previousValueRef.current = currentValue

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [currentValue, duration])

  const getAnimationClasses = () => {
    switch (animationState) {
      case 'increasing':
        return 'text-green-400'
      case 'decreasing':
        return 'text-red-400'
      default:
        return 'text-white'
    }
  }

  return {
    displayValue,
    formattedValue: formatCurrency(Math.round(displayValue)),
    animationClasses: getAnimationClasses()
  }
}