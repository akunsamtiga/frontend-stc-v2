'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Upload, Trash, Image as ImageIcon, CloudArrowUp, Warning } from 'phosphor-react'
import { 
  Information, 
  InformationType, 
  InformationPriority,
  CreateInformationRequest,
  UpdateInformationRequest,
  getInformationTypeLabel,
  getInformationPriorityLabel,
} from '@/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { compressImage } from '@/lib/imageCompression'

interface InformationFormModalProps {
  information?: Information | null
  onClose: () => void
  onSuccess: () => void
}

export default function InformationFormModal({ information, onClose, onSuccess }: InformationFormModalProps) {
  const isEditing = !!information
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    type: InformationType.ANNOUNCEMENT,
    priority: InformationPriority.MEDIUM,
    imageUrl: '',
    imagePath: '',
    imageSize: 0,
    linkUrl: '',
    linkText: '',
    startDate: '',
    endDate: '',
    publishDate: '',
    isActive: true,
    isPinned: false,
    targetUserStatus: [] as string[],
    targetUserRoles: [] as string[],
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [deletingImage, setDeletingImage] = useState(false)
  const [compressing, setCompressing] = useState(false)

  // Initialize form with existing data
  useEffect(() => {
    if (information) {
      setFormData({
        title: information.title,
        subtitle: information.subtitle || '',
        description: information.description,
        type: information.type,
        priority: information.priority,
        imageUrl: information.imageUrl || '',
        imagePath: information.imagePath || '',
        imageSize: information.imageSize || 0,
        linkUrl: information.linkUrl || '',
        linkText: information.linkText || '',
        startDate: information.startDate ? information.startDate.split('T')[0] : '',
        endDate: information.endDate ? information.endDate.split('T')[0] : '',
        publishDate: information.publishDate ? information.publishDate.split('T')[0] : '',
        isActive: information.isActive,
        isPinned: information.isPinned,
        targetUserStatus: information.targetUserStatus || [],
        targetUserRoles: information.targetUserRoles || [],
      })
      
      // Set image preview if exists
      if (information.imageUrl) {
        setImagePreview(information.imageUrl)
      }
    }
  }, [information])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle multi-select
  const handleMultiSelect = (name: 'targetUserStatus' | 'targetUserRoles', value: string) => {
    setFormData(prev => {
      const current = prev[name] as string[]
      const newValue = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [name]: newValue }
    })
  }

  // ✅ IMPROVED: Better error handling and logging
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('📁 File selected:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)}KB`,
      type: file.type
    })

    try {
      setUploadingImage(true)
      setUploadProgress(0)

      // Delete old image if exists (non-blocking)
      if (formData.imagePath) {
        try {
          await api.deleteInformationImage(formData.imagePath)
          console.log('🗑️ Old image deleted')
        } catch (error) {
          console.warn('⚠️ Failed to delete old image:', error)
        }
      }

      // ✅ Compress (but don't reject if fails)
      setCompressing(true)
      console.log('🔄 Processing image...')
      
      let fileToUpload = file
      try {
        const compressedFile = await compressImage(file, {
          maxWidth: 2560,
          maxHeight: 2560,
          quality: 0.92,
          targetSizeKB: 4500
        })
        fileToUpload = compressedFile
        console.log('✅ Image processed successfully')
      } catch (error) {
        console.warn('⚠️ Compression failed, using original file:', error)
        // Continue with original file
      }
      
      setCompressing(false)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload
      console.log('📤 Uploading...')
      console.log('📤 File to upload:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type
      })
      
      const result = await api.uploadInformationImage(fileToUpload)
      
      console.log('✅ Upload success!')
      console.log('✅ Upload result:', result)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // ✅ IMPROVED: Validate result before updating state
      if (!result || !result.url || !result.path) {
        throw new Error('Invalid upload result: missing url or path')
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        imageUrl: result.url,
        imagePath: result.path,
        imageSize: result.size || fileToUpload.size,
      }))

      // Set preview
      setImagePreview(result.url)

      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
      
      toast.success('Gambar berhasil diupload!')
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      
      setUploadProgress(0)
      
      // ✅ IMPROVED: Better error message
      let errorMessage = 'Gagal mengupload gambar'
      
      if (error.response?.data) {
        const errorData = error.response.data
        errorMessage = errorData.error || errorData.message || errorData.detail || JSON.stringify(errorData)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.error('❌ Final error message:', errorMessage)
      toast.error(errorMessage)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setUploadingImage(false)
      setCompressing(false)
    }
  }

  // Handle image deletion
  const handleDeleteImage = async () => {
    if (!formData.imagePath) return

    try {
      setDeletingImage(true)
      await api.deleteInformationImage(formData.imagePath)
      
      setFormData(prev => ({
        ...prev,
        imageUrl: '',
        imagePath: '',
        imageSize: 0,
      }))
      
      setImagePreview(null)
      toast.success('Gambar berhasil dihapus')
    } catch (error) {
      console.error('❌ Failed to delete image:', error)
      toast.error('Gagal menghapus gambar')
    } finally {
      setDeletingImage(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Judul wajib diisi'
    } else if (formData.title.length < 3) {
      newErrors.title = 'Judul minimal 3 karakter'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Judul maksimal 200 karakter'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi wajib diisi'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Deskripsi minimal 10 karakter'
    }

    if (formData.subtitle && formData.subtitle.length > 300) {
      newErrors.subtitle = 'Sub judul maksimal 300 karakter'
    }

    if (formData.linkUrl && !isValidUrl(formData.linkUrl)) {
      newErrors.linkUrl = 'Format URL link tidak valid'
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error('Mohon perbaiki kesalahan pada form')
      return
    }

    setLoading(true)

    try {
      const requestData: CreateInformationRequest | UpdateInformationRequest = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        imageUrl: formData.imageUrl || undefined,
        imagePath: formData.imagePath || undefined,
        imageSize: formData.imageSize || undefined,
        linkUrl: formData.linkUrl || undefined,
        linkText: formData.linkText || undefined,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        publishDate: formData.publishDate ? new Date(formData.publishDate).toISOString() : undefined,
        isActive: formData.isActive,
        isPinned: formData.isPinned,
        targetUserStatus: formData.targetUserStatus.length > 0 ? formData.targetUserStatus as any : undefined,
        targetUserRoles: formData.targetUserRoles.length > 0 ? formData.targetUserRoles as any : undefined,
      }

      if (isEditing) {
        await api.updateInformation(information!.id, requestData)
      } else {
        await api.createInformation(requestData as CreateInformationRequest)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to save information:', error)
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan informasi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full my-8 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? '✏️ Edit Informasi' : '➕ Buat Informasi Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              📝 Informasi Dasar
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Judul <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                  errors.title ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                }`}
                placeholder="Contoh: Welcome Bonus 100%"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              <p className="text-xs text-slate-500 mt-1">{formData.title.length}/200 karakter</p>
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sub Judul
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                  errors.subtitle ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                }`}
                placeholder="Contoh: Dapatkan bonus deposit hingga 100%"
              />
              {errors.subtitle && <p className="text-red-400 text-sm mt-1">{errors.subtitle}</p>}
              {formData.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{formData.subtitle.length}/300 karakter</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Deskripsi <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-none ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                }`}
                placeholder="Deskripsi detail tentang informasi ini..."
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              <p className="text-xs text-slate-500 mt-1">{formData.description.length} karakter</p>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipe <span className="text-red-400">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(InformationType).map((type) => (
                    <option key={type} value={type}>
                      {getInformationTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prioritas
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(InformationPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {getInformationPriorityLabel(priority)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              🖼️ Gambar Banner
            </h3>

            {/* Image Preview */}
            {imagePreview ? (
              <div className="relative group">
                <div className="relative rounded-lg overflow-hidden border-2 border-slate-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      console.error('❌ Failed to load image preview:', imagePreview);
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || deletingImage}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-5 h-5" weight="bold" />
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={uploadingImage || deletingImage}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {deletingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Menghapus...
                        </>
                      ) : (
                        <>
                          <Trash className="w-5 h-5" weight="bold" />
                          Hapus
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {formData.imageSize > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Ukuran: {(formData.imageSize / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            ) : (
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-700 rounded-lg p-8 text-center transition-all ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                    {uploadingImage ? (
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CloudArrowUp className="w-8 h-8 text-blue-400" weight="duotone" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      {uploadingImage ? 'Mengupload...' : 'Klik untuk upload gambar'}
                    </p>
                    <p className="text-sm text-slate-400">
                      Format: JPEG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadingImage && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Uploading...</span>
                  <span className="text-blue-400 font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={uploadingImage || compressing}
            />

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
              <Warning className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" weight="duotone" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Tips Upload Gambar:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-400">
                  <li>Gunakan gambar dengan rasio 16:9 untuk hasil terbaik</li>
                  <li>Resolusi minimum: 1200 x 675 piksel</li>
                  <li>Ukuran file maksimal 5MB</li>
                  <li>Format yang didukung: JPEG, PNG, GIF, WebP</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Link Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              🔗 Link & Button
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  URL Link
                </label>
                <input
                  type="url"
                  name="linkUrl"
                  value={formData.linkUrl}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                    errors.linkUrl ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                  }`}
                  placeholder="https://example.com/promo"
                />
                {errors.linkUrl && <p className="text-red-400 text-sm mt-1">{errors.linkUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Text Link Button
                </label>
                <input
                  type="text"
                  name="linkText"
                  value={formData.linkText}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Lihat Detail"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              📅 Tanggal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-slate-900 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                    errors.endDate ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                  }`}
                />
                {errors.endDate && <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tanggal Publikasi
                </label>
                <input
                  type="date"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              ⚙️ Pengaturan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Aktif
                </label>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  name="isPinned"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-slate-300 cursor-pointer">
                  📌 Pin di Bagian Atas
                </label>
              </div>
            </div>
          </div>

          {/* Target User Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">
              🎯 Target Pengguna
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target User Status (Kosongkan untuk semua)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['standard', 'gold', 'vip'].map((status) => (
                  <div
                    key={status}
                    onClick={() => handleMultiSelect('targetUserStatus', status)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.targetUserStatus.includes(status)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center font-medium capitalize">{status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target User Role (Kosongkan untuk semua)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['user', 'admin', 'super_admin'].map((role) => (
                  <div
                    key={role}
                    onClick={() => handleMultiSelect('targetUserRoles', role)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.targetUserRoles.includes(role)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center font-medium capitalize">{role.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900/50 sticky bottom-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || uploadingImage || compressing}
            className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || uploadingImage || compressing}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : compressing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memproses gambar...
              </>
            ) : uploadingImage ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Upload in progress...
              </>
            ) : (
              <>{isEditing ? 'Perbarui' : 'Buat'} Informasi</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}