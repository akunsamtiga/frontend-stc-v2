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