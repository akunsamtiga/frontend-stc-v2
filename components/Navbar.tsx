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
          {/* Logo - DARKER GRADIENT */}
          <Link href="/trading" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)'
            }}>
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#1e40af] to-[#047857]">
              STC AutoTrade
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/trading"
              className={cn(
                'px-4 py-2 rounded-lg transition-all',
                isActive('/trading')
                  ? 'text-white shadow-md'
                  : 'text-gray-300 hover:bg-background-tertiary'
              )}
              style={isActive('/trading') ? {
                background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)'
              } : {}}
            >
              Trading
            </Link>
            <Link
              href="/history"
              className={cn(
                'px-4 py-2 rounded-lg transition-all',
                isActive('/history')
                  ? 'text-white shadow-md'
                  : 'text-gray-300 hover:bg-background-tertiary'
              )}
              style={isActive('/history') ? {
                background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)'
              } : {}}
            >
              History
            </Link>
            <Link
              href="/balance"
              className={cn(
                'px-4 py-2 rounded-lg transition-all',
                isActive('/balance')
                  ? 'text-white shadow-md'
                  : 'text-gray-300 hover:bg-background-tertiary'
              )}
              style={isActive('/balance') ? {
                background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)'
              } : {}}
            >
              Balance
            </Link>
            {(user.role === 'super_admin' || user.role === 'admin') && (
              <Link
                href="/admin"
                className={cn(
                  'px-4 py-2 rounded-lg transition-all',
                  pathname.startsWith('/admin')
                    ? 'text-white shadow-md'
                    : 'text-gray-300 hover:bg-background-tertiary'
                )}
                style={pathname.startsWith('/admin') ? {
                  background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)'
                } : {}}
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
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)'
                }}
              >
                <User className="w-5 h-5 text-white" />
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
                  className="flex items-center gap-2 px-4 py-2 hover:bg-background-tertiary transition-all w-full text-left text-[#dc2626]"
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