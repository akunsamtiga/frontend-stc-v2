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
  TrendingUp
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
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-400">Loading assets...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold">Asset Management</h1>
            </div>
            <p className="text-gray-400">Configure trading assets and profit rates</p>
          </div>

          <button
            onClick={() => toast.info('Create asset feature coming soon')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Asset</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Assets</span>
            </div>
            <div className="text-3xl font-bold">{assets.length}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {assets.filter(a => a.isActive).length}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-gray-400">Avg Profit Rate</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {assets.length > 0 
                ? Math.round(assets.reduce((sum, a) => sum + a.profitRate, 0) / assets.length)
                : 0}%
            </div>
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          {assets.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
              <p className="text-gray-400 mb-1">No assets configured</p>
              <p className="text-sm text-gray-500">Add your first trading asset to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-6 hover:bg-[#1a1f2e] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      asset.isActive ? 'bg-green-500/10' : 'bg-gray-500/10'
                    }`}>
                      <Package className={`w-6 h-6 ${
                        asset.isActive ? 'text-green-400' : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div>
                      <div className="font-bold text-lg mb-1">{asset.name}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>Symbol: {asset.symbol}</span>
                        <span>•</span>
                        <span>Profit: {asset.profitRate}%</span>
                        <span>•</span>
                        <span className="capitalize">{asset.dataSource}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      asset.isActive 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-gray-500/10 text-gray-400'
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
                      className="p-2 hover:bg-[#232936] rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>

                    {user.role === 'super_admin' && (
                      <button
                        onClick={() => toast.info('Delete feature coming soon')}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}