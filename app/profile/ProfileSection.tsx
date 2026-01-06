// components/profile/ProfileSection.tsx

import React from 'react'
import { Edit2, Save, Loader2, X } from 'lucide-react'

interface ProfileSectionProps {
  title: string
  description: string
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  children: React.ReactNode
}

export function ProfileSection({
  title,
  description,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  children
}: ProfileSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        
        {/* Action Buttons */}
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

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

// ===================================

// components/profile/AvatarUploader.tsx
// Avatar upload component with preview

import { Camera, Loader2 as LoaderIcon } from 'lucide-react'
import { useState } from 'react'

interface AvatarUploaderProps {
  currentAvatar?: string
  onUpload: (file: File) => Promise<boolean>
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarUploader({ 
  currentAvatar, 
  onUpload,
  size = 'md' 
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const success = await onUpload(file)
      if (!success) {
        setPreview(null)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden`}
      >
        {preview || currentAvatar ? (
          <img 
            src={preview || currentAvatar} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-2xl font-bold">
            {/* Placeholder initial */}
            U
          </span>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <LoaderIcon className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <label 
        className={`absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Camera className="w-4 h-4 text-white" />
        <input 
          type="file" 
          accept="image/*" 
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </label>
    </div>
  )
}