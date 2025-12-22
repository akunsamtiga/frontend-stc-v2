'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { LogOut, User, Settings, Wallet } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!user) return null

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-background-secondary border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/trading" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl">BinaryTrade</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/trading"
              className={cn(
                'px-4 py-2 rounded-lg transition-all',
                isActive('/trading')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-background-tertiary'
              )}
            >
              Trading
            </Link>
            <Link
              href="/history"
              className={cn(
                'px-4 py-2 rounded-lg transition-all',
                isActive('/history')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-background-tertiary'
              )}
            >
              History
            </Link>
            <Link
              href="/balance"
              className={cn(
                'px-4 py-2 rounded-lg transition-all',
                isActive('/balance')
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-background-tertiary'
              )}
            >
              Balance
            </Link>
            {(user.role === 'super_admin' || user.role === 'admin') && (
              <Link
                href="/admin"
                className={cn(
                  'px-4 py-2 rounded-lg transition-all',
                  pathname.startsWith('/admin')
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-background-tertiary'
                )}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-background-tertiary transition-all"
            >
              <div>
                <div className="text-sm text-gray-400">{user.role}</div>
                <div className="text-sm font-medium">{user.email}</div>
              </div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-background-secondary border border-gray-700 rounded-lg shadow-xl py-2 z-50">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-background-tertiary transition-all"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-background-tertiary transition-all w-full text-left text-danger"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
