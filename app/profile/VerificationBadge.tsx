
// ===================================

// components/profile/VerificationBadge.tsx
// Verification status indicator

interface VerificationBadgeProps {
  verified: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function VerificationBadge({ 
  verified, 
  label, 
  icon: Icon 
}: VerificationBadgeProps) {
  return (
    <div 
      className={`p-4 rounded-xl border-2 ${
        verified 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon 
          className={`w-5 h-5 ${
            verified ? 'text-green-600' : 'text-gray-400'
          }`} 
        />
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {label}
          </div>
          <div 
            className={`text-xs font-medium ${
              verified ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {verified ? 'Verified' : 'Not Verified'}
          </div>
        </div>
      </div>
    </div>
  )
}

