'use client'

// ============================================================
// app/affiliate/page.tsx
// Dashboard Affiliator untuk user yang sudah di-assign
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  CurrencyDollar,
  Lock,
  LockOpen,
  ArrowLineUp,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ArrowsClockwise,
  Warning,
  ChartBar,
  ShareNetwork,
  X,
} from 'phosphor-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import type {
  AffiliatorDashboard,
  AffiliatorInvite,
  CommissionLog,
  CommissionWithdrawal,
  CommissionWithdrawalHistory,
  RequestCommissionWithdrawalDto,
} from '@/types'

// ── Helpers ──────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: CommissionWithdrawal['status']): {
  label: string
  cls: string
  icon: React.ReactNode
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3.5 h-3.5" weight="fill" /> }
    case 'approved':
      return { label: 'Approved', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'completed':
      return { label: 'Selesai', cls: 'bg-green-500/15 text-green-400 border-green-500/30', icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'rejected':
      return { label: 'Ditolak', cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <XCircle className="w-3.5 h-3.5" weight="fill" /> }
  }
}

// ── Component ─────────────────────────────────────────────────

export default function AffiliatePage() {
  const router = useRouter()

  // Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invites' | 'commissions' | 'withdrawals'>('dashboard')

  // Data state
  const [dashboard, setDashboard] = useState<AffiliatorDashboard | null>(null)
  const [invites, setInvites] = useState<AffiliatorInvite[]>([])
  const [inviteSummary, setInviteSummary] = useState({ total: 0, deposited: 0, pending: 0 })
  const [commissions, setCommissions] = useState<CommissionLog[]>([])
  const [commissionDetails, setCommissionDetails] = useState<Omit<CommissionLog, never> | null>(null)
  const [withdrawalHistory, setWithdrawalHistory] = useState<CommissionWithdrawalHistory | null>(null)

  // UI state
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error403, setError403] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ── Fetch dashboard (utama) ───────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getMyAffiliatorProgram()
      setDashboard(res.data ?? null)
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError403(true)
      } else {
        toast.error('Gagal memuat data program affiliator.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // ── Fetch per-tab ─────────────────────────────────────────

  const fetchInvites = useCallback(async () => {
    setTabLoading(true)
    try {
      const res = await api.getMyAffiliatorInvites()
      setInvites(res.data!.invites)
      setInviteSummary({ total: res.data!.total, deposited: res.data!.deposited, pending: res.data!.pending })
    } catch {
      toast.error('Gagal memuat daftar undangan.')
    } finally {
      setTabLoading(false)
    }
  }, [])

  const fetchCommissions = useCallback(async () => {
    setTabLoading(true)
    try {
      const res = await api.getMyCommissions()
      setCommissions(res.data!.commissionLogs)
      setCommissionDetails(res.data as any)
    } catch {
      toast.error('Gagal memuat riwayat komisi.')
    } finally {
      setTabLoading(false)
    }
  }, [])

  const fetchWithdrawals = useCallback(async () => {
    setTabLoading(true)
    try {
      const res = await api.getMyCommissionWithdrawals()
      setWithdrawalHistory(res.data ?? null)
    } catch {
      toast.error('Gagal memuat riwayat penarikan.')
    } finally {
      setTabLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'invites' && invites.length === 0) fetchInvites()
    if (activeTab === 'commissions' && commissions.length === 0) fetchCommissions()
    if (activeTab === 'withdrawals' && !withdrawalHistory) fetchWithdrawals()
  }, [activeTab]) // eslint-disable-line

  // ── Copy referral code ────────────────────────────────────

  const copyCode = () => {
    if (!dashboard?.affiliateCode) return
    navigator.clipboard.writeText(dashboard.affiliateCode)
    setCopied(true)
    toast.success('Kode referral disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Request withdrawal ────────────────────────────────────

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount < 50000) {
      toast.error('Minimal penarikan Rp 50.000')
      return
    }
    setWithdrawLoading(true)
    try {
      await api.requestCommissionWithdrawal({ amount, note: withdrawNote || undefined } as RequestCommissionWithdrawalDto)
      toast.success('Request penarikan berhasil diajukan!')
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setWithdrawNote('')
      // refresh
      fetchDashboard()
      if (activeTab === 'withdrawals') fetchWithdrawals()
    } catch {
      // error toast sudah dari interceptor
    } finally {
      setWithdrawLoading(false)
    }
  }

  // ── Cancel withdrawal ─────────────────────────────────────

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await api.cancelCommissionWithdrawal(id)
      toast.success('Request penarikan dibatalkan.')
      fetchWithdrawals()
      fetchDashboard()
    } catch {
      // handled
    } finally {
      setCancellingId(null)
    }
  }

  // ── Render states ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ArrowsClockwise className="w-10 h-10 text-purple-400 animate-spin" weight="bold" />
          <p className="text-slate-400 text-sm">Memuat program affiliator...</p>
        </div>
      </div>
    )
  }

  if (error403) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <ShareNetwork className="w-10 h-10 text-purple-400" weight="duotone" />
          </div>
          <h2 className="text-xl font-bold text-white">Program Affiliator Belum Aktif</h2>
          <p className="text-slate-400 text-center max-w-md text-sm">
            Akun Anda belum terdaftar sebagai affiliator. Hubungi Super Admin untuk mendapatkan kode referral eksklusif.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors text-sm"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  const { affiliateCode, isCommissionUnlocked, revenueSharePercentage, balances, unlockProgress, stats } = dashboard

  // ── Tab config ────────────────────────────────────────────

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: ChartBar },
    { key: 'invites',   label: `Undangan (${stats.totalInvited})`, icon: Users },
    { key: 'commissions', label: 'Komisi', icon: CurrencyDollar },
    { key: 'withdrawals', label: 'Penarikan', icon: ArrowLineUp },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />

      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShareNetwork className="w-7 h-7 text-purple-400" weight="duotone" />
              Program Affiliator
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Undang pengguna baru dan dapatkan komisi dari trading mereka.
            </p>
          </div>

          {/* Referral code card */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5">
            <div>
              <p className="text-xs text-slate-500">Kode Referral Anda</p>
              <p className="text-lg font-bold text-purple-300 tracking-widest">{affiliateCode}</p>
            </div>
            <button
              onClick={copyCode}
              className="ml-2 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors"
              title="Salin kode"
            >
              {copied ? <CheckCircle className="w-5 h-5" weight="fill" /> : <Copy className="w-5 h-5" weight="bold" />}
            </button>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-800/40 border border-white/10 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" weight={activeTab === key ? 'fill' : 'regular'} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Dashboard ─────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Undangan', value: stats.totalInvited, icon: Users, color: 'blue' },
                { label: 'Sudah Deposit', value: stats.depositedInvites, icon: CheckCircle, color: 'green' },
                { label: 'Total Komisi', value: formatRupiah(stats.totalCommissionEarned), icon: CurrencyDollar, color: 'purple', isText: true },
                { label: 'Sudah Dicairkan', value: formatRupiah(stats.totalCommissionWithdrawn), icon: ArrowLineUp, color: 'orange', isText: true },
              ].map(({ label, value, icon: Icon, color, isText }) => (
                <div key={label} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    color === 'blue'   ? 'bg-blue-500/15 text-blue-400'     :
                    color === 'green'  ? 'bg-green-500/15 text-green-400'   :
                    color === 'purple' ? 'bg-purple-500/15 text-purple-400' :
                                        'bg-orange-500/15 text-orange-400'
                  }`}>
                    <Icon className="w-5 h-5" weight="duotone" />
                  </div>
                  <p className={`font-bold ${isText ? 'text-base' : 'text-2xl'} text-white`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Commission balance + unlock progress */}
            <div className="grid lg:grid-cols-2 gap-4">

              {/* Balance card */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isCommissionUnlocked ? (
                      <LockOpen className="w-5 h-5 text-green-400" weight="duotone" />
                    ) : (
                      <Lock className="w-5 h-5 text-yellow-400" weight="duotone" />
                    )}
                    <h3 className="font-semibold text-white">Saldo Komisi</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                    isCommissionUnlocked
                      ? 'bg-green-500/15 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {isCommissionUnlocked ? 'Terbuka' : 'Terkunci'}
                  </span>
                </div>

                <p className="text-3xl font-bold text-white mb-1">
                  {formatRupiah(balances.commissionBalance)}
                </p>
                <p className="text-xs text-slate-500 mb-4">Saldo tersedia untuk dicairkan</p>

                {balances.lockedCommissionBalance > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                    <Lock className="w-4 h-4 flex-shrink-0" weight="duotone" />
                    <span>{formatRupiah(balances.lockedCommissionBalance)} masih terkunci</span>
                  </div>
                )}

                <p className="text-xs text-slate-500 mb-3">
                  Revenue share: <span className="text-purple-400 font-semibold">{revenueSharePercentage}%</span> dari kerugian invitee
                </p>

                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={!isCommissionUnlocked || balances.commissionBalance < 50000}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-white/5 disabled:text-slate-500 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <ArrowLineUp className="w-4 h-4" weight="bold" />
                  Cairkan Komisi
                </button>
              </div>

              {/* Unlock progress card */}
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-1">Progress Unlock</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Undang {unlockProgress.required} user yang melakukan deposit untuk membuka saldo komisi.
                </p>

                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-bold text-white">{unlockProgress.current}</span>
                  <span className="text-slate-400 text-lg mb-1">/ {unlockProgress.required}</span>
                  <span className="text-xs text-slate-500 mb-1.5">depositor</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      unlockProgress.isUnlocked ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(unlockProgress.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {unlockProgress.isUnlocked ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" weight="fill" />
                      <span className="text-green-400 font-medium">Komisi sudah terbuka!</span>
                    </>
                  ) : (
                    <>
                      <Warning className="w-4 h-4 text-yellow-400" weight="fill" />
                      <span className="text-slate-400 text-xs">{unlockProgress.message}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Invites ────────────────────────────────── */}
        {activeTab === 'invites' && (
          <div>
            {/* Summary chips */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {[
                { label: 'Total', value: inviteSummary.total, cls: 'bg-slate-700/50 text-slate-300 border-white/10' },
                { label: 'Sudah Deposit', value: inviteSummary.deposited, cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
                { label: 'Belum Deposit', value: inviteSummary.pending, cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
              ].map(({ label, value, cls }) => (
                <div key={label} className={`px-4 py-1.5 rounded-xl border text-sm font-medium ${cls}`}>
                  {label}: <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>

            {tabLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Belum ada undangan. Bagikan kode referral Anda!</p>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-slate-500">
                        <th className="text-left px-4 py-3">Email (masked)</th>
                        <th className="text-left px-4 py-3">Tanggal Daftar</th>
                        <th className="text-left px-4 py-3">Status Deposit</th>
                        <th className="text-left px-4 py-3">Deposit Pertama</th>
                        <th className="text-left px-4 py-3">Dihitung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((inv, i) => (
                        <tr key={inv.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                          <td className="px-4 py-3 text-slate-300 font-mono">{inv.inviteeEmail}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(inv.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${
                              inv.hasDeposited
                                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {inv.hasDeposited ? <CheckCircle className="w-3.5 h-3.5" weight="fill" /> : <Clock className="w-3.5 h-3.5" weight="fill" />}
                              {inv.hasDeposited ? 'Deposit' : 'Belum'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {inv.firstDepositAt ? formatDate(inv.firstDepositAt) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {inv.isCountedForUnlock ? (
                              <CheckCircle className="w-4 h-4 text-green-400" weight="fill" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Commissions ────────────────────────────── */}
        {activeTab === 'commissions' && (
          <div className="space-y-4">
            {/* Summary bar */}
            {commissionDetails && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Saldo Tersedia', value: formatRupiah((commissionDetails as any).commissionBalance) },
                  { label: 'Total Diterima', value: formatRupiah((commissionDetails as any).totalEarned) },
                  { label: 'Total Dicairkan', value: formatRupiah((commissionDetails as any).totalWithdrawn) },
                  { label: 'Revenue Share', value: `${(commissionDetails as any).revenueSharePercentage}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-800/50 border border-white/10 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-base font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {tabLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-16">
                <CurrencyDollar className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Belum ada riwayat komisi.</p>
                <p className="text-slate-600 text-xs mt-1">Komisi masuk saat invitee mengalami loss pada akun real.</p>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-slate-500">
                        <th className="text-left px-4 py-3">Tanggal</th>
                        <th className="text-right px-4 py-3">Order</th>
                        <th className="text-right px-4 py-3">Loss</th>
                        <th className="text-right px-4 py-3">%</th>
                        <th className="text-right px-4 py-3">Komisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((log, i) => (
                        <tr key={log.id} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                          <td className="px-4 py-3 text-slate-400">{formatDate(log.createdAt)}</td>
                          <td className="px-4 py-3 text-right text-slate-300">{formatRupiah(log.orderAmount)}</td>
                          <td className="px-4 py-3 text-right text-red-400">{formatRupiah(log.lossAmount)}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{log.commissionPercentage}%</td>
                          <td className="px-4 py-3 text-right text-green-400 font-semibold">{formatRupiah(log.commissionAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Withdrawals ────────────────────────────── */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {/* Header + button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                {withdrawalHistory && (
                  <>
                    <div className="text-sm">
                      <span className="text-slate-500">Saldo: </span>
                      <span className="text-white font-semibold">{formatRupiah(withdrawalHistory.commissionBalance)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Total Dicairkan: </span>
                      <span className="text-white font-semibold">{formatRupiah(withdrawalHistory.totalWithdrawn)}</span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!isCommissionUnlocked || (withdrawalHistory ? withdrawalHistory.commissionBalance < 50000 : true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-white/5 disabled:text-slate-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <ArrowLineUp className="w-4 h-4" weight="bold" />
                Cairkan
              </button>
            </div>

            {tabLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : !withdrawalHistory || withdrawalHistory.withdrawals.length === 0 ? (
              <div className="text-center py-16">
                <ArrowLineUp className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Belum ada riwayat penarikan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalHistory.withdrawals.map((w) => {
                  const st = statusLabel(w.status)
                  return (
                    <div key={w.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-lg font-bold text-white">{formatRupiah(w.amount)}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${st.cls}`}>
                              {st.icon}{st.label}
                            </span>
                          </div>
                          {w.bankAccount && (
                            <p className="text-xs text-slate-500">
                              {w.bankAccount.bankName} · {w.bankAccount.accountNumber} · {w.bankAccount.accountHolderName}
                            </p>
                          )}
                          {w.note && <p className="text-xs text-slate-500 mt-0.5">Catatan: {w.note}</p>}
                          {w.adminNotes && <p className="text-xs text-blue-400/80 mt-0.5">Admin: {w.adminNotes}</p>}
                          {w.rejectionReason && (
                            <p className="text-xs text-red-400 mt-0.5">Ditolak: {w.rejectionReason}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-1">{formatDate(w.createdAt)}</p>
                        </div>
                        {w.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(w.id)}
                            disabled={cancellingId === w.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {cancellingId === w.id ? (
                              <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" weight="bold" />
                            ) : (
                              <X className="w-3.5 h-3.5" weight="bold" />
                            )}
                            Batal
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

      {/* ── Withdraw Modal ────────────────────────────────── */}
      {showWithdrawModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowWithdrawModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">Cairkan Komisi</h3>
                  <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" weight="bold" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Jumlah Penarikan</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="50000"
                        min={50000}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 text-sm"
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Minimal Rp 50.000 · Saldo tersedia: {formatRupiah(balances.commissionBalance)}</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Catatan (opsional)</label>
                    <input
                      type="text"
                      value={withdrawNote}
                      onChange={(e) => setWithdrawNote(e.target.value)}
                      placeholder="Mis: Penarikan bulan Februari"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 text-sm"
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300/80">
                    Penarikan akan masuk ke rekening bank terdaftar di profil Anda. Admin akan memproses dalam 1–3 hari kerja.
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-semibold text-sm transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawLoading || !withdrawAmount || Number(withdrawAmount) < 50000}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      {withdrawLoading ? (
                        <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" />
                      ) : (
                        <ArrowLineUp className="w-4 h-4" weight="bold" />
                      )}
                      {withdrawLoading ? 'Memproses...' : 'Ajukan Penarikan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}