// app/admin/assets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import AssetFormModal from '@/components/admin/AssetFormModal'
import AssetDetailModal from '@/components/admin/AssetDetailModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Eye,
  Filter,
  Zap,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import type { Asset } from '@/types'

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-white/10 rounded"></div>
      <div className="h-4 bg-white/10 rounded w-20"></div>
    </div>
    <div className="h-6 bg-white/10 rounded w-24"></div>
  </div>
)

const AssetCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
        <div>
          <div className="h-4 bg-white/10 rounded w-40 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-24"></div>
        </div>
      </div>
      <div className="w-5 h-5 bg-white/10 rounded-full"></div>
    </div>
    <div className="bg-white/5 rounded-lg p-3 mb-3 space-y-2">
      <div className="h-3 bg-white/10 rounded w-24"></div>
      <div className="h-4 bg-white/10 rounded w-20"></div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <Navbar />
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 animate-pulse">
        <div className="h-7 bg-white/10 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-64"></div>
      </div>
      
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <AssetCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export default function AdminAssetsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'normal' | 'crypto'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
      return
    }
    
    loadAssets()
  }, [user, router])

  const loadAssets = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      const response = await api.getAssets(false)
      const assetData = response?.data || response
      setAssets(assetData.assets || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal memuat aset:', error)
      toast.error('Gagal memuat aset')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadAssets(true)
  }

  const handleCreate = () => {
    setSelectedAsset(null)
    setShowCreateModal(true)
  }

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowEditModal(true)
  }

  const handleViewDetail = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowDetailModal(true)
  }

  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset)
    setShowDeleteModal(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    loadAssets()
    toast.success('Aset berhasil dibuat')
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    loadAssets()
    toast.success('Aset berhasil diperbarui')
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return

    try {
      await api.deleteAsset(selectedAsset.id)
      setShowDeleteModal(false)
      setSelectedAsset(null)
      loadAssets()
      toast.success('Aset berhasil dihapus')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus aset')
    }
  }

  const getAssetCategory = (asset: Asset): 'normal' | 'crypto' => {
    return asset.category || 'normal'
  }

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (categoryFilter !== 'all') {
      const assetCategory = getAssetCategory(asset)
      if (assetCategory !== categoryFilter) return false
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !asset.isActive) return false
      if (statusFilter === 'inactive' && asset.isActive) return false
    }
    
    return true
  })

  // Calculate stats
  const stats = {
    total: assets.length,
    active: assets.filter(a => a.isActive).length,
    normal: assets.filter(a => getAssetCategory(a) === 'normal').length,
    crypto: assets.filter(a => getAssetCategory(a) === 'crypto').length,
    ultraFast: assets.filter(a => 
      a.tradingSettings?.allowedDurations.includes(0.0167)
    ).length,
    avgProfitRate: assets.length > 0 
      ? Math.round(assets.reduce((sum, a) => sum + a.profitRate, 0) / assets.length)
      : 0
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading && !refreshing) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Aset</h1>
            <p className="text-sm text-slate-400">Konfigurasi aset trading dan pengaturan</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {user.role === 'super_admin' && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Aset
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setCategoryFilter('normal')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                categoryFilter === 'normal'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setCategoryFilter('crypto')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                categoryFilter === 'crypto'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crypto
            </button>
          </div>

          <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-slate-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-slate-400">Aktif</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {stats.active}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs text-slate-400">Crypto</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {stats.crypto}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs text-slate-400">Ultra-Fast</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats.ultraFast}
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {assets.length === 0 ? 'Tidak ada aset' : 'Tidak ada aset yang cocok'}
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                {assets.length === 0 
                  ? 'Tambahkan aset trading pertama Anda'
                  : 'Coba ubah filter untuk melihat lebih banyak aset'}
              </p>
              {assets.length === 0 && user.role === 'super_admin' && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Aset Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredAssets.map((asset) => {
                const hasUltraFast = asset.tradingSettings?.allowedDurations.includes(0.0167)
                const assetCategory = getAssetCategory(asset)
                
                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        asset.isActive ? 'bg-green-500/10' : 'bg-white/5'
                      }`}>
                        <Package className={`w-6 h-6 ${
                          asset.isActive ? 'text-green-400' : 'text-slate-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-white">{asset.name}</span>
                          
                          {/* Category Badge */}
                          {assetCategory === 'crypto' ? (
                            <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-xs font-bold">
                              ₿ Crypto
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-xs font-bold">
                              📊 Normal
                            </span>
                          )}
                          
                          {/* Ultra-Fast Badge */}
                          {hasUltraFast && (
                            <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-xs font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              1s
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="font-medium">Simbol: {asset.symbol}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            Profit: {asset.profitRate}%
                          </span>
                          <span>•</span>
                          <span className="capitalize">{asset.dataSource}</span>
                          {asset.cryptoConfig && (
                            <>
                              <span>•</span>
                              <span className="font-mono font-semibold">
                                {asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        asset.isActive 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        {asset.isActive ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </span>

                      <button
                        onClick={() => handleViewDetail(asset)}
                        className="p-2 hover:bg-sky-500/10 text-sky-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      {user.role === 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleEdit(asset)}
                            className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Aset"
                          >
                            <Edit className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleDelete(asset)}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Hapus Aset"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <AssetFormModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && selectedAsset && (
        <AssetFormModal
          mode="edit"
          asset={selectedAsset}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDetailModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setShowDetailModal(false)}
          onEdit={user.role === 'super_admin' ? () => {
            setShowDetailModal(false)
            handleEdit(selectedAsset)
          } : undefined}
        />
      )}

      {showDeleteModal && selectedAsset && (
        <DeleteConfirmModal
          title="Hapus Aset"
          message={`Apakah Anda yakin ingin menghapus "${selectedAsset.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedAsset(null)
          }}
        />
      )}
    </div>
  )
}