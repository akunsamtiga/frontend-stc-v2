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
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

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

  const [accountType, setAccountType] = useState<'real' | 'demo'>('demo')

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
      
      const sanitizedUsers = rawUsers.map((u: any) => ({
        id: u.id || '',
        email: u.email || 'No email',
        role: u.role || 'user',
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

  const formatRole = (role: string | null | undefined): string => {
    if (!role) return 'User'
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getRoleColor = (role: string | null | undefined): string => {
    if (!role) return 'bg-gray-100 text-gray-700 border-gray-200'
    
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
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
        accountType,  
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading users...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">User Management</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-500">Manage users and permissions</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Total Users</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Active</div>
                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Admins</div>
                <div className="text-3xl font-bold text-purple-600">{stats.admins}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Total Balance</div>
                <div className="text-lg font-bold text-yellow-600 font-mono">
                  {formatCurrency(stats.totalBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by email..."
              className="w-full bg-white border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-blue-500 transition-all shadow-sm"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try a different search query' : 'Add your first user to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add First User
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-600 border-b border-gray-100 bg-gray-50">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6 text-right">Balance</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {u.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{u.email}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(u.createdAt).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getRoleColor(u.role)}`}>
                            <Shield className="w-3 h-3" />
                            {formatRole(u.role)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-mono font-bold text-gray-900">
                            {formatCurrency(u.currentBalance || 0)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                u.isActive 
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' 
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
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
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/admin/users/${u.id}`)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                            
                            {user.role === 'super_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u)
                                  setShowBalanceModal(true)
                                }}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Manage Balance"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                            
                            {user.role === 'super_admin' && getUserRole(u.role) !== 'super_admin' && (
                              <button
                                onClick={() => {
                                  setSelectedUser(u)
                                  setShowDeleteModal(true)
                                }}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
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
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                          {u.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate mb-1">{u.email}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${getRoleColor(u.role)}`}>
                              <Shield className="w-3 h-3" />
                              {formatRole(u.role)}
                            </span>
                            
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                              u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>

                    <div className="bg-white rounded-xl p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Balance</span>
                        <span className="font-mono font-bold text-lg text-gray-900">
                          {formatCurrency(u.currentBalance || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-semibold text-blue-700 transition-all"
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
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-semibold text-green-700 transition-all"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                      <p className="text-sm text-gray-500">Add a new user account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="Minimum 8 characters"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Must contain uppercase, lowercase, and number/special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-blue-500 focus:bg-white transition-all"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowBalanceModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Manage Balance</h2>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleManageBalance} className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                  <div className="text-3xl font-bold font-mono text-gray-900">
                    {formatCurrency(selectedUser.currentBalance || 0)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBalanceType('deposit')}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        balanceType === 'deposit'
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceType('withdrawal')}
                      className={`py-3 rounded-xl font-bold transition-all ${
                        balanceType === 'withdrawal'
                          ? 'bg-red-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                      }`}
                    >
                      Withdrawal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Amount (IDR)
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-xl font-mono focus:border-green-500 focus:bg-white transition-all"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={balanceDescription}
                    onChange={(e) => setBalanceDescription(e.target.value)}
                    required
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:bg-white transition-all"
                    placeholder="Admin adjustment"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 ${
                    balanceType === 'deposit'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up border-2 border-red-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                    <p className="text-sm text-red-600">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete{' '}
                    <span className="font-bold text-gray-900">{selectedUser.email}</span>?
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    All user data including balance and trading history will be permanently deleted.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
    </div>
  )
}