'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  CheckCircle,
  XCircle,
  Settings,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  LogOut
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-sm text-gray-400">Manage your account information and preferences</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar - Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            {/* User Card */}
            <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl animate-fade-in-up">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1">{user.email}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400 capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={`text-sm font-medium ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs - Mobile */}
            <div className="lg:hidden bg-[#0f1419] border border-gray-800/50 rounded-xl p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-[#1a1f2e]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'security'
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-[#1a1f2e]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Security</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs - Desktop */}
            <div className="hidden lg:block bg-[#0f1419] border border-gray-800/50 rounded-xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-l-4 ${
                  activeTab === 'profile'
                    ? 'bg-[#1a1f2e] border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:bg-[#1a1f2e]'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile Info</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-l-4 ${
                  activeTab === 'security'
                    ? 'bg-[#1a1f2e] border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:bg-[#1a1f2e]'
                }`}
              >
                <Lock className="w-5 h-5" />
                <span className="font-medium">Security</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-l-4 ${
                  activeTab === 'preferences'
                    ? 'bg-[#1a1f2e] border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:bg-[#1a1f2e]'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Preferences</span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex w-full items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 animate-fade-in-up">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-400" />
                  Profile Information
                </h3>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center gap-4 p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-400 mb-1">Email Address</div>
                      <div className="font-medium truncate">{user.email}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-4 p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">Account Type</div>
                      <div className="font-medium capitalize">{user.role.replace('_', ' ')}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-4 p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className={`w-12 h-12 ${user.isActive ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {user.isActive ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">Account Status</div>
                      <div className={`font-medium ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-4 p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">Member Since</div>
                      <div className="font-medium">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 animate-fade-in-up">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-blue-400" />
                  Security Settings
                </h3>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg mt-6"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>

                {/* Two-Factor Authentication */}
                <div className="mt-6 pt-6 border-t border-gray-800/50">
                  <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">Two-Factor Authentication</div>
                        <div className="text-sm text-gray-400">Add extra security to your account</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm font-medium transition-all">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 animate-fade-in-up">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-blue-400" />
                  Preferences
                </h3>

                <div className="space-y-4">
                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Bell className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">Email Notifications</div>
                        <div className="text-sm text-gray-400">Receive trading alerts via email</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                    </label>
                  </div>

                  {/* Trade Alerts */}
                  <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Bell className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">Trade Alerts</div>
                        <div className="text-sm text-gray-400">Get notified on trade outcomes</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                    </label>
                  </div>

                  {/* Sound Effects */}
                  <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Settings className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">Sound Effects</div>
                        <div className="text-sm text-gray-400">Play sounds on trade events</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all mt-6"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}