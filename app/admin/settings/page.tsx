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
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold">System Settings</h1>
          </div>
          <p className="text-gray-400">Configure platform settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Trading Settings */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">Trading Configuration</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={settings.minOrderAmount}
                  onChange={(e) => setSettings({...settings, minOrderAmount: parseInt(e.target.value)})}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={settings.maxOrderAmount}
                  onChange={(e) => setSettings({...settings, maxOrderAmount: parseInt(e.target.value)})}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Profit Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.defaultProfitRate}
                  onChange={(e) => setSettings({...settings, defaultProfitRate: parseInt(e.target.value)})}
                  min="0"
                  max="100"
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold">System Configuration</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="font-medium mb-1">Maintenance Mode</div>
                    <div className="text-sm text-gray-400">Temporarily disable trading</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium mb-1">New Registrations</div>
                    <div className="text-sm text-gray-400">Allow new users to register</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.allowNewRegistrations}
                    onChange={(e) => setSettings({...settings, allowNewRegistrations: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="font-medium mb-1">Email Verification</div>
                    <div className="text-sm text-gray-400">Require email verification for new accounts</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium mb-1">Email Notifications</div>
                    <div className="text-sm text-gray-400">Send email notifications to users</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium mb-1">Trade Alerts</div>
                    <div className="text-sm text-gray-400">Notify users about trade outcomes</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.tradeAlerts}
                    onChange={(e) => setSettings({...settings, tradeAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="font-medium mb-1">System Alerts</div>
                    <div className="text-sm text-gray-400">Critical system notifications</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={settings.systemAlerts}
                    onChange={(e) => setSettings({...settings, systemAlerts: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-semibold text-white transition-all shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}