// store/trading.ts - ✅ TAMBAHKAN ASSETS STATE
import { create } from 'zustand'
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware'
import { Asset, PriceData, AccountType } from '@/types'

interface TradingState {
  selectedAsset: Asset | null
  currentPrice: PriceData | null
  priceHistory: PriceData[]
  isChartReady: boolean
  lastUpdate: number
  selectedAccountType: AccountType
  assets: Asset[] // ✅ TAMBAHKAN INI
  
  setSelectedAsset: (asset: Asset | null) => void
  setCurrentPrice: (price: PriceData) => void
  addPriceToHistory: (price: PriceData) => void
  clearPriceHistory: () => void
  setChartReady: (ready: boolean) => void
  setSelectedAccountType: (accountType: AccountType) => void
  setAssets: (assets: Asset[]) => void // ✅ TAMBAHKAN INI
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
        assets: [], // ✅ INITIAL STATE
        
        setSelectedAsset: (asset) => {
          const current = get().selectedAsset
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
            const exists = state.priceHistory.some(p => 
              p.timestamp === price.timestamp
            )
            
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
        
        setAssets: (assets) => { // ✅ ACTION BARU
          set({ assets }, false, { type: 'setAssets' })
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

export const useSelectedAsset = () => 
  useTradingStore(state => state.selectedAsset)

export const useCurrentPrice = () => 
  useTradingStore(state => state.currentPrice)

export const useIsChartReady = () => 
  useTradingStore(state => state.isChartReady)

export const usePriceHistory = () => 
  useTradingStore(state => state.priceHistory)

export const useSelectedAccountType = () =>
  useTradingStore(state => state.selectedAccountType)

export const useTradingAssets = () => // ✅ HOOK BARU
  useTradingStore(state => state.assets)

export const useTradingData = () => {
  const selectedAsset = useTradingStore(state => state.selectedAsset)
  const currentPrice = useTradingStore(state => state.currentPrice)
  const isChartReady = useTradingStore(state => state.isChartReady)
  const selectedAccountType = useTradingStore(state => state.selectedAccountType)
  const assets = useTradingStore(state => state.assets) // ✅ TAMBAHKAN
  
  return { selectedAsset, currentPrice, isChartReady, selectedAccountType, assets }
}

export const useTradingActions = () => {
  const setSelectedAsset = useTradingStore(state => state.setSelectedAsset)
  const setCurrentPrice = useTradingStore(state => state.setCurrentPrice)
  const addPriceToHistory = useTradingStore(state => state.addPriceToHistory)
  const clearPriceHistory = useTradingStore(state => state.clearPriceHistory)
  const setChartReady = useTradingStore(state => state.setChartReady)
  const setSelectedAccountType = useTradingStore(state => state.setSelectedAccountType)
  const setAssets = useTradingStore(state => state.setAssets) // ✅ TAMBAHKAN
  
  return {
    setSelectedAsset,
    setCurrentPrice,
    addPriceToHistory,
    clearPriceHistory,
    setChartReady,
    setSelectedAccountType,
    setAssets // ✅ TAMBAHKAN
  }
}