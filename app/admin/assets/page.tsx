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
  PencilSimple, 
  Trash,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Lightning,
  CurrencyCircleDollar,
  ArrowsClockwise
} from 'phosphor-react'
import { toast } from 'sonner'
import { TimezoneUtil } from '@/lib/utils'
import type { Asset } from '@/types'

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-xl p-3 border border-white/10 animate-pulse">
    <div className="h-3 bg-white/10 rounded w-12 mb-2"></div>
    <div className="h-6 bg-white/10 rounded w-10"></div>
  </div>
)

const AssetCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-48"></div>
      </div>
      <div className="flex gap-1">
        <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
        <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
    <Navbar />
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-5 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-40 mb-1.5"></div>
        <div className="h-3 bg-white/10 rounded w-56"></div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <AssetCardSkeleton key={i} />)}
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
  
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'normal' | 'crypto'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (user.role !== 'super_admin' && user.role !== 'admin') { router.push('/trading'); return }
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

  const handleRefresh       = () => loadAssets(true)
  const handleCreate        = () => { setSelectedAsset(null); setShowCreateModal(true) }
  const handleEdit          = (a: Asset) => { setSelectedAsset(a); setShowEditModal(true) }
  const handleViewDetail    = (a: Asset) => { setSelectedAsset(a); setShowDetailModal(true) }
  const handleDelete        = (a: Asset) => { setSelectedAsset(a); setShowDeleteModal(true) }
  const handleCreateSuccess = () => { setShowCreateModal(false); loadAssets(); toast.success('Aset berhasil dibuat') }
  const handleEditSuccess   = () => { setShowEditModal(false); loadAssets(); toast.success('Aset berhasil diperbarui') }

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

  const getAssetCategory = (a: Asset): 'normal' | 'crypto' => a.category || 'normal'

  const filteredAssets = assets.filter((a) => {
    if (categoryFilter !== 'all' && getAssetCategory(a) !== categoryFilter) return false
    if (statusFilter === 'active' && !a.isActive) return false
    if (statusFilter === 'inactive' && a.isActive) return false
    return true
  })

  const stats = {
    total:     assets.length,
    active:    assets.filter(a => a.isActive).length,
    crypto:    assets.filter(a => getAssetCategory(a) === 'crypto').length,
    ultraFast: assets.filter(a => a.tradingSettings?.allowedDurations.includes(0.0167)).length,
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null
  if (loading && !refreshing) return <LoadingSkeleton />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Manajemen Aset</h1>
            <p className="text-sm text-slate-400 mt-0.5">Konfigurasi aset trading dan pengaturan</p>
            {lastUpdated && (
              <p className="text-sm text-slate-600 mt-0.5">
                Update: {TimezoneUtil.formatDateTime(lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <ArrowsClockwise
                className={`w-4 h-4 text-slate-300 ${refreshing ? 'animate-spin' : ''}`}
                weight="bold"
              />
            </button>
            {/* DISABLED: Tombol Create Asset
            {user.role === 'super_admin' && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Tambah
              </button>
            )}
            */}
          </div>
        </div>

        {/* ── STATS — 4 kolom, 1 baris ── */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Total',      value: stats.total,     color: 'text-white',      iconBg: 'bg-blue-500/10',   icon: <Package              className="w-3.5 h-3.5 text-blue-400"    weight="duotone" /> },
            { label: 'Aktif',      value: stats.active,    color: 'text-green-400',  iconBg: 'bg-green-500/10',  icon: <CheckCircle          className="w-3.5 h-3.5 text-green-400"   weight="duotone" /> },
            { label: 'Crypto',     value: stats.crypto,    color: 'text-orange-400', iconBg: 'bg-orange-500/10', icon: <CurrencyCircleDollar className="w-3.5 h-3.5 text-orange-400"  weight="duotone" /> },
            { label: 'Ultra-Fast', value: stats.ultraFast, color: 'text-yellow-400', iconBg: 'bg-yellow-500/10', icon: <Lightning            className="w-3.5 h-3.5 text-yellow-400"  weight="duotone" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${s.iconBg}`}>
                  {s.icon}
                </div>
                <span className="text-sm text-slate-500 font-medium truncate">{s.label}</span>
              </div>
              <div className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Filter Kategori */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1 border border-white/10">
            {(['all', 'normal', 'crypto'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? cat === 'crypto' ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat === 'normal' ? 'Normal' : 'Crypto'}
              </button>
            ))}
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1 border border-white/10">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  statusFilter === st
                    ? st === 'active' ? 'bg-green-600 text-white shadow-sm'
                      : st === 'inactive' ? 'bg-slate-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Semua' : st === 'active' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>

          <span className="ml-auto text-sm text-slate-500">
            {filteredAssets.length} / {assets.length} aset
          </span>
        </div>

        {/* ── ASSET LIST ── */}
        {loading ? (
          <div className="text-center py-14">
            <ArrowsClockwise className="w-7 h-7 animate-spin text-slate-500 mx-auto mb-3" weight="bold" />
            <p className="text-sm text-slate-400">Memuat aset...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10">
              <Package className="w-7 h-7 text-slate-500" weight="duotone" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              {assets.length === 0 ? 'Belum ada aset' : 'Tidak ada hasil'}
            </p>
            <p className="text-sm text-slate-500 mb-5">
              {assets.length === 0 ? 'Tambahkan aset trading pertama' : 'Coba ubah filter pencarian'}
            </p>
            {/* DISABLED: Tombol Create Asset (empty state)
            {assets.length === 0 && user.role === 'super_admin' && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Tambah Aset
              </button>
            )}
            */}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => {
              const hasUltraFast  = asset.tradingSettings?.allowedDurations.includes(0.0167)
              const assetCategory = getAssetCategory(asset)

              return (
                <div
                  key={asset.id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.08] transition-colors"
                >
                  {/* Baris utama */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Ikon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      asset.isActive ? 'bg-green-500/10' : 'bg-white/5'
                    }`}>
                      <Package
                        className={`w-5 h-5 ${asset.isActive ? 'text-green-400' : 'text-slate-500'}`}
                        weight="duotone"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Baris nama */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white">{asset.name}</span>
                        <span className="text-sm text-slate-500">({asset.symbol})</span>
                      </div>

                      {/* Baris badges & meta */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status */}
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-sm font-semibold border ${
                          asset.isActive
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10   text-red-400   border-red-500/20'
                        }`}>
                          {asset.isActive
                            ? <><CheckCircle className="w-2.5 h-2.5" weight="fill" /> Aktif</>
                            : <><XCircle    className="w-2.5 h-2.5" weight="fill" /> Nonaktif</>
                          }
                        </span>

                        {/* Kategori */}
                        {assetCategory === 'crypto'
                          ? <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-sm font-semibold">₿ Crypto</span>
                          : <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-500/10   border border-blue-500/20   text-blue-400   rounded text-sm font-semibold">📊 Normal</span>
                        }

                        {/* Ultra-fast */}
                        {hasUltraFast && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-sm font-semibold">
                            <Lightning className="w-2.5 h-2.5" weight="fill" /> 1s
                          </span>
                        )}

                        {/* Profit */}
                        <span className="inline-flex items-center gap-0.5 text-sm text-slate-400">
                          <Activity className="w-3 h-3" weight="duotone" />
                          {asset.profitRate}%
                        </span>

                        {/* Data source — desktop only */}
                        <span className="text-sm text-slate-500 capitalize hidden sm:inline">{asset.dataSource}</span>

                        {/* Crypto pair */}
                        {asset.cryptoConfig && (
                          <span className="text-sm font-semibold text-slate-300">
                            {asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tombol aksi */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleViewDetail(asset)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" weight="duotone" />
                      </button>
                      {user.role === 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleEdit(asset)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                            title="Edit"
                          >
                            <PencilSimple className="w-4 h-4" weight="duotone" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" weight="duotone" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Baris bawah: info order */}
                  {asset.tradingSettings && (
                    <div className="flex items-center gap-0 border-t border-white/[0.06] divide-x divide-white/[0.06]">
                      {[
                        { label: 'Min', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(asset.tradingSettings.minOrderAmount) },
                        { label: 'Max', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(asset.tradingSettings.maxOrderAmount) },
                        { label: 'Durasi', value: `${asset.tradingSettings.allowedDurations.length} opsi` },
                      ].map((item) => (
                        <div key={item.label} className="flex-1 px-3 py-2 text-center">
                          <div className="text-sm text-slate-500 uppercase tracking-wide mb-0.5">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <AssetFormModal mode="create" onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
      )}
      {showEditModal && selectedAsset && (
        <AssetFormModal mode="edit" asset={selectedAsset} onClose={() => setShowEditModal(false)} onSuccess={handleEditSuccess} />
      )}
      {showDetailModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setShowDetailModal(false)}
          onEdit={user.role === 'super_admin' ? () => { setShowDetailModal(false); handleEdit(selectedAsset) } : undefined}
        />
      )}
      {showDeleteModal && selectedAsset && (
        <DeleteConfirmModal
          title="Hapus Aset"
          message={`Apakah Anda yakin ingin menghapus "${selectedAsset.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setSelectedAsset(null) }}
        />
      )}
    </div>
  )
}