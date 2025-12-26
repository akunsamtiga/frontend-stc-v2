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
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  LogOut,
  CheckCircle2,
  Settings
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

  // Preferences
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [tradeAlerts, setTradeAlerts] = useState(true)
  const [soundEffects, setSoundEffects] = useState(false)

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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Account</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-500">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* User Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-3xl font-bold mb-4 border-2 border-white/30">
                  {user.email[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{user.email}</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/30">
                  <Shield className="w-4 h-4" />
                  {user.role.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="text-white/90 text-sm font-medium">
                    {user.isActive ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-[1.02]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-red-600 border-2 border-red-200 rounded-2xl font-bold hover:bg-red-50 transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Profile Information</h3>
                  <p className="text-gray-500">Your account details and status</p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Email */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Mail className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Email Address</div>
                        <div className="text-lg font-bold text-gray-900">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-bold text-green-700">Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <Shield className="w-7 h-7 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Account Type</div>
                        <div className="text-lg font-bold text-gray-900 capitalize">{user.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        user.isActive ? 'bg-green-50 group-hover:bg-green-100' : 'bg-red-50 group-hover:bg-red-100'
                      } transition-colors`}>
                        <div className={`w-6 h-6 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Account Status</div>
                        <div className={`text-lg font-bold ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Calendar className="w-7 h-7 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Member Since</div>
                        <div className="text-lg font-bold text-gray-900">
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
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Security Settings</h3>
                  <p className="text-gray-500">Keep your account secure</p>
                </div>

                <div className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:bg-white transition-all"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="Enter new password"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:bg-white transition-all"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                          <button className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all">
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Preferences</h3>
                  <p className="text-gray-500">Customize your experience</p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Email Notifications */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <Bell className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 mb-1">Email Notifications</div>
                          <div className="text-sm text-gray-500">Receive trading alerts via email</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={emailNotifs}
                          onChange={(e) => setEmailNotifs(e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Trade Alerts */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                          <Bell className="w-7 h-7 text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 mb-1">Trade Alerts</div>
                          <div className="text-sm text-gray-500">Get notified on trade outcomes</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={tradeAlerts}
                          onChange={(e) => setTradeAlerts(e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Sound Effects */}
                  <div className="group p-5 rounded-2xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                          <Bell className="w-7 h-7 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 mb-1">Sound Effects</div>
                          <div className="text-sm text-gray-500">Play sounds on trade events</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={soundEffects}
                          onChange={(e) => setSoundEffects(e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}