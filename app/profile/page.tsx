'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import { User, Mail, Shield } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        <div className="card">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.email}</h2>
              <div className="text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm text-gray-400">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm text-gray-400">Role</div>
                <div className="font-medium capitalize">{user.role.replace('_', ' ')}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm text-gray-400">Status</div>
                <div className={`font-medium ${user.isActive ? 'text-success' : 'text-danger'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
