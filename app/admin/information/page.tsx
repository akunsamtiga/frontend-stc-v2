'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  Eye,
  EyeSlash,
  MagnifyingGlass,
  Funnel,
  X,
  CaretRight,
  ArrowsClockwise,
  Warning,
  Megaphone,
  Newspaper,
  Wrench,
  Sparkle,
  Bell,
  PushPin,
  CalendarBlank,
  Users as UsersIcon,
  Target,
} from 'phosphor-react'
import { 
  Information, 
  InformationType, 
  InformationPriority,
  GetInformationQuery,
} from '@/types'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { TimezoneUtil } from '@/lib/utils'
import InformationFormModal from '@/components/admin/InformationFormModal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Navbar from '@/components/Navbar'

// ✅ Type helpers
const getInformationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    announcement: 'Pengumuman',
    promotion: 'Promosi',
    news: 'Berita',
    maintenance: 'Maintenance',
    update: 'Update',
    warning: 'Peringatan',
  }
  return labels[type] || type
}

const getInformationTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    announcement: Megaphone,
    promotion: Sparkle,
    news: Newspaper,
    maintenance: Wrench,
    update: Bell,
    warning: Warning,
  }
  const Icon = icons[type] || Megaphone
  return <Icon className="w-6 h-6" weight="duotone" />
}

const getInformationTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    announcement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    promotion: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    news: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    maintenance: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    update: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[type] || colors.announcement
}

const getInformationPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
  }
  return labels[priority] || priority
}

const getInformationPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[priority] || colors.medium
}

export default function AdminInformationPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [information, setInformation] = useState<Information[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Filter & Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<InformationType | ''>('')
  const [filterPriority, setFilterPriority] = useState<InformationPriority | ''>('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [filterPinned, setFilterPinned] = useState<boolean | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal State
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingInfo, setEditingInfo] = useState<Information | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingInfo, setDeletingInfo] = useState<Information | null>(null)

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  // Fetch information
  const fetchInformation = async () => {
    try {
      setLoading(true)
      
      const query: GetInformationQuery = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        type: filterType || undefined,
        priority: filterPriority || undefined,
        isActive: filterActive,
        isPinned: filterPinned,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      
      const result = await api.getAllInformation(query)
      
      // ✅ Defensive check: Ensure result.items is an array
      const items = Array.isArray(result?.items) ? result.items : []
      const pages = result?.totalPages || 1
      const total = result?.total || 0
      
      console.log('📊 Information fetched:', { items: items.length, pages, total })
      
      setInformation(items)
      setTotalPages(pages)
      setTotalItems(total)
    } catch (error) {
      console.error('❌ Failed to fetch information:', error)
      toast.error('Gagal memuat data informasi')
      // Reset to safe defaults on error
      setInformation([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin')) {
      fetchInformation()
    }
  }, [currentPage, searchQuery, filterType, filterPriority, filterActive, filterPinned, isAuthenticated, user])

  // Handlers
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterPriority('')
    setFilterActive(undefined)
    setFilterPinned(undefined)
    setCurrentPage(1)
  }

  const handleCreate = () => {
    setEditingInfo(null)
    setShowFormModal(true)
  }

  const handleEdit = (info: Information) => {
    setEditingInfo(info)
    setShowFormModal(true)
  }

  const handleDelete = (info: Information) => {
    setDeletingInfo(info)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingInfo) return
    
    try {
      await api.deleteInformation(deletingInfo.id)
      toast.success('Informasi berhasil dihapus')
      setShowDeleteDialog(false)
      setDeletingInfo(null)
      fetchInformation()
    } catch (error) {
      console.error('Failed to delete information:', error)
      toast.error('Gagal menghapus informasi')
    }
  }

  const handleToggleStatus = async (info: Information) => {
    try {
      await api.toggleInformationStatus(info.id)
      toast.success(`Informasi ${info.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchInformation()
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('Gagal mengubah status')
    }
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setEditingInfo(null)
    fetchInformation()
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
    return null
  }

  const hasActiveFilters = searchQuery || filterType || filterPriority || filterActive !== undefined || filterPinned !== undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] bg-center pointer-events-none"
      ></div>

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-indigo-400" weight="duotone" />
              Kelola Informasi
            </h1>
            <button
              onClick={fetchInformation}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
              title="Refresh"
            >
              <ArrowsClockwise className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} weight="bold" />
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            Buat dan kelola pengumuman, promosi, dan informasi untuk pengguna
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Total Informasi</div>
            <div className="text-2xl font-bold text-white">{totalItems}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Aktif</div>
            <div className="text-2xl font-bold text-green-400">
              {information.filter(i => i.isActive).length}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Pinned</div>
            <div className="text-2xl font-bold text-yellow-400">
              {information.filter(i => i.isPinned).length}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Halaman</div>
            <div className="text-2xl font-bold text-indigo-400">{currentPage}/{totalPages}</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/10">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" weight="bold" />
                <input
                  type="text"
                  placeholder="Cari judul atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  showFilters || hasActiveFilters
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Funnel className="w-5 h-5" weight="bold" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="bg-white text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    •
                  </span>
                )}
              </button>
              
              <button
                onClick={handleCreate}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" weight="bold" />
                <span className="hidden sm:inline">Buat Baru</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Type Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tipe</label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as InformationType | '')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="announcement">Pengumuman</option>
                    <option value="promotion">Promosi</option>
                    <option value="news">Berita</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="update">Update</option>
                    <option value="warning">Peringatan</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prioritas</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => {
                      setFilterPriority(e.target.value as InformationPriority | '')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Semua Prioritas</option>
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>

                {/* Active Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select
                    value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
                    onChange={(e) => {
                      setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Semua Status</option>
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>

                {/* Pinned Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Pinned</label>
                  <select
                    value={filterPinned === undefined ? '' : filterPinned ? 'true' : 'false'}
                    onChange={(e) => {
                      setFilterPinned(e.target.value === '' ? undefined : e.target.value === 'true')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Semua</option>
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <X className="w-4 h-4" weight="bold" />
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Information List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-slate-400 text-sm">Memuat data...</p>
          </div>
        ) : !Array.isArray(information) || information.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-12 border border-white/10 text-center">
            <Megaphone className="w-16 h-16 text-slate-600 mx-auto mb-4" weight="duotone" />
            <p className="text-slate-400 mb-4">
              {hasActiveFilters ? 'Tidak ada informasi yang sesuai dengan filter' : 'Belum ada informasi'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" weight="bold" />
                Buat Informasi Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(information) && information.map((info) => (
              <InformationCard
                key={info.id}
                information={info}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all border border-white/10"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all border border-white/10"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <InformationFormModal
          information={editingInfo}
          onClose={() => {
            setShowFormModal(false)
            setEditingInfo(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && deletingInfo && (
        <ConfirmDialog
          title="Hapus Informasi"
          message={`Apakah Anda yakin ingin menghapus informasi "${deletingInfo.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false)
            setDeletingInfo(null)
          }}
        />
      )}
    </div>
  )
}

// Information Card Component
interface InformationCardProps {
  information: Information
  onEdit: (info: Information) => void
  onDelete: (info: Information) => void
  onToggleStatus: (info: Information) => void
}

function InformationCard({ information, onEdit, onDelete, onToggleStatus }: InformationCardProps) {
  const TypeIcon = getInformationTypeIcon(information.type)
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all group">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${getInformationTypeColor(information.type)}`}>
              {TypeIcon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-bold text-white">{information.title}</h3>
                {information.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                    <PushPin className="w-3 h-3" weight="fill" />
                    Pinned
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded border ${
                  information.isActive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {information.isActive ? '● Aktif' : '○ Nonaktif'}
                </span>
              </div>
              
              {information.subtitle && (
                <p className="text-slate-300 text-sm mb-2">{information.subtitle}</p>
              )}
              
              <p className="text-slate-400 text-sm line-clamp-2">{information.description}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2 py-1 text-xs rounded border ${getInformationTypeColor(information.type)}`}>
                  {getInformationTypeLabel(information.type)}
                </span>
                <span className={`px-2 py-1 text-xs rounded border ${getInformationPriorityColor(information.priority)}`}>
                  {getInformationPriorityLabel(information.priority)}
                </span>
              </div>

              {/* Targeting Info */}
              {(information.targetUserStatus?.length || information.targetUserRoles?.length) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Target className="w-4 h-4" weight="duotone" />
                  <span>
                    {information.targetUserStatus?.length ? (
                      <span>Status: {information.targetUserStatus.join(', ')}</span>
                    ) : null}
                    {information.targetUserStatus?.length && information.targetUserRoles?.length ? ' • ' : null}
                    {information.targetUserRoles?.length ? (
                      <span>Role: {information.targetUserRoles.join(', ')}</span>
                    ) : null}
                  </span>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-3">
                <div className="flex items-center gap-1">
                  <CalendarBlank className="w-3.5 h-3.5" weight="duotone" />
                  {TimezoneUtil.formatDateTime(new Date(information.createdAt))}
                </div>
                {information.viewCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" weight="duotone" />
                    {information.viewCount}
                  </div>
                )}
                {information.clickCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <CaretRight className="w-3.5 h-3.5" weight="bold" />
                    {information.clickCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex lg:flex-col gap-2 lg:w-auto">
          <button
            onClick={() => onToggleStatus(information)}
            className={`flex-1 lg:w-28 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              information.isActive
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
            title={information.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {information.isActive ? (
              <><Eye className="w-4 h-4" weight="bold" /> Aktif</>
            ) : (
              <><EyeSlash className="w-4 h-4" weight="bold" /> Off</>
            )}
          </button>
          
          <button
            onClick={() => onEdit(information)}
            className="flex-1 lg:w-28 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
            title="Edit"
          >
            <PencilSimple className="w-4 h-4" weight="bold" />
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => onDelete(information)}
            className="flex-1 lg:w-28 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
            title="Hapus"
          >
            <Trash className="w-4 h-4" weight="bold" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  )
}