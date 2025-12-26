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
  Edit,
  Trash2,
  DollarSign,
  Eye,
  X,
  Check,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

// ✅ FIXED: Type with proper null handling
interface UserData {
  id: string
  email: string
  role: string | null | undefined
  isActive: boolean
  createdAt: string
  currentBalance?: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
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
  const [role, setRole] = useState('user')
  const [balanceType, setBalanceType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceDescription, setBalanceDescription] = useState('')
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

  const loadUsers = async () => {
    try {
      const response = await api.getAllUsersWithBalance()
      const rawUsers = response?.data?.users || response?.users || []
      
      // ✅ FIXED: Sanitize all user data to prevent crashes
      const sanitizedUsers = rawUsers.map((u: any) => ({
        id: u.id || '',
        email: u.email || 'No email',
        role: u.role || 'user', // ✅ Default to 'user' if undefined
        isActive: u.isActive !== undefined ? u.isActive : true,
        createdAt: u.createdAt || new Date().toISOString(),
        currentBalance: u.currentBalance || 0,
      }))
      
      setUsers(sanitizedUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Safe role formatting function
  const formatRole = (role: string | null | undefined): string => {
    if (!role) return 'User'
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ✅ FIXED: Safe role color function
  const getRoleColor = (role: string | null | undefined): string => {
    if (!role) return 'bg-gray-500/10 text-gray-400'
    
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'bg-red-500/10 text-red-400'
      case 'admin':
        return 'bg-purple-500/10 text-purple-400'
      default:
        return 'bg-blue-500/10 text-blue-400'
    }
  }

  // ✅ FIXED: Safe role check function
  const getUserRole = (role: string | null | undefined): string => {
    if (!role) return 'user'
    return role.toLowerCase()
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      await api.createUser({ email, password, role })
      toast.success('User created successfully!')
      setShowCreateModal(false)
      setEmail('')
      setPassword('')
      setRole('user')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create user')
    } finally {
      setProcessing(false)
    }
  }

  const handleManageBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    const amount = parseFloat(balanceAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount')
      return
    }

    setProcessing(true)

    try {
      await api.manageUserBalance(selectedUser.id, {
        type: balanceType,
        amount,
        description: balanceDescription
      })
      
      toast.success(`${balanceType === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`)
      setShowBalanceModal(false)
      setBalanceAmount('')
      setBalanceDescription('')
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to manage balance')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setProcessing(true)

    try {
      await api.deleteUser(selectedUser.id)
      toast.success('User deleted successfully!')
      setShowDeleteModal(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    } finally {
      setProcessing(false)
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.updateUser(userId, { isActive: !currentStatus })
      toast.success('User status updated!')
      loadUsers()
    } catch (error: any) {
      toast.error('Failed to update user status')
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
    return (
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-400">Loading users...</div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">User Management</h1>
            </div>
            <p className="text-gray-400">Manage platform users and permissions</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 rounded-xl font-semibold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Users</span>
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.active}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Admins</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.admins}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Total Balance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-yellow-400">
              {formatCurrency(stats.totalBalance)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by email..."
              className="w-full bg-[#0f1419] border border-gray-800/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[#0f1419] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
              <p className="text-gray-400 mb-1">No users found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try a different search query' : 'Add your first user to get started'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-800/50">
                      <th className="py-4 px-6 font-medium">User</th>
                      <th className="py-4 px-6 font-medium">Role</th>
                      <th className="py-4 px-6 font-medium text-right">Balance</th>
                      <th className="py-4 px-6 font-medium text-center">Status</th>
                      <th className="py-4 px-6 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1a1f2e] transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-medium">{u.email}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(u.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                            <Shield className="w-3 h-3" />
                            {formatRole(u.role)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold">
                          {formatCurrency(u.currentBalance || 0)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                u.isActive 
                                  ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              }`}
                            >
                              {u.isActive ? (
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
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/users/${u.id}`)}
                              className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                            </button>
                            
                            {user.role === 'super_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u)
                                  setShowBalanceModal(true)
                                }}
                                className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors group"
                                title="Manage Balance"
                              >
                                <DollarSign className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                              </button>
                            )}
                            
                            {user.role === 'super_admin' && getUserRole(u.role) !== 'super_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u)
                                  setShowDeleteModal(true)
                                }}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-4">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="bg-[#1a1f2e] border border-gray-800/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate mb-2">{u.email}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                            <Shield className="w-3 h-3" />
                            {formatRole(u.role)}
                          </span>
                          
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {u.isActive ? (
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
                      
                      <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 ml-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-gray-800/50">
                      <span className="text-gray-400">Balance</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(u.currentBalance || 0)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm font-medium text-blue-400 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      
                      {user.role === 'super_admin' && (
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setShowBalanceModal(true)
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm font-medium text-emerald-400 transition-all"
                        >
                          <DollarSign className="w-4 h-4" />
                          Balance
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

      {/* Create User Modal */}
      {showCreateModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Create New User</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Minimum 8 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must contain uppercase, lowercase, and number/special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    {user.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition-all"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create User'
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
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowBalanceModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Manage Balance</h2>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleManageBalance} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Balance
                  </label>
                  <div className="text-2xl font-bold font-mono">
                    {formatCurrency(selectedUser.currentBalance || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBalanceType('deposit')}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        balanceType === 'deposit'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceType('withdrawal')}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        balanceType === 'withdrawal'
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                      }`}
                    >
                      Withdrawal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (IDR)
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={balanceDescription}
                    onChange={(e) => setBalanceDescription(e.target.value)}
                    required
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Admin adjustment"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg ${
                    balanceType === 'deposit'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    `Confirm ${balanceType === 'deposit' ? 'Deposit' : 'Withdrawal'}`
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
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-red-500/30 rounded-2xl shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Delete User</h2>
                    <p className="text-sm text-red-400">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete <span className="font-bold text-white">{selectedUser.email}</span>?
                  <br />
                  <span className="text-sm text-gray-400 mt-2 block">
                    All user data including balance and trading history will be permanently deleted.
                  </span>
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Deleting...
                      </span>
                    ) : (
                      'Delete User'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}