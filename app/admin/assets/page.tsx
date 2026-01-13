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
  Settings as SettingsIcon,
  Loader2,
  Filter,
  Zap,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
// ✅ FIX: Import Asset type from @/types instead of defining locally
import type { Asset } from '@/types'

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 animate-pulse">
    <div className="flex items-center gap-2 md:gap-3 mb-2">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-3 bg-gray-200 rounded w-20 md:w-24"></div>
    </div>
    <div className="h-8 md:h-10 bg-gray-200 rounded w-16 md:w-20 mb-1"></div>
    <div className="h-3 bg-gray-200 rounded w-12 md:w-16"></div>
  </div>
)

const AssetCardSkeleton = () => (
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 sm:p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 sm:w-40 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
    </div>
    <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
      <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-7xl">
      <div className="mb-4 md:mb-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">
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

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await api.getAssets(false)
      const assetData = response?.data || response
      setAssets(assetData.assets || [])
    } catch (error) {
      console.error('Failed to load assets:', error)
      toast.error('Failed to load assets')
    } finally {
      setLoading(false)
    }
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
    toast.success('Asset created successfully')
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    loadAssets()
    toast.success('Asset updated successfully')
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return

    try {
      await api.deleteAsset(selectedAsset.id)
      setShowDeleteModal(false)
      setSelectedAsset(null)
      loadAssets()
      toast.success('Asset deleted successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete asset')
    }
  }

  // ✅ FIX: Properly handle category with default value
  const getAssetCategory = (asset: Asset): 'normal' | 'crypto' => {
    return asset.category || 'normal'
  }

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    // Category filter
    if (categoryFilter !== 'all') {
      const assetCategory = getAssetCategory(asset)
      if (assetCategory !== categoryFilter) return false
    }
    
    // Status filter
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

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Asset Management</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Asset Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Configure trading assets and settings</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-sm border ${
                  showFilters || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Filters</span>
                {(categoryFilter !== 'all' || statusFilter !== 'all') && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>

              {user.role === 'super_admin' && (
                <button
                  onClick={handleCreate}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg sm:rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm md:text-base"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Add Asset</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({assets.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter('normal')}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      categoryFilter === 'normal'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📊 Normal ({stats.normal})
                  </button>
                  <button
                    onClick={() => setCategoryFilter('crypto')}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      categoryFilter === 'crypto'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₿ Crypto ({stats.crypto})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      statusFilter === 'all'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({assets.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      statusFilter === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active ({stats.active})
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      statusFilter === 'inactive'
                        ? 'bg-gray-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Inactive ({assets.length - stats.active})
                  </button>
                </div>
              </div>
            </div>

            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                  className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Total</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Active</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">
              {stats.active}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-orange-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <span className="text-xs sm:text-sm text-orange-700 font-medium">Crypto</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-600">
              {stats.crypto}
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-yellow-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <span className="text-xs sm:text-sm text-yellow-700 font-medium">Ultra-Fast</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-600">
              {stats.ultraFast}
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {assets.length === 0 ? 'No assets configured' : 'No assets match filters'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {assets.length === 0 
                  ? 'Add your first trading asset to get started'
                  : 'Try adjusting your filters to see more assets'}
              </p>
              {assets.length === 0 && user.role === 'super_admin' && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add First Asset
                </button>
              )}
              {assets.length > 0 && (
                <button
                  onClick={() => {
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden sm:block divide-y divide-gray-100">
                {filteredAssets.map((asset) => {
                  const hasUltraFast = asset.tradingSettings?.allowedDurations.includes(0.0167)
                  const assetCategory = getAssetCategory(asset)
                  
                  return (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                          asset.isActive ? 'bg-green-50' : 'bg-gray-100'
                        }`}>
                          <Package className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            asset.isActive ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-base sm:text-lg text-gray-900">{asset.name}</span>
                            
                            {/* Category Badge */}
                            {assetCategory === 'crypto' ? (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-300 text-orange-700 rounded text-xs font-bold">
                                ₿ Crypto
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-700 rounded text-xs font-bold">
                                📊 Normal
                              </span>
                            )}
                            
                            {/* Ultra-Fast Badge */}
                            {hasUltraFast && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 text-yellow-700 rounded text-xs font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                1s
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                            <span className="font-medium">Symbol: {asset.symbol}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                              Profit: {asset.profitRate}%
                            </span>
                            <span>•</span>
                            <span className="capitalize">{asset.dataSource}</span>
                            {/* Crypto Pair Display */}
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

                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          asset.isActive 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {asset.isActive ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </span>

                        <button
                          onClick={() => handleViewDetail(asset)}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </button>

                        {user.role === 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleEdit(asset)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit Asset"
                            >
                              <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </button>

                            <button
                              onClick={() => handleDelete(asset)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Asset"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Mobile View */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredAssets.map((asset) => {
                  const hasUltraFast = asset.tradingSettings?.allowedDurations.includes(0.0167)
                  const assetCategory = getAssetCategory(asset)
                  
                  return (
                    <div
                      key={asset.id}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          asset.isActive ? 'bg-green-50' : 'bg-gray-100'
                        }`}>
                          <Package className={`w-6 h-6 ${
                            asset.isActive ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base text-gray-900 mb-1">{asset.name}</div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                              asset.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {asset.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                            
                            {/* Category Badge */}
                            {assetCategory === 'crypto' ? (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-300 text-orange-700 rounded-lg text-xs font-bold">
                                ₿
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg text-xs font-bold">
                                📊
                              </span>
                            )}
                            
                            {/* Ultra-Fast Badge */}
                            {hasUltraFast && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 text-yellow-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Symbol</span>
                          <span className="font-semibold text-gray-900">{asset.symbol}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Category</span>
                          <span className="font-medium text-gray-900">
                            {assetCategory === 'crypto' ? '₿ Crypto' : '📊 Normal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Profit Rate</span>
                          <span className="font-bold text-purple-600">{asset.profitRate}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Data Source</span>
                          <span className="font-medium text-gray-900 capitalize">{asset.dataSource}</span>
                        </div>
                        {asset.cryptoConfig && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Pair</span>
                            <span className="font-mono font-bold text-orange-600">
                              {asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}
                            </span>
                          </div>
                        )}
                        {hasUltraFast && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Ultra-Fast</span>
                            <span className="font-bold text-yellow-600 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              1 second
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(asset)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm font-semibold text-purple-700 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                        
                        {user.role === 'super_admin' && (
                          <>
                            <button
                              onClick={() => handleEdit(asset)}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-semibold text-blue-700 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(asset)}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-semibold text-red-700 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
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
          title="Delete Asset"
          message={`Are you sure you want to delete "${selectedAsset.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedAsset(null)
          }}
        />
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}