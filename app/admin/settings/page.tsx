'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell,
  DollarSign,
  Activity,
  Globe,
  Lock,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    // Trading Settings
    minOrderAmount: 1000,
    maxOrderAmount: 10000000,
    defaultProfitRate: 85,
    
    // System Settings
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: false,
    
    // Notification Settings
    emailNotifications: true,
    tradeAlerts: true,
    systemAlerts: true,
  })

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin') {
      router.push('/admin')
      return
    }
  }, [user, router])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'super_admin') return null

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">System Settings</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Configure platform settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Trading Settings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">Trading Configuration</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Minimum Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={settings.minOrderAmount}
                  onChange={(e) => setSettings({...settings, minOrderAmount: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:border-green-500 focus:bg-white transition-all text-sm sm:text-base "
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Maximum Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={settings.maxOrderAmount}
                  onChange={(e) => setSettings({...settings, maxOrderAmount: parseInt(e.target.value)})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:border-green-500 focus:bg-white transition-all text-sm sm:text-base "
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                  Default Profit Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.defaultProfitRate}
                  onChange={(e) => setSettings({...settings, defaultProfitRate: parseInt(e.target.value)})}
                  min="0"
                  max="100"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-gray-900 focus:outline-none focus:border-green-500 focus:bg-white transition-all text-sm sm:text-base "
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">System Configuration</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">Maintenance Mode</div>
                    <div className="text-xs sm:text-sm text-gray-500">Temporarily disable trading</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">New Registrations</div>
                    <div className="text-xs sm:text-sm text-gray-500">Allow new users to register</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.allowNewRegistrations}
                    onChange={(e) => setSettings({...settings, allowNewRegistrations: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">Email Verification</div>
                    <div className="text-xs sm:text-sm text-gray-500">Require email verification for new accounts</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">Email Notifications</div>
                    <div className="text-xs sm:text-sm text-gray-500">Send email notifications to users</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">Trade Alerts</div>
                    <div className="text-xs sm:text-sm text-gray-500">Notify users about trade outcomes</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.tradeAlerts}
                    onChange={(e) => setSettings({...settings, tradeAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">System Alerts</div>
                    <div className="text-xs sm:text-sm text-gray-500">Critical system notifications</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.systemAlerts}
                    onChange={(e) => setSettings({...settings, systemAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}