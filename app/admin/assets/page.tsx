'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Asset } from '@/types'
import { formatDate } from '@/lib/utils'
import { Package, Edit2, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminAssetsPage() {
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [profitRate, setProfitRate] = useState(80)
  const [dataSource, setDataSource] = useState<'realtime_db' | 'api' | 'mock'>('realtime_db')
  const [realtimeDbPath, setRealtimeDbPath] = useState('')
  const [apiEndpoint, setApiEndpoint] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push('/')
      return
    }
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      router.push('/trading')
      return
    }

    loadAssets()
  }, [currentUser, router])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const response = await api.getAssets(false)
      const assetsList = response?.data?.assets || response?.assets || []
      setAssets(assetsList)
    } catch (error) {
      console.error('Failed to load assets:', error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const assetData: any = {
        name,
        symbol,
        profitRate,
        dataSource,
        description,
        isActive,
      }

      if (dataSource === 'realtime_db') {
        assetData.realtimeDbPath = realtimeDbPath
      } else if (dataSource === 'api') {
        assetData.apiEndpoint = apiEndpoint
      }

      await api.createAsset(assetData)
      toast.success('Asset created successfully!')
      resetForm()
      setShowCreateModal(false)
      loadAssets()
    } catch (error) {
      console.error('Failed to create asset:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    setSubmitting(true)
    try {
      const assetData: any = {
        name,
        symbol,
        profitRate,
        dataSource,
        description,
        isActive,
      }

      if (dataSource === 'realtime_db') {
        assetData.realtimeDbPath = realtimeDbPath
      } else if (dataSource === 'api') {
        assetData.apiEndpoint = apiEndpoint
      }

      await api.updateAsset(selectedAsset.id, assetData)
      toast.success('Asset updated successfully!')
      resetForm()
      setShowEditModal(false)
      loadAssets()
    } catch (error) {
      console.error('Failed to update asset:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.name}?`)) return

    try {
      await api.deleteAsset(asset.id)
      toast.success('Asset deleted successfully!')
      loadAssets()
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  const openEditModal = (asset: Asset) => {
    setSelectedAsset(asset)
    setName(asset.name)
    setSymbol(asset.symbol)
    setProfitRate(asset.profitRate)
    setDataSource(asset.dataSource)
    setRealtimeDbPath(asset.realtimeDbPath || '')
    setApiEndpoint(asset.apiEndpoint || '')
    setDescription(asset.description || '')
    setIsActive(asset.isActive)
    setShowEditModal(true)
  }

  const resetForm = () => {
    setName('')
    setSymbol('')
    setProfitRate(80)
    setDataSource('realtime_db')
    setRealtimeDbPath('')
    setApiEndpoint('')
    setDescription('')
    setIsActive(true)
    setSelectedAsset(null)
  }

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Asset
          </button>
        </div>

        {/* Assets Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No assets found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Asset</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Symbol</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Profit Rate</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Data Source</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Created</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-gray-700/50 hover:bg-background-tertiary transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            {asset.description && (
                              <div className="text-xs text-gray-400">{asset.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-sm">{asset.symbol}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-3 py-1 bg-success/20 text-success rounded-full text-sm font-bold">
                          {asset.profitRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-400 capitalize">
                          {asset.dataSource.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {asset.isActive ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-danger">
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {formatDate(asset.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(asset)}
                            className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="p-2 hover:bg-danger/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-4">Create New Asset</h2>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Asset Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., IDX STC"
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                    placeholder="e.g., IDX_STC"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Profit Rate (%)</label>
                <input
                  type="number"
                  value={profitRate}
                  onChange={(e) => setProfitRate(Number(e.target.value))}
                  required
                  min="1"
                  max="100"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Data Source</label>
                <select value={dataSource} onChange={(e) => setDataSource(e.target.value as any)}>
                  <option value="realtime_db">Firebase Realtime DB</option>
                  <option value="api">External API</option>
                  <option value="mock">Mock Data</option>
                </select>
              </div>

              {dataSource === 'realtime_db' && (
                <div className="input-group">
                  <label className="input-label">Firebase DB Path</label>
                  <input
                    type="text"
                    value={realtimeDbPath}
                    onChange={(e) => setRealtimeDbPath(e.target.value)}
                    required
                    placeholder="/idx_stc/current_price"
                  />
                </div>
              )}

              {dataSource === 'api' && (
                <div className="input-group">
                  <label className="input-label">API Endpoint</label>
                  <input
                    type="url"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    required
                    placeholder="https://api.example.com/price"
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the asset..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="createIsActive" className="text-sm">Active Asset</label>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create Asset'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-4">Edit Asset</h2>
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Asset Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Profit Rate (%)</label>
                <input
                  type="number"
                  value={profitRate}
                  onChange={(e) => setProfitRate(Number(e.target.value))}
                  required
                  min="1"
                  max="100"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Data Source</label>
                <select value={dataSource} onChange={(e) => setDataSource(e.target.value as any)}>
                  <option value="realtime_db">Firebase Realtime DB</option>
                  <option value="api">External API</option>
                  <option value="mock">Mock Data</option>
                </select>
              </div>

              {dataSource === 'realtime_db' && (
                <div className="input-group">
                  <label className="input-label">Firebase DB Path</label>
                  <input
                    type="text"
                    value={realtimeDbPath}
                    onChange={(e) => setRealtimeDbPath(e.target.value)}
                    required
                  />
                </div>
              )}

              {dataSource === 'api' && (
                <div className="input-group">
                  <label className="input-label">API Endpoint</label>
                  <input
                    type="url"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="editIsActive" className="text-sm">Active Asset</label>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Updating...' : 'Update Asset'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}