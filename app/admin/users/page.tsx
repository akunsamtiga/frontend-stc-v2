// app/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  Users, 
  Plus,
  Search,
  Filter,
  ChevronRight,
  Eye,
  X,
  DollarSign,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
  UserCog,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  id: string
  email: string
  role: string | null | undefined
  isActive: boolean
  createdAt: string
  currentBalance?: number
}

type UserRole = 'user' | 'admin' | 'super_admin'

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-white/10 rounded"></div>
      <div className="h-4 bg-white/10 rounded w-20"></div>
    </div>
    <div className="h-6 bg-white/10 rounded w-24"></div>
  </div>
)

const UserCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
        <div>
          <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-24"></div>
        </div>
      </div>
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
          <UserCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export default function AdminUsersPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [balanceType, setBalanceType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceDescription, setBalanceDescription] = useState('')
  const [accountType, setAccountType] = useState<'real' | 'demo'>('real') // ✅ TAMBAHAN: State untuk tipe akun
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
      return
    }
    
    loadUsers()
  }, [user, router])

  const loadUsers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      const response = await api.getAllUsersWithBalance()
      const rawUsers = response?.data?.users || response?.users || []
      
      const sanitizedUsers = rawUsers.map((u: any) => ({
        id: u.id || '',
        email: u.email || 'No email',
        role: u.role || 'user',
        isActive: u.isActive !== undefined ? u.isActive : true,
        createdAt: u.createdAt || new Date().toISOString(),
        currentBalance: u.currentBalance || 0,
      }))
      
      setUsers(sanitizedUsers)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal memuat pengguna:', error)
      toast.error('Gagal memuat pengguna')
      setUsers([])
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadUsers(true)
  }

  const formatRole = (role: string | null | undefined): string => {
    if (!role) return 'Pengguna'
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getRoleColor = (role: string | null | undefined): string => {
    if (!role) return 'bg-white/5 text-slate-400 border-white/10'
    
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  }

  const getUserRole = (role: string | null | undefined): string => {
    if (!role) return 'user'
    return role.toLowerCase()
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      await api.createUser({ email, password, role })
      toast.success('Pengguna berhasil dibuat!')
      setShowCreateModal(false)
      setEmail('')
      setPassword('')
      setRole('user')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat pengguna')
    } finally {
      setProcessing(false)
    }
  }

  // ✅ PERBAIKAN: Tambahkan accountType ke parameter API
  const handleManageBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    const amount = parseFloat(balanceAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Jumlah tidak valid')
      return
    }

    setProcessing(true)

    try {
      await api.manageUserBalance(selectedUser.id, {
        accountType, // ✅ Sekarang sudah ada
        type: balanceType,
        amount,
        description: balanceDescription
      })
      
      toast.success(`${balanceType === 'deposit' ? 'Deposit' : 'Penarikan'} berhasil!`)
      setShowBalanceModal(false)
      setBalanceAmount('')
      setBalanceDescription('')
      setAccountType('real') // Reset ke default
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengelola saldo')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setProcessing(true)

    try {
      await api.deleteUser(selectedUser.id)
      toast.success('Pengguna berhasil dihapus!')
      setShowDeleteModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus pengguna')
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.updateUser(userId, { isActive: !currentStatus })
      toast.success('Status pengguna diperbarui!')
      loadUsers()
    } catch (error: any) {
      toast.error('Gagal memperbarui status pengguna')
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const userRole = getUserRole(u.role)
    const matchesRole = filterRole === 'all' || userRole === filterRole
    return matchesSearch && matchesRole
  })

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => {
      const role = getUserRole(u.role)
      return role === 'super_admin' || role === 'admin'
    }).length,
    totalBalance: users.reduce((sum, u) => sum + (u.currentBalance || 0), 0),
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Pengguna</h1>
            <p className="text-sm text-slate-400">Kelola pengguna dan izin</p>
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
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400">Total Pengguna</span>
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
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-slate-400">Admin</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.admins}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs text-slate-400">Total Saldo</span>
            </div>
            <div className="text-base font-bold text-yellow-400 font-mono">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact'
              }).format(stats.totalBalance)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengguna berdasarkan email..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 text-sm"
            />
          </div>
          
          <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-sm text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-slate-900">Semua Peran</option>
              <option value="super_admin" className="bg-slate-900">Super Admin</option>
              <option value="admin" className="bg-slate-900">Admin</option>
              <option value="user" className="bg-slate-900">Pengguna</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Tidak ada pengguna</h3>
              <p className="text-sm text-slate-400 mb-6">
                {searchQuery ? 'Coba kata kunci pencarian lain' : 'Tambahkan pengguna pertama Anda'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Pengguna Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{u.email}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getRoleColor(u.role)}`}>
                          <Shield className="w-3 h-3" />
                          {formatRole(u.role)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">
                        {new Intl.NumberFormat('id-ID', { 
                          style: 'currency', 
                          currency: 'IDR',
                          minimumFractionDigits: 0 
                        }).format(u.currentBalance || 0)}
                      </div>
                      <div className="text-xs text-slate-400">Saldo</div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          u.isActive 
                            ? 'text-green-400 hover:bg-green-500/10' 
                            : 'text-red-400 hover:bg-red-500/10'
                        }`}
                        title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {user.role === 'super_admin' && (
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setShowBalanceModal(true)
                          }}
                          className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg transition-colors"
                          title="Kelola Saldo"
                        >
                          <DollarSign className="w-5 h-5" />
                        </button>
                      )}
                      
                      {user.role === 'super_admin' && getUserRole(u.role) !== 'super_admin' && (
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setShowDeleteModal(true)
                          }}
                          className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-white/10">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Buat Pengguna Baru</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                    placeholder="pengguna@contoh.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Kata Sandi</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                    placeholder="Minimal 8 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-blue-500 focus:bg-white/10 transition-all text-white"
                  >
                    <option value="user" className="bg-slate-900">Pengguna</option>
                    <option value="admin" className="bg-slate-900">Admin</option>
                    {user.role === 'super_admin' && (
                      <option value="super_admin" className="bg-slate-900">Super Admin</option>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Membuat...
                    </span>
                  ) : (
                    'Buat Pengguna'
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Balance Management Modal */}
      {showBalanceModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowBalanceModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-white/10">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Kelola Saldo</h2>
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleManageBalance} className="p-6 space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-sm text-slate-400 mb-1">Saldo Saat Ini</div>
                  <div className="text-3xl font-bold font-mono text-white">
                    {new Intl.NumberFormat('id-ID', { 
                      style: 'currency', 
                      currency: 'IDR',
                      minimumFractionDigits: 0 
                    }).format(selectedUser.currentBalance || 0)}
                  </div>
                </div>

                {/* ✅ TAMBAHAN: Pilihan Tipe Akun */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Tipe Akun</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAccountType('real')}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        accountType === 'real'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      Real
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('demo')}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        accountType === 'demo'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      Demo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBalanceType('deposit')}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        balanceType === 'deposit'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceType('withdrawal')}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        balanceType === 'withdrawal'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      Penarikan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Jumlah (IDR)</label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xl font-mono focus:border-green-500 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Keterangan</label>
                  <input
                    type="text"
                    value={balanceDescription}
                    onChange={(e) => setBalanceDescription(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:border-green-500 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                    placeholder="Penyesuaian admin"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                    balanceType === 'deposit'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    `Konfirmasi ${balanceType === 'deposit' ? 'Deposit' : 'Penarikan'}`
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-red-500/20">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Hapus Pengguna</h2>
                <p className="text-sm text-red-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>

              <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                  <p className="text-base text-slate-300">
                    Apakah Anda yakin ingin menghapus{' '}
                    <span className="font-bold text-white">{selectedUser.email}</span>?
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Semua data pengguna termasuk saldo dan riwayat trading akan dihapus permanen.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Menghapus...
                      </span>
                    ) : (
                      'Hapus Pengguna'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}