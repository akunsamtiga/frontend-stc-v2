// ===================================

// components/profile/ProfileCompletionBar.tsx
// Visual completion indicator

interface ProfileCompletionBarProps {
  completion: number
}

export function ProfileCompletionBar({ completion }: ProfileCompletionBarProps) {
  const getColor = () => {
    if (completion >= 80) return 'bg-green-600'
    if (completion >= 50) return 'bg-yellow-600'
    return 'bg-blue-600'
  }

  const getMessage = () => {
    if (completion === 100) return 'Profile completed!'
    if (completion >= 80) return 'Almost there!'
    if (completion >= 50) return 'Good progress'
    return 'Let\'s complete your profile'
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-blue-900">
          {getMessage()}
        </span>
        <span className="text-sm font-bold text-blue-600">
          {completion}%
        </span>
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${completion}%` }}
        />
      </div>
      
      {completion < 100 && (
        <p className="text-xs text-blue-700 mt-2">
          Complete your profile to unlock all features
        </p>
      )}
    </div>
  )
}

