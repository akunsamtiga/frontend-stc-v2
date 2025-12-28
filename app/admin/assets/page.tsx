'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface Asset {
  id: string
  name: string
  symbol: string
  profitRate: number
  isActive: boolean
  dataSource: string
  description?: string
  createdAt: string
}

export default function AdminAssetsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

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

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading assets...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Asset Management</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Asset Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Configure trading assets and profit rates</p>
              </div>
            </div>

            <button
              onClick={() => toast.info('Create asset feature coming soon')}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Asset</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Total Assets</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{assets.length}</div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Active</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600">
              {assets.filter(a => a.isActive).length}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Avg Profit Rate</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600">
              {assets.length > 0 
                ? Math.round(assets.reduce((sum, a) => sum + a.profitRate, 0) / assets.length)
                : 0}%
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {assets.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No assets configured</h3>
              <p className="text-sm text-gray-500 mb-6">Add your first trading asset to get started</p>
              <button
                onClick={() => toast.info('Create asset feature coming soon')}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add First Asset
              </button>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden sm:block divide-y divide-gray-100">
                {assets.map((asset) => (
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
                        <div className="font-bold text-base sm:text-lg text-gray-900 mb-1">{asset.name}</div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                          <span className="font-medium">Symbol: {asset.symbol}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                            Profit: {asset.profitRate}%
                          </span>
                          <span>•</span>
                          <span className="capitalize">{asset.dataSource}</span>
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
                        onClick={() => toast.info('Edit feature coming soon')}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </button>

                      {user.role === 'super_admin' && (
                        <button
                          onClick={() => toast.info('Delete feature coming soon')}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile View */}
              <div className="sm:hidden space-y-3 p-3">
                {assets.map((asset) => (
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
                        <div className="flex items-center gap-2 mb-2">
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
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Symbol</span>
                        <span className="font-semibold text-gray-900">{asset.symbol}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Profit Rate</span>
                        <span className="font-bold text-purple-600">{asset.profitRate}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Data Source</span>
                        <span className="font-medium text-gray-900 capitalize">{asset.dataSource}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toast.info('Edit feature coming soon')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-semibold text-blue-700 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      
                      {user.role === 'super_admin' && (
                        <button
                          onClick={() => toast.info('Delete feature coming soon')}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-semibold text-red-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}