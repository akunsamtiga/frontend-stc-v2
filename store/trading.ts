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

const MAX_HISTORY = 100 // Reduced from 500 for better performance

export const useTradingStore = create<TradingState>((set, get) => ({
  selectedAsset: null,
  currentPrice: null,
  priceHistory: [],
  isChartReady: false,
  
  setSelectedAsset: (asset) => {
    // Only update if actually changed
    const current = get().selectedAsset
    if (current?.id === asset?.id) return
    
    set({ 
      selectedAsset: asset,
      isChartReady: false,
      priceHistory: [], // Clear history when changing asset
      currentPrice: null // Clear current price
    })
  },
  
  setCurrentPrice: (price) => {
    // Only update if price actually changed
    const current = get().currentPrice
    if (current && Math.abs(current.price - price.price) < 0.0001) return
    
    set({ currentPrice: price })
    
    // Auto-add to history
    const state = get()
    if (!state.isChartReady && state.priceHistory.length >= 10) {
      set({ isChartReady: true })
    }
  },
  
  addPriceToHistory: (price) => {
    set((state) => {
      // Check if price already exists (by timestamp)
      const exists = state.priceHistory.some(p => p.timestamp === price.timestamp)
      if (exists) return state
      
      // Add and keep only last MAX_HISTORY items
      const updated = [...state.priceHistory, price]
      if (updated.length > MAX_HISTORY) {
        updated.splice(0, updated.length - MAX_HISTORY)
      }
      
      return { priceHistory: updated }
    })
  },
  
  clearPriceHistory: () => set({ 
    priceHistory: [],
    isChartReady: false
  }),
  
  setChartReady: (ready) => {
    // Only update if actually changed
    if (get().isChartReady === ready) return
    set({ isChartReady: ready })
  }
}))

// Selector helpers for optimal re-renders
export const useSelectedAsset = () => useTradingStore(state => state.selectedAsset)
export const useCurrentPrice = () => useTradingStore(state => state.currentPrice)
export const useIsChartReady = () => useTradingStore(state => state.isChartReady)

// Multiple values selector (returns new object, but with specific properties)
export const useTradingData = () => {
  const selectedAsset = useSelectedAsset()
  const currentPrice = useCurrentPrice()
  const isChartReady = useIsChartReady()
  
  return { selectedAsset, currentPrice, isChartReady }
}