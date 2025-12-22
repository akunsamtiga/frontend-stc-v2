'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function BalancePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<BalanceType[]>([])
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [balanceRes, historyRes] = await Promise.all([
        api.getCurrentBalance(),
        api.getBalanceHistory(),
      ])
      
      // ✅ FIX: Access balance from nested data object
      setBalance(balanceRes?.data?.balance || balanceRes?.balance || 0)
      setTransactions(historyRes?.data?.transactions || historyRes?.transactions || [])
    } catch (error) {
      console.error('Failed to load balance:', error)
      setBalance(0)
      setTransactions([])
    }
  }

  const handleDeposit = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }

    setLoading(true)
    try {
      await api.createBalanceEntry({
        type: 'deposit',
        amount: amt,
        description: 'Deposit',
      })
      toast.success('Deposit successful!')
      setShowDeposit(false)
      setAmount('')
      loadData()
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error('Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amt > balance) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      await api.createBalanceEntry({
        type: 'withdrawal',
        amount: amt,
        description: 'Withdrawal',
      })
      toast.success('Withdrawal successful!')
      setShowWithdraw(false)
      setAmount('')
      loadData()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      toast.error('Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Balance Management</h1>

        {/* Current Balance */}
        <div className="card bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/30 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-2">Current Balance</div>
              <div className="text-5xl font-bold font-mono">{formatCurrency(balance)}</div>
            </div>
            <Wallet className="w-16 h-16 text-primary opacity-50" />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowDeposit(true)}
              className="btn btn-success flex items-center gap-2 flex-1"
            >
              <Plus className="w-4 h-4" />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="btn btn-danger flex items-center gap-2 flex-1"
            >
              <Minus className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="card max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Deposit Funds</h2>
              <div className="input-group mb-6">
                <label className="input-label">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="btn btn-success flex-1"
                >
                  {loading ? 'Processing...' : 'Confirm Deposit'}
                </button>
                <button
                  onClick={() => {
                    setShowDeposit(false)
                    setAmount('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="card max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
              <div className="input-group mb-6">
                <label className="input-label">Amount (Max: {formatCurrency(balance)})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={balance}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="btn btn-danger flex-1"
                >
                  {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
                <button
                  onClick={() => {
                    setShowWithdraw(false)
                    setAmount('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-background-tertiary rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'deposit' || tx.type === 'win' ? 'bg-success/20' : 'bg-danger/20'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'win' ? (
                        <TrendingUp className="w-5 h-5 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-danger" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{tx.type}</div>
                      <div className="text-sm text-gray-400">{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold font-mono ${
                    tx.type === 'deposit' || tx.type === 'win' ? 'text-success' : 'text-danger'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'win' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}