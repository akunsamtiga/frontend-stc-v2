'use client'

// ============================================================
// app/admin/affiliators/page.tsx
// Halaman Admin untuk mengelola program Affiliator
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  CurrencyDollar,
  ShareNetwork,
  CheckCircle,
  XCircle,
  Clock,
  ArrowsClockwise,
  MagnifyingGlass,
  Plus,
  Minus,
  Warning,
  ArrowLineUp,
  ToggleRight,
  ToggleLeft,
  X,
  PencilSimple,
} from 'phosphor-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import type {
  AffiliatorListItem,
  AdminCommissionWithdrawal,
  AssignAffiliatorDto,
  UpdateAffiliatorConfigDto,
  ApproveCommissionWithdrawalDto,
} from '@/types'

// ── Helpers ──────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function withdrawStatusMeta(status: string) {
  switch (status) {
    case 'pending':  return { label: 'Pending',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3.5 h-3.5" weight="fill" /> }
    case 'approved': return { label: 'Approved', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'completed':return { label: 'Selesai',  cls: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'rejected': return { label: 'Ditolak',  cls: 'bg-red-500/15 text-red-400 border-red-500/30',       icon: <XCircle className="w-3.5 h-3.5" weight="fill" /> }
    default:         return { label: status,     cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30',  icon: null }
  }
}

// ── Modal: Assign Affiliator ─────────────────────────────────

function AssignModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [userId, setUserId] = useState('')
  const [revenueShare, setRevenueShare] = useState('50')
  const [unlockThreshold, setUnlockThreshold] = useState('5')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!userId.trim()) { toast.error('User ID wajib diisi.'); return }
    setLoading(true)
    try {
      const dto: AssignAffiliatorDto = {
        revenueSharePercentage: Number(revenueShare),
        unlockThreshold: Number(unlockThreshold),
      }
      await api.adminAssignAffiliator(userId.trim(), dto)
      toast.success('User berhasil dijadikan affiliator!')
      onSuccess()
      onClose()
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" weight="bold" />
                Assign Affiliator
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">User ID</label>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user_abc123"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Revenue Share (%)</label>
                  <input
                    type="number"
                    value={revenueShare}
                    onChange={(e) => setRevenueShare(e.target.value)}
                    min={1} max={100}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 text-sm"
                  />
                  <p className="text-xs text-slate-600 mt-1">Default: 50%</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Unlock Threshold</label>
                  <input
                    type="number"
                    value={unlockThreshold}
                    onChange={(e) => setUnlockThreshold(e.target.value)}
                    min={1}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 text-sm"
                  />
                  <p className="text-xs text-slate-600 mt-1">Min. depositor</p>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3 text-xs text-purple-300/80">
                Affiliator mendapat <strong>{revenueShare}%</strong> dari kerugian trading invitee (real account) setelah <strong>{unlockThreshold}</strong> invitee deposit.
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssign}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> : <Plus className="w-4 h-4" weight="bold" />}
                  {loading ? 'Memproses...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Modal: Edit Config ────────────────────────────────────────

function EditConfigModal({
  affiliator,
  onClose,
  onSuccess,
}: {
  affiliator: AffiliatorListItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [revenueShare, setRevenueShare] = useState(String(affiliator.revenueSharePercentage))
  const [unlockThreshold, setUnlockThreshold] = useState(String(affiliator.unlockThreshold))
  const [isActive, setIsActive] = useState(affiliator.isActive)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const dto: UpdateAffiliatorConfigDto = {
        revenueSharePercentage: Number(revenueShare),
        unlockThreshold: Number(unlockThreshold),
        isActive,
      }
      await api.adminUpdateAffiliatorConfig(affiliator.id, dto)
      toast.success('Konfigurasi affiliator diperbarui.')
      onSuccess()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PencilSimple className="w-5 h-5 text-blue-400" weight="bold" />
                Edit Konfigurasi
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" weight="bold" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">{affiliator.userEmail} · <span className="font-mono text-purple-300">{affiliator.affiliateCode}</span></p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Revenue Share (%)</label>
                  <input
                    type="number" value={revenueShare}
                    onChange={(e) => setRevenueShare(e.target.value)}
                    min={1} max={100}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Unlock Threshold</label>
                  <input
                    type="number" value={unlockThreshold}
                    onChange={(e) => setUnlockThreshold(e.target.value)}
                    min={1}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800 border border-white/10 rounded-xl">
                <span className="text-sm text-slate-300">Status Program</span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isActive ? <ToggleRight className="w-4 h-4" weight="fill" /> : <ToggleLeft className="w-4 h-4" weight="fill" />}
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-semibold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> : <CheckCircle className="w-4 h-4" weight="bold" />}
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Modal: Approve/Reject Commission Withdrawal ───────────────

function ApproveWithdrawModal({
  withdrawal,
  onClose,
  onSuccess,
}: {
  withdrawal: AdminCommissionWithdrawal
  onClose: () => void
  onSuccess: () => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const dto: ApproveCommissionWithdrawalDto = {
        approve,
        adminNotes: adminNotes || undefined,
        rejectionReason: !approve ? rejectionReason : undefined,
      }
      await api.adminApproveCommissionWithdrawal(withdrawal.id, dto)
      toast.success(approve ? 'Penarikan disetujui!' : 'Penarikan ditolak.')
      onSuccess()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Review Penarikan Komisi</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" weight="bold" /></button>
            </div>

            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Affiliator</span>
                <span className="text-slate-300">{withdrawal.affiliatorEmail || withdrawal.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah</span>
                <span className="text-white font-bold">{formatRupiah(withdrawal.amount)}</span>
              </div>
              {withdrawal.bankAccount && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Rekening</span>
                  <span className="text-slate-300 text-right">{withdrawal.bankAccount.bankName} · {withdrawal.bankAccount.accountNumber}</span>
                </div>
              )}
              {withdrawal.note && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Catatan</span>
                  <span className="text-slate-400 italic">{withdrawal.note}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Catatan Admin (opsional)</label>
                <input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Approved and transferred"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Alasan Penolakan (wajib jika tolak)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="Dokumen tidak valid / saldo tidak cukup"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handle(false)}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-30 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition-colors"
              >
                <XCircle className="w-4 h-4" weight="bold" />
                Tolak
              </button>
              <button
                onClick={() => handle(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/15 hover:bg-green-500/25 disabled:opacity-30 text-green-400 border border-green-500/30 rounded-xl font-semibold text-sm transition-colors"
              >
                {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> : <CheckCircle className="w-4 h-4" weight="bold" />}
                Setujui
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function AdminAffiliatorsPage() {
  const [activeTab, setActiveTab] = useState<'affiliators' | 'withdrawals'>('affiliators')

  // Affiliators state
  const [affiliators, setAffiliators] = useState<AffiliatorListItem[]>([])
  const [affiliatorsLoading, setAffiliatorsLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<AdminCommissionWithdrawal[]>([])
  const [withdrawSummary, setWithdrawSummary] = useState<any>(null)
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editTarget, setEditTarget] = useState<AffiliatorListItem | null>(null)
  const [reviewTarget, setReviewTarget] = useState<AdminCommissionWithdrawal | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // ── Fetch affiliators ────────────────────────────────────

  const fetchAffiliators = useCallback(async () => {
    setAffiliatorsLoading(true)
    try {
      const res = await api.adminGetAllAffiliators({ isActive: filterActive })
      setAffiliators(res.data!.affiliators)
    } catch {
      toast.error('Gagal memuat daftar affiliator.')
    } finally {
      setAffiliatorsLoading(false)
    }
  }, [filterActive])

  useEffect(() => {
    fetchAffiliators()
  }, [fetchAffiliators])

  // ── Fetch withdrawals ────────────────────────────────────

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true)
    try {
      const res = await api.adminGetCommissionWithdrawals({ status: filterStatus || undefined })
      setWithdrawals(res.data!.withdrawals)
      setWithdrawSummary(res.data!.summary)
    } catch {
      toast.error('Gagal memuat daftar penarikan.')
    } finally {
      setWithdrawalsLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals()
  }, [activeTab, fetchWithdrawals])

  // ── Revoke ───────────────────────────────────────────────

  const handleRevoke = async (aff: AffiliatorListItem) => {
    if (!confirm(`Cabut status affiliator ${aff.userEmail}?`)) return
    setRevokingId(aff.userId)
    try {
      await api.adminRevokeAffiliator(aff.userId)
      toast.success('Status affiliator dicabut.')
      fetchAffiliators()
    } catch {
    } finally {
      setRevokingId(null)
    }
  }

  // ── Filtered affiliators ─────────────────────────────────

  const filteredAffiliators = affiliators.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.userEmail.toLowerCase().includes(q) || a.affiliateCode.toLowerCase().includes(q)
  })

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShareNetwork className="w-7 h-7 text-purple-400" weight="duotone" />
              Manajemen Affiliator
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Assign, monitor, dan kelola penarikan komisi affiliator.
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" weight="bold" />
            Assign Affiliator
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-800/40 border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'affiliators', label: 'Affiliators', icon: ShareNetwork },
            { key: 'withdrawals', label: 'Penarikan Komisi', icon: ArrowLineUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" weight={activeTab === key ? 'fill' : 'regular'} />
              {label}
              {key === 'withdrawals' && withdrawSummary?.pending > 0 && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold">
                  {withdrawSummary.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════ */}
        {/* Tab: Affiliators                                 */}
        {/* ════════════════════════════════════════════════ */}
        {activeTab === 'affiliators' && (
          <div>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" weight="bold" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari email atau kode..."
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <select
                value={filterActive === undefined ? '' : String(filterActive)}
                onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                className="bg-slate-800/50 border border-white/10 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            {affiliatorsLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : filteredAffiliators.length === 0 ? (
              <div className="text-center py-16">
                <ShareNetwork className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Belum ada affiliator.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAffiliators.map((aff) => (
                  <div
                    key={aff.id}
                    className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Left info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-semibold truncate">{aff.userEmail}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            aff.isActive
                              ? 'bg-green-500/15 text-green-400 border-green-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}>
                            {aff.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                          {aff.isCommissionUnlocked && (
                            <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-500/15 text-purple-400 border-purple-500/30">
                              Unlock ✓
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                          <span className="font-mono text-purple-300/80 tracking-wider">{aff.affiliateCode}</span>
                          <span className="mx-1">·</span>
                          <span>{aff.revenueSharePercentage}% share</span>
                          <span className="mx-1">·</span>
                          <span>Threshold: {aff.unlockThreshold}</span>
                        </div>

                        {/* Mini stats */}
                        <div className="flex gap-4 flex-wrap text-xs">
                          <div>
                            <span className="text-slate-500">Undangan: </span>
                            <span className="text-white font-medium">{aff.totalInvited}</span>
                            <span className="text-green-400"> ({aff.depositedInvites} deposit)</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Total Komisi: </span>
                            <span className="text-purple-400 font-medium">{formatRupiah(aff.totalCommissionEarned)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Saldo: </span>
                            <span className="text-white font-medium">{formatRupiah(aff.commissionBalance)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditTarget(aff)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          <PencilSimple className="w-3.5 h-3.5" weight="bold" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleRevoke(aff)}
                          disabled={revokingId === aff.userId || !aff.isActive}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          {revokingId === aff.userId ? (
                            <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" weight="bold" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" weight="bold" />
                          )}
                          Cabut
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════ */}
        {/* Tab: Withdrawals                                 */}
        {/* ════════════════════════════════════════════════ */}
        {activeTab === 'withdrawals' && (
          <div>
            {/* Summary chips */}
            {withdrawSummary && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {[
                  { label: 'Total', value: withdrawSummary.total, cls: 'border-white/10 text-slate-300 bg-slate-700/30' },
                  { label: 'Pending', value: withdrawSummary.pending, cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
                  { label: 'Approved', value: withdrawSummary.approved, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
                  { label: 'Selesai', value: withdrawSummary.completed, cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
                  { label: 'Ditolak', value: withdrawSummary.rejected, cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`px-4 py-1.5 rounded-xl border text-sm font-medium ${cls}`}>
                    {label}: <span className="font-bold">{value}</span>
                  </div>
                ))}
                <div className="px-4 py-1.5 rounded-xl border text-sm font-medium bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Total: <span className="font-bold">{formatRupiah(withdrawSummary.totalAmount ?? 0)}</span>
                </div>
              </div>
            )}

            {/* Status filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['', 'pending', 'approved', 'completed', 'rejected'].map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    filterStatus === s
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {withdrawalsLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-16">
                <ArrowLineUp className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Tidak ada request penarikan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => {
                  const st = withdrawStatusMeta(w.status)
                  return (
                    <div key={w.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white font-bold">{formatRupiah(w.amount)}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${st.cls}`}>
                              {st.icon}{st.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-0.5">
                            {w.affiliatorEmail || w.userEmail}
                          </p>
                          {w.bankAccount && (
                            <p className="text-xs text-slate-500">
                              {w.bankAccount.bankName} · {w.bankAccount.accountNumber} · {w.bankAccount.accountHolderName}
                            </p>
                          )}
                          {w.note && <p className="text-xs text-slate-500 mt-0.5 italic">"{w.note}"</p>}
                          {w.rejectionReason && (
                            <p className="text-xs text-red-400 mt-0.5">Ditolak: {w.rejectionReason}</p>
                          )}
                          {w.adminNotes && (
                            <p className="text-xs text-blue-400/80 mt-0.5">Admin: {w.adminNotes}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-1">{formatDate(w.createdAt)}</p>
                        </div>

                        {w.status === 'pending' && (
                          <button
                            onClick={() => setReviewTarget(w)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" weight="bold" />
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchAffiliators}
        />
      )}
      {editTarget && (
        <EditConfigModal
          affiliator={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchAffiliators}
        />
      )}
      {reviewTarget && (
        <ApproveWithdrawModal
          withdrawal={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={fetchWithdrawals}
        />
      )}
    </div>
  )
}