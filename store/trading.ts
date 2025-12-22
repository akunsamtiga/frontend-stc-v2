import { create } from 'zustand'
import { Asset, PriceData } from '@/types'

interface TradingState {
  selectedAsset: Asset | null
  currentPrice: PriceData | null
  priceHistory: PriceData[]
  isChartReady: boolean
  setSelectedAsset: (asset: Asset | null) => void
  setCurrentPrice: (price: PriceData) => void
  addPriceToHistory: (price: PriceData) => void
  clearPriceHistory: () => void
  setChartReady: (ready: boolean) => void
}

const MAX_HISTORY = 500 // Reduced from 100 for better performance

export const useTradingStore = create<TradingState>((set, get) => ({
  selectedAsset: null,
  currentPrice: null,
  priceHistory: [],
  isChartReady: false,
  
  setSelectedAsset: (asset) => {
    set({ 
      selectedAsset: asset,
      isChartReady: false,
      priceHistory: [] // Clear history when changing asset
    })
  },
  
  setCurrentPrice: (price) => {
    set({ currentPrice: price })
    
    // Auto-add to history
    const state = get()
    if (!state.isChartReady && state.priceHistory.length >= 10) {
      set({ isChartReady: true })
    }
  },
  
  addPriceToHistory: (price) => {
    set((state) => {
      // Deduplicate by timestamp
      const existing = state.priceHistory.find(p => p.timestamp === price.timestamp)
      if (existing) return state
      
      const updated = [...state.priceHistory, price].slice(-MAX_HISTORY)
      return { priceHistory: updated }
    })
  },
  
  clearPriceHistory: () => set({ 
    priceHistory: [],
    isChartReady: false
  }),
  
  setChartReady: (ready) => set({ isChartReady: ready })
}))