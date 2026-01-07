// lib/crypto-price.ts - CryptoCompare API Integration
import axios from 'axios'

const CRYPTOCOMPARE_API_KEY = process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY || 'demo'
const BASE_URL = 'https://min-api.cryptocompare.com/data'

export interface CryptoPriceData {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  lastUpdate: number
}

export interface LiveTradeData {
  user: string
  asset: string
  profit: number
  time: string
}

// Cache untuk menghindari rate limit
const priceCache = new Map<string, { data: CryptoPriceData; timestamp: number }>()
const CACHE_DURATION = 10000 // 10 seconds

/**
 * Get current price for multiple cryptocurrencies
 */
export async function getCryptoPrices(
  symbols: string[] = ['BTC', 'ETH', 'BNB'],
  currency: string = 'USD'
): Promise<Record<string, CryptoPriceData>> {
  try {
    const fsyms = symbols.join(',')
    const cacheKey = `${fsyms}-${currency}`
    
    // Check cache
    const cached = priceCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { [symbols[0]]: cached.data }
    }

    // Fetch from API
    const response = await axios.get(`${BASE_URL}/pricemultifull`, {
      params: {
        fsyms,
        tsyms: currency,
        api_key: CRYPTOCOMPARE_API_KEY
      },
      timeout: 5000
    })

    const raw = response.data.RAW
    const result: Record<string, CryptoPriceData> = {}

    symbols.forEach(symbol => {
      if (raw[symbol] && raw[symbol][currency]) {
        const data = raw[symbol][currency]
        const priceData: CryptoPriceData = {
          symbol: `${symbol}/${currency}`,
          name: symbol,
          price: data.PRICE,
          change24h: data.CHANGE24HOUR,
          changePercent24h: data.CHANGEPCT24HOUR,
          high24h: data.HIGH24HOUR,
          low24h: data.LOW24HOUR,
          volume24h: data.VOLUME24HOURTO,
          lastUpdate: data.LASTUPDATE
        }
        result[symbol] = priceData
        
        // Cache individual data
        priceCache.set(`${symbol}-${currency}`, {
          data: priceData,
          timestamp: Date.now()
        })
      }
    })

    return result
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error)
    // Return mock data as fallback
    return getMockPrices(symbols, currency)
  }
}

/**
 * Get single crypto price
 */
export async function getSingleCryptoPrice(
  symbol: string,
  currency: string = 'USD'
): Promise<CryptoPriceData | null> {
  try {
    const prices = await getCryptoPrices([symbol], currency)
    return prices[symbol] || null
  } catch (error) {
    console.error(`Failed to fetch ${symbol} price:`, error)
    return null
  }
}

/**
 * Subscribe to price updates (polling)
 */
export function subscribeToCryptoPrices(
  symbols: string[],
  callback: (prices: Record<string, CryptoPriceData>) => void,
  interval: number = 5000
): () => void {
  let isActive = true
  
  const fetchPrices = async () => {
    if (!isActive) return
    
    try {
      const prices = await getCryptoPrices(symbols)
      callback(prices)
    } catch (error) {
      console.error('Price update failed:', error)
    }
    
    if (isActive) {
      setTimeout(fetchPrices, interval)
    }
  }

  // Initial fetch
  fetchPrices()

  // Return cleanup function
  return () => {
    isActive = false
  }
}

/**
 * Generate mock live trading data
 */
export function generateLiveTrade(cryptoSymbol: string, price: number): LiveTradeData {
  const names = [
    'Ahmad***', 'Siti***', 'Budi***', 'Rina***', 'Deni***', 'Maya***',
    'Andi***', 'Fitri***', 'Joko***', 'Dewi***', 'Agus***', 'Lina***'
  ]
  
  const profit = Math.floor(Math.random() * 15000) + 3000
  
  return {
    user: names[Math.floor(Math.random() * names.length)],
    asset: cryptoSymbol,
    profit,
    time: 'baru saja'
  }
}

/**
 * Format price for display
 */
export function formatCryptoPrice(price: number): string {
  if (price >= 1000) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  } else if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price)
  } else {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(price)
  }
}

/**
 * Format change percentage
 */
export function formatChangePercent(change: number): string {
  const formatted = Math.abs(change).toFixed(2)
  return change >= 0 ? `+${formatted}%` : `-${formatted}%`
}

/**
 * Mock data fallback
 */
function getMockPrices(symbols: string[], currency: string): Record<string, CryptoPriceData> {
  const mockPrices: Record<string, number> = {
    BTC: 68342,
    ETH: 3456.78,
    BNB: 582.45,
    SOL: 142.35,
    XRP: 0.6234,
    ADA: 0.4567,
    DOT: 7.89,
    MATIC: 0.8934
  }

  const result: Record<string, CryptoPriceData> = {}

  symbols.forEach(symbol => {
    const basePrice = mockPrices[symbol] || 100
    const change = (Math.random() - 0.5) * 5
    
    result[symbol] = {
      symbol: `${symbol}/${currency}`,
      name: symbol,
      price: basePrice,
      change24h: (basePrice * change) / 100,
      changePercent24h: change,
      high24h: basePrice * 1.05,
      low24h: basePrice * 0.95,
      volume24h: Math.random() * 1000000000,
      lastUpdate: Date.now() / 1000
    }
  })

  return result
}

/**
 * Clear price cache
 */
export function clearPriceCache(): void {
  priceCache.clear()
}