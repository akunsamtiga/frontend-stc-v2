// store/trading.ts - FIXED VERSION
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { Asset, PriceData } from '@/types'

interface TradingState {
  selectedAsset: Asset | null
  currentPrice: PriceData | null
  priceHistory: PriceData[]
  isChartReady: boolean
  lastUpdate: number
  
  // Actions
  setSelectedAsset: (asset: Asset | null) => void
  setCurrentPrice: (price: PriceData) => void
  addPriceToHistory: (price: PriceData) => void
  clearPriceHistory: () => void
  setChartReady: (ready: boolean) => void
}

const MAX_HISTORY = 100
const UPDATE_THROTTLE = 100 // ms - prevent too frequent updates

export const useTradingStore = create<TradingState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      selectedAsset: null,
      currentPrice: null,
      priceHistory: [],
      isChartReady: false,
      lastUpdate: 0,
      
      setSelectedAsset: (asset) => {
        const current = get().selectedAsset
        // Only update if actually changed
        if (current?.id === asset?.id) return
        
        set({ 
          selectedAsset: asset,
          isChartReady: false,
          priceHistory: [],
          currentPrice: null,
          lastUpdate: Date.now()
        }, false, { type: 'setSelectedAsset' })
      },
      
      setCurrentPrice: (price) => {
        const state = get()
        const now = Date.now()
        
        // Throttle updates
        if (now - state.lastUpdate < UPDATE_THROTTLE) {
          return
        }
        
        // Check if price actually changed
        const current = state.currentPrice
        if (current && Math.abs(current.price - price.price) < 0.0001) {
          return
        }
        
        set({ 
          currentPrice: price,
          lastUpdate: now
        }, false, { type: 'setCurrentPrice' })
        
        // Auto set chart ready when we have enough data
        if (!state.isChartReady && state.priceHistory.length >= 10) {
          set({ isChartReady: true }, false, { type: 'autoSetChartReady' })
        }
      },
      
      addPriceToHistory: (price) => {
        set((state) => {
          // Check for duplicates
          const exists = state.priceHistory.some(p => 
            p.timestamp === price.timestamp
          )
          
          if (exists) return state
          
          // Add and trim
          const updated = [...state.priceHistory, price]
          if (updated.length > MAX_HISTORY) {
            updated.splice(0, updated.length - MAX_HISTORY)
          }
          
          return { priceHistory: updated }
        }, false, { type: 'addPriceToHistory' })
      },
      
      clearPriceHistory: () => set({ 
        priceHistory: [],
        isChartReady: false 
      }, false, { type: 'clearPriceHistory' }),
      
      setChartReady: (ready) => {
        if (get().isChartReady === ready) return
        set({ isChartReady: ready }, false, { type: 'setChartReady' })
      }
    })),
    { name: 'TradingStore' }
  )
)

// ===================================
// OPTIMIZED SELECTORS
// ===================================

// Simple selectors without shallow comparison
export const useSelectedAsset = () => 
  useTradingStore(state => state.selectedAsset)

export const useCurrentPrice = () => 
  useTradingStore(state => state.currentPrice)

export const useIsChartReady = () => 
  useTradingStore(state => state.isChartReady)

export const usePriceHistory = () => 
  useTradingStore(state => state.priceHistory)

// Composite selector using manual comparison
export const useTradingData = () => {
  const selectedAsset = useTradingStore(state => state.selectedAsset)
  const currentPrice = useTradingStore(state => state.currentPrice)
  const isChartReady = useTradingStore(state => state.isChartReady)
  
  return { selectedAsset, currentPrice, isChartReady }
}

// Action selectors (stable references)
export const useTradingActions = () => {
  const setSelectedAsset = useTradingStore(state => state.setSelectedAsset)
  const setCurrentPrice = useTradingStore(state => state.setCurrentPrice)
  const addPriceToHistory = useTradingStore(state => state.addPriceToHistory)
  const clearPriceHistory = useTradingStore(state => state.clearPriceHistory)
  const setChartReady = useTradingStore(state => state.setChartReady)
  
  return {
    setSelectedAsset,
    setCurrentPrice,
    addPriceToHistory,
    clearPriceHistory,
    setChartReady
  }
}