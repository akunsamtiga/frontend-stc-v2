// ===================================

// components/profile/ProfileField.tsx
// Reusable field component for view/edit mode

interface ProfileFieldProps {
  label: string
  value: string | null | undefined
  isEditing: boolean
  type?: 'text' | 'email' | 'tel' | 'date' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  onChange?: (value: string) => void
  error?: string
  required?: boolean
}

export function ProfileField({
  label,
  value,
  isEditing,
  type = 'text',
  options,
  placeholder,
  onChange,
  error,
  required
}: ProfileFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {isEditing ? (
        <>
          {type === 'select' && options ? (
            <select
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:border-blue-500 focus:outline-none transition-colors ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:border-blue-500 focus:outline-none transition-colors ${
                error ? 'border-red-300' : 'border-gray-200'
              }`}
            />
          )}
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </>
      ) : (
        <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
          {value || '-'}
        </div>
      )}
    </div>
  )
}
