'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { TrendingUp, Zap, Shield, Clock } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to /trading')
      router.push('/trading')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Attempting login with:', email)
      
      const response = isLogin
        ? await api.login(email, password)
        : await api.register(email, password)

      console.log('Auth response:', response)

      // Handle different response structures
      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token

      if (!userData || !token) {
        console.error('Invalid response structure:', response)
        toast.error('Invalid response from server')
        return
      }

      console.log('Setting auth with user:', userData)
      console.log('Setting auth with token:', token)

      // Set authentication
      setAuth(userData, token)
      api.setToken(token)

      toast.success(response.message || 'Login successful!')
      
      console.log('Redirecting to /trading...')
      
      // Force redirect with replace
      router.replace('/trading')
      
      // Backup redirect after short delay
      setTimeout(() => {
        console.log('Backup redirect to /trading')
        router.push('/trading')
      }, 100)

    } catch (error: any) {
      console.error('Auth error:', error)
      console.error('Error response:', error.response?.data)
      
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        error.message || 
        'Authentication failed'
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Don't render form if user is logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-xl mb-4">Redirecting to trading...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-background via-background-secondary to-background flex flex-col justify-center px-12">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold">BinaryTrade</span>
          </div>

          <h1 className="text-5xl font-bold mb-6">
            Trade Binary Options with Confidence
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Professional trading platform with real-time price streaming, instant execution, and up to 85% profit rates.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant Execution</h3>
                <p className="text-sm text-gray-400">Orders executed in milliseconds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Platform</h3>
                <p className="text-sm text-gray-400">Bank-level security</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Flexible Durations</h3>
                <p className="text-sm text-gray-400">1 to 60 minute options</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">High Returns</h3>
                <p className="text-sm text-gray-400">Up to 85% profit rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-[480px] bg-background-secondary flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-400">
              {isLogin
                ? 'Sign in to continue trading'
                : 'Create your account to start trading'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-8 p-4 bg-background rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Demo Credentials:</div>
              <div className="text-xs font-mono space-y-1">
                <div>Email: superadmin@trading.com</div>
                <div>Pass: SuperAdmin123!</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}