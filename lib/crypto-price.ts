// lib/crypto-price.ts - Binance API Integration
import axios from 'axios'

const BINANCE_API_BASE = 'https://api.binance.com/api/v3'

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
 * Convert crypto symbol to Binance format
 * BTC -> BTCUSDT, ETH -> ETHUSDT
 */
function toBinanceSymbol(symbol: string, currency: string = 'USDT'): string {
  return `${symbol}${currency}`
}

/**
 * Get current price for multiple cryptocurrencies from Binance
 */
export async function getCryptoPrices(
  symbols: string[] = ['BTC', 'ETH', 'BNB'],
  currency: string = 'USDT'
): Promise<Record<string, CryptoPriceData>> {
  try {
    const cacheKey = `${symbols.join(',')}-${currency}`
    
    // Check cache
    const cached = priceCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const result: Record<string, CryptoPriceData> = {}
      symbols.forEach(symbol => {
        const symbolCache = priceCache.get(`${symbol}-${currency}`)
        if (symbolCache) {
          result[symbol] = symbolCache.data
        }
      })
      if (Object.keys(result).length === symbols.length) {
        return result
      }
    }

    // Fetch 24hr ticker data for all symbols
    const binanceSymbols = symbols.map(s => toBinanceSymbol(s, currency))
    
    // Binance allows multiple symbols in one request
    const response = await axios.get(`${BINANCE_API_BASE}/ticker/24hr`, {
      params: {
        symbols: JSON.stringify(binanceSymbols)
      },
      timeout: 5000
    })

    const result: Record<string, CryptoPriceData> = {}

    response.data.forEach((ticker: any) => {
      // Extract original symbol (remove USDT)
      const originalSymbol = ticker.symbol.replace(currency, '')
      
      if (symbols.includes(originalSymbol)) {
        const priceData: CryptoPriceData = {
          symbol: `${originalSymbol}/${currency === 'USDT' ? 'USD' : currency}`,
          name: originalSymbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChange),
          changePercent24h: parseFloat(ticker.priceChangePercent),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          volume24h: parseFloat(ticker.quoteVolume),
          lastUpdate: ticker.closeTime / 1000
        }
        
        result[originalSymbol] = priceData
        
        // Cache individual data
        priceCache.set(`${originalSymbol}-${currency}`, {
          data: priceData,
          timestamp: Date.now()
        })
      }
    })

    // Cache combined result
    priceCache.set(cacheKey, {
      data: result[symbols[0]], // Just for cache structure
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error('Failed to fetch crypto prices from Binance:', error)
    // Return mock data as fallback
    return getMockPrices(symbols, currency)
  }
}

/**
 * Get single crypto price from Binance
 */
export async function getSingleCryptoPrice(
  symbol: string,
  currency: string = 'USDT'
): Promise<CryptoPriceData | null> {
  try {
    const cacheKey = `${symbol}-${currency}`
    
    // Check cache
    const cached = priceCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }

    const binanceSymbol = toBinanceSymbol(symbol, currency)
    
    const response = await axios.get(`${BINANCE_API_BASE}/ticker/24hr`, {
      params: {
        symbol: binanceSymbol
      },
      timeout: 5000
    })

    const ticker = response.data
    
    const priceData: CryptoPriceData = {
      symbol: `${symbol}/${currency === 'USDT' ? 'USD' : currency}`,
      name: symbol,
      price: parseFloat(ticker.lastPrice),
      change24h: parseFloat(ticker.priceChange),
      changePercent24h: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume24h: parseFloat(ticker.quoteVolume),
      lastUpdate: ticker.closeTime / 1000
    }

    // Cache the data
    priceCache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now()
    })

    return priceData
  } catch (error) {
    console.error(`Failed to fetch ${symbol} price from Binance:`, error)
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
  const usernames = [
    'kingtrader88', 'moon_hunter', 'trader_pro21', 'master_mind', 'hodl4life',
    'profit_seeker', 'diamond_hands', 'fire_warrior', 'swift_ninja', 'bullrun2024',
    'satoshi_fan', 'whale_alert', 'defi_king', 'moon_boy', 'alpha_trader',
    'lambo_soon', 'degen_ape', 'paper_hands', 'rekt_veteran', 'pumpit_up',
    'gem_hunter99', 'stack_lord', 'alt_season', 'wagmi_bro', 'wen_moon',
    'buy_the_dip', 'chart_wizard', 'bull_gang', 'legendary_ape', 'to_the_moon'
  ]
  
  const profit = Math.floor(Math.random() * 15000) + 3000
  
  return {
    user: usernames[Math.floor(Math.random() * usernames.length)],
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
 * Mock data fallback (same as before)
 */
function getMockPrices(symbols: string[], currency: string): Record<string, CryptoPriceData> {
  const mockPrices: Record<string, number> = {
    BTC: 98342.56,
    ETH: 3456.78,
    BNB: 682.45,
    SOL: 142.35,
    XRP: 2.3456,
    ADA: 0.8967,
    DOT: 7.89,
    MATIC: 0.8934
  }

  const result: Record<string, CryptoPriceData> = {}

  symbols.forEach(symbol => {
    const basePrice = mockPrices[symbol] || 100
    const change = (Math.random() - 0.5) * 5
    
    result[symbol] = {
      symbol: `${symbol}/${currency === 'USDT' ? 'USD' : currency}`,
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

/**
 * Get real-time price via WebSocket (optional, more efficient)
 * Usage: const ws = subscribeToWebSocket(['BTCUSDT', 'ETHUSDT'], callback)
 */
export function subscribeToWebSocket(
  symbols: string[],
  callback: (data: any) => void
): WebSocket | null {
  try {
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      callback(data)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    return ws
  } catch (error) {
    console.error('Failed to create WebSocket:', error)
    return null
  }
}