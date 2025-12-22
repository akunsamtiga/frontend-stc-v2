'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Users, Package, TrendingUp, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
    }
  }, [user, router])

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid grid-cols-2 gap-6">
          <Link href="/admin/users">
            <div className="card hover:bg-background-tertiary transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Users</h2>
                  <p className="text-gray-400">Manage user accounts</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/assets">
            <div className="card hover:bg-background-tertiary transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-success/20 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Assets</h2>
                  <p className="text-gray-400">Manage trading assets</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Statistics</h2>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Reports</h2>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
