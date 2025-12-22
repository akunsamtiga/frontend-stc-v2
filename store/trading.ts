import { create } from 'zustand'
import { Asset, PriceData } from '@/types'

interface TradingState {
  selectedAsset: Asset | null
  currentPrice: PriceData | null
  priceHistory: PriceData[]
  setSelectedAsset: (asset: Asset | null) => void
  setCurrentPrice: (price: PriceData) => void
  addPriceToHistory: (price: PriceData) => void
  clearPriceHistory: () => void
}

const MAX_HISTORY = 100

export const useTradingStore = create<TradingState>((set) => ({
  selectedAsset: null,
  currentPrice: null,
  priceHistory: [],
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setCurrentPrice: (price) => set({ currentPrice: price }),
  addPriceToHistory: (price) =>
    set((state) => ({
      priceHistory: [...state.priceHistory.slice(-MAX_HISTORY + 1), price],
    })),
  clearPriceHistory: () => set({ priceHistory: [] }),
}))
