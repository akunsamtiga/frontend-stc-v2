'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { User } from '@/types'
import { formatDate } from '@/lib/utils'
import { UserPlus, Edit2, Trash2, Shield, Mail, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin' | 'super_admin'>('user')
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

    loadUsers()
  }, [currentUser, router])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await api.getAllUsers()
      const usersList = response?.data?.users || response?.users || []
      setUsers(usersList)
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.createUser({ email, password, role })
      toast.success('User created successfully!')
      resetForm()
      setShowCreateModal(false)
      loadUsers()
    } catch (error) {
      console.error('Failed to create user:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setSubmitting(true)
    try {
      const updateData: any = { role, isActive }
      if (password) updateData.password = password

      await api.updateUser(selectedUser.id, updateData)
      toast.success('User updated successfully!')
      resetForm()
      setShowEditModal(false)
      loadUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Cannot delete your own account')
      return
    }

    if (!confirm(`Are you sure you want to delete ${user.email}?`)) return

    try {
      await api.deleteUser(user.id)
      toast.success('User deleted successfully!')
      loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEmail(user.email)
    setPassword('')
    setRole(user.role)
    setIsActive(user.isActive)
    setShowEditModal(true)
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setRole('user')
    setIsActive(true)
    setSelectedUser(null)
  }

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>
        </div>

        {/* Users Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Email</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Role</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Created</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-background-tertiary transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                          <Shield className="w-3 h-3" />
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {user.isActive ? (
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
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 hover:bg-danger/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </button>
                          )}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {currentUser?.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create User'}
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" value={email} disabled className="opacity-50" />
              </div>
              <div className="input-group">
                <label className="input-label">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password..."
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {currentUser?.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm">Active Account</label>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? 'Updating...' : 'Update User'}
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