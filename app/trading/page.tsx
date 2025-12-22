'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useTradingStore } from '@/store/trading'
import { api } from '@/lib/api'
import { subscribeToPriceUpdates } from '@/lib/firebase'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import PriceDisplay from '@/components/PriceDisplay'
import { Asset, PriceData } from '@/types'
import { formatCurrency, DURATIONS } from '@/lib/utils'
import { ArrowUpCircle, ArrowDownCircle, Clock, DollarSign } from 'lucide-react'

export default function TradingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { selectedAsset, setSelectedAsset, setCurrentPrice, addPriceToHistory } = useTradingStore()

  const [assets, setAssets] = useState<Asset[]>([])
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState(1000)
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    loadData()
  }, [user, router])

  useEffect(() => {
    if (!selectedAsset) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      unsubscribe = subscribeToPriceUpdates(selectedAsset.realtimeDbPath, (data: PriceData) => {
        setCurrentPrice(data)
        addPriceToHistory(data)
      })
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [selectedAsset])

  const loadData = async () => {
    try {
      const [assetsRes, balanceRes] = await Promise.all([
        api.getAssets(true),
        api.getCurrentBalance(),
      ])

      // Fix: Handle response structure correctly
      const assetsList = assetsRes?.data?.assets || assetsRes?.assets || []
      const currentBalance = balanceRes?.balance || 0

      setAssets(assetsList)
      setBalance(currentBalance)

      if (assetsList.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsList[0])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setAssets([])
      setBalance(0)
    }
  }

  const handlePlaceOrder = async (direction: 'CALL' | 'PUT') => {
    if (!selectedAsset) {
      toast.error('Please select an asset')
      return
    }
    if (amount <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amount > balance) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      const response = await api.createOrder({
        asset_id: selectedAsset.id,
        direction,
        amount,
        duration,
      })

      toast.success('Order placed successfully!')
      setBalance((prev) => prev - amount)
      
      // Reload balance to get exact value
      setTimeout(() => {
        loadData()
      }, 1000)
    } catch (error: any) {
      console.error('Order failed:', error)
      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Top Bar - Balance & Asset Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="card flex items-center gap-4">
            <DollarSign className="w-6 h-6 text-primary" />
            <div>
              <div className="text-sm text-gray-400">Balance</div>
              <div className="text-2xl font-bold font-mono">{formatCurrency(balance)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Asset:</label>
            <select
              value={selectedAsset?.id || ''}
              onChange={(e) => {
                const asset = assets.find((a) => a.id === e.target.value)
                if (asset) setSelectedAsset(asset)
              }}
              className="min-w-[200px]"
              disabled={assets.length === 0}
            >
              {assets.length === 0 ? (
                <option value="">No assets available</option>
              ) : (
                assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.profitRate}%)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="col-span-2 space-y-4">
            <PriceDisplay />

            <div className="card">
              <div className="text-center text-gray-400 py-12">
                Chart will be rendered here using lightweight-charts
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            {/* Amount */}
            <div className="card">
              <label className="input-label mb-3">Investment Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                step="100"
                className="w-full text-2xl font-mono text-center"
              />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[100, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="btn btn-secondary py-2 text-sm"
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="card">
              <label className="input-label mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-center text-lg"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? 'Minute' : 'Minutes'}
                  </option>
                ))}
              </select>
            </div>

            {/* Potential Profit */}
            {selectedAsset && (
              <div className="card bg-primary/10 border-primary/30">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Potential Profit</div>
                  <div className="text-3xl font-bold text-success">
                    +{formatCurrency((amount * selectedAsset.profitRate) / 100)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ({selectedAsset.profitRate}% return)
                  </div>
                </div>
              </div>
            )}

            {/* Order Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePlaceOrder('CALL')}
                disabled={loading || !selectedAsset || assets.length === 0}
                className="btn bg-success hover:bg-success-dark text-white py-4 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpCircle className="w-6 h-6" />
                <span className="font-bold text-lg">CALL</span>
                <span className="text-xs opacity-80">Price will rise</span>
              </button>

              <button
                onClick={() => handlePlaceOrder('PUT')}
                disabled={loading || !selectedAsset || assets.length === 0}
                className="btn bg-danger hover:bg-danger-dark text-white py-4 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownCircle className="w-6 h-6" />
                <span className="font-bold text-lg">PUT</span>
                <span className="text-xs opacity-80">Price will fall</span>
              </button>
            </div>

            {loading && (
              <div className="text-center text-sm text-gray-400">
                Placing order...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}