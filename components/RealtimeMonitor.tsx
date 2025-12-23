'use client'

import { useState, useEffect } from 'react'
import { subscribeToPriceUpdates } from '@/lib/firebase'
import { Activity, Wifi, WifiOff } from 'lucide-react'

interface Update {
  time: string
  price: number
  change: number
}

export default function RealtimeMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [updates, setUpdates] = useState<Update[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    console.log('🎯 RealtimeMonitor: Starting subscription...')
    
    const unsubscribe = subscribeToPriceUpdates('/idx_stc/current_price', (data) => {
      console.log('🎯 RealtimeMonitor: Received update:', data)
      
      setIsConnected(true)
      setLastUpdate(new Date())
      
      const update: Update = {
        time: new Date().toLocaleTimeString(),
        price: data.price,
        change: data.change || 0
      }
      
      setUpdates(prev => [update, ...prev].slice(0, 20)) // Keep last 20
    })

    // Check connection status
    const interval = setInterval(() => {
      if (lastUpdate) {
        const timeSinceUpdate = Date.now() - lastUpdate.getTime()
        if (timeSinceUpdate > 10000) { // 10 seconds
          setIsConnected(false)
        }
      }
    }, 1000)

    return () => {
      console.log('🎯 RealtimeMonitor: Cleaning up...')
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg z-50"
        title="Realtime Monitor"
      >
        <Activity className="w-5 h-5 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-[#0f1419] border border-gray-800 rounded-lg shadow-2xl z-50 max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm">Live Updates</h3>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Wifi className="w-3 h-3 animate-pulse" />
              <span>LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <WifiOff className="w-3 h-3" />
              <span>Disconnected</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Updates List */}
      <div className="flex-1 overflow-y-auto p-3">
        {updates.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>Waiting for updates...</p>
            <p className="text-xs mt-1">
              Check if simulator is running
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {updates.map((update, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded transition-all ${
                  i === 0 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'bg-[#1a1f2e] border border-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400">{update.time}</span>
                  <span className={`font-bold ${
                    update.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {update.change >= 0 ? '+' : ''}{update.change.toFixed(3)}%
                  </span>
                </div>
                <div className="font-mono font-bold text-sm">
                  {update.price.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800">
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <span>{updates.length} updates received</span>
          {lastUpdate && (
            <span>Last: {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>
          )}
        </div>
      </div>
    </div>
  )
}