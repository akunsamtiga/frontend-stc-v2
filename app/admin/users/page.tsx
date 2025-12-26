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
  DollarSign,
  Trash2,
  X,
  Check,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  id: string
  email: string
  role: string
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
      setLoading(true)
      const response = await api.getAllUsersWithBalance()
      
      // Handle different response structures
      let usersList: UserData[] = []
      
      if (response?.data?.users) {
        usersList = response.data.users
      } else if (response?.users) {
        usersList = response.users
      } else if (Array.isArray(response?.data)) {
        usersList = response.data
      } else if (Array.isArray(response)) {
        usersList = response
      }
      
      setUsers(usersList)
    } catch (error: any) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
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
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create user'
      toast.error(errorMsg)
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
      const errorMsg = error.response?.data?.error || error.message || 'Failed to manage balance'
      toast.error(errorMsg)
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
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete user'
      toast.error(errorMsg)
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

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || u.role === filterRole
    return matchesSearch && matchesRole
  })

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-400">Loading...</div>
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
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              User Management
            </h1>
            <p className="text-gray-400">{users.length} total users</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email..."
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

        {/* Users List */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
              <p className="text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-6 hover:bg-[#1a1f2e] transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium mb-1">{u.email}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'super_admin' ? 'bg-red-500/10 text-red-400' :
                        u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {u.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      
                      {u.currentBalance !== undefined && (
                        <span className="text-gray-400">
                          • Balance: {new Intl.NumberFormat('id-ID', { 
                            style: 'currency', 
                            currency: 'IDR',
                            minimumFractionDigits: 0 
                          }).format(u.currentBalance)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                    </button>
                    
                    {user.role === 'super_admin' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setShowBalanceModal(true)
                          }}
                          className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Manage Balance"
                        >
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                        </button>
                        
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setShowDeleteModal(true)
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </>
                    )}
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
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl">
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
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
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
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    {user?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 py-3 rounded-xl font-semibold transition-all"
                >
                  {processing ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Balance Modal */}
      {showBalanceModal && selectedUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowBalanceModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl">
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
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBalanceType('deposit')}
                      className={`py-3 rounded-xl font-medium transition-all ${
                        balanceType === 'deposit'
                          ? 'bg-green-500 text-white'
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
                          ? 'bg-red-500 text-white'
                          : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                      }`}
                    >
                      Withdrawal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-blue-500/50"
                    placeholder="0"
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
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50"
                    placeholder="Admin adjustment"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    balanceType === 'deposit'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : `Confirm ${balanceType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-red-500/30 rounded-2xl shadow-2xl">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Delete User</h2>
                    <p className="text-sm text-gray-400">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete <span className="font-bold text-white">{selectedUser.email}</span>?
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
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl font-semibold transition-all"
                  >
                    {processing ? 'Deleting...' : 'Delete'}
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