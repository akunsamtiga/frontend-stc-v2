import { create } from 'zustand'
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware'
import { TimezoneUtil } from '@/lib/timezone'
import { CalculationUtil } from '@/lib/calculation'
import { Asset, PriceData, AccountType } from '@/types'

interface TradingState {
  selectedAsset: Asset | null
  currentPrice: PriceData | null
  priceHistory: PriceData[]
  isChartReady: boolean
  lastUpdate: number
  selectedAccountType: AccountType
  assets: Asset[]
  orderTiming: {
    entryTimestamp: number
    expiryTimestamp: number
    durationDisplay: string
    isEndOfCandle: boolean
  } | null
  
  setSelectedAsset: (asset: Asset | null) => void
  setCurrentPrice: (price: PriceData) => void
  addPriceToHistory: (price: PriceData) => void
  clearPriceHistory: () => void
  setChartReady: (ready: boolean) => void
  setSelectedAccountType: (accountType: AccountType) => void
  setAssets: (assets: Asset[]) => void
  updateOrderTiming: (duration: number) => void
  clearOrderTiming: () => void
}

const MAX_HISTORY = 100
const UPDATE_THROTTLE = 100

export const useTradingStore = create<TradingState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        selectedAsset: null,
        currentPrice: null,
        priceHistory: [],
        isChartReady: false,
        lastUpdate: 0,
        selectedAccountType: 'demo' as AccountType,
        assets: [],
        orderTiming: null,
        
        setSelectedAsset: (asset) => {
          const current = get().selectedAsset
          if (current?.id === asset?.id) return
          
          set({ 
            selectedAsset: asset,
            isChartReady: false,
            priceHistory: [],
            currentPrice: null,
            lastUpdate: Date.now(),
            orderTiming: null
          }, false, { type: 'setSelectedAsset' })
          
          const duration = get().selectedAsset?.tradingSettings?.allowedDurations?.[0]
          if (duration) {
            get().updateOrderTiming(duration)
          }
        },
        
        setCurrentPrice: (price) => {
          const state = get()
          const now = Date.now()
          
          if (now - state.lastUpdate < UPDATE_THROTTLE) {
            return
          }
          
          const current = state.currentPrice
          if (current && Math.abs(current.price - price.price) < 0.0001) {
            return
          }
          
          set({ 
            currentPrice: price,
            lastUpdate: now
          }, false, { type: 'setCurrentPrice' })
          
          if (!state.isChartReady && state.priceHistory.length >= 10) {
            set({ isChartReady: true }, false, { type: 'autoSetChartReady' })
          }
        },
        
        addPriceToHistory: (price) => {
          set((state) => {
            const exists = state.priceHistory.some(p => p.timestamp === price.timestamp)
            
            if (exists) return state
            
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
        },
        
        setSelectedAccountType: (accountType) => {
          if (get().selectedAccountType === accountType) return
          set({ selectedAccountType: accountType }, false, { type: 'setSelectedAccountType' })
        },
        
        setAssets: (assets) => {
          set({ assets }, false, { type: 'setAssets' })
        },
        
        updateOrderTiming: (duration) => {
          const asset = get().selectedAsset
          if (!asset) return
          
          const timing = CalculationUtil.formatOrderTiming(asset, duration)
          
          set({ orderTiming: timing }, false, { type: 'updateOrderTiming' })
          
          console.log('Order timing updated:', {
            asset: asset.symbol,
            entry: timing.entryDateTime,
            expiry: timing.expiryDateTime,
            duration: timing.durationDisplay,
            isEndOfCandle: timing.isEndOfCandle,
          })
        },
        
        clearOrderTiming: () => {
          set({ orderTiming: null }, false, { type: 'clearOrderTiming' })
        }
      })),
      {
        name: 'trading-storage',
        partialize: (state) => ({ 
          selectedAccountType: state.selectedAccountType 
        })
      }
    ),
    { name: 'TradingStore' }
  )
)

export const useSelectedAsset = () => useTradingStore(state => state.selectedAsset)
export const useCurrentPrice = () => useTradingStore(state => state.currentPrice)
export const useIsChartReady = () => useTradingStore(state => state.isChartReady)
export const usePriceHistory = () => useTradingStore(state => state.priceHistory)
export const useSelectedAccountType = () => useTradingStore(state => state.selectedAccountType)
export const useTradingAssets = () => useTradingStore(state => state.assets)
export const useOrderTiming = () => useTradingStore(state => state.orderTiming)

export const useTradingData = () => {
  const selectedAsset = useTradingStore(state => state.selectedAsset)
  const currentPrice = useTradingStore(state => state.currentPrice)
  const isChartReady = useTradingStore(state => state.isChartReady)
  const selectedAccountType = useTradingStore(state => state.selectedAccountType)
  const assets = useTradingStore(state => state.assets)
  
  return { selectedAsset, currentPrice, isChartReady, selectedAccountType, assets }
}

export const useTradingActions = () => {
  const store = useTradingStore()
  return {
    setSelectedAsset: store.setSelectedAsset,
    setCurrentPrice: store.setCurrentPrice,
    addPriceToHistory: store.addPriceToHistory,
    clearPriceHistory: store.clearPriceHistory,
    setChartReady: store.setChartReady,
    setSelectedAccountType: store.setSelectedAccountType,
    setAssets: store.setAssets,
    updateOrderTiming: store.updateOrderTiming,
    clearOrderTiming: store.clearOrderTiming,
  }
}