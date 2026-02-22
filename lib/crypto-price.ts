// lib/crypto-price.ts - Binance API Integration (axios → native fetch, -14KB bundle)
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
const CACHE_DURATION = 10_000 // 10 detik

function toBinanceSymbol(symbol: string, currency = 'USDT') {
  return `${symbol}${currency}`
}

/**
 * Fetch dengan timeout — pengganti axios.get + timeout config
 */
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

/**
 * Ambil harga beberapa kripto dari Binance sekaligus
 */
export async function getCryptoPrices(
  symbols: string[] = ['BTC', 'ETH', 'BNB'],
  currency = 'USDT'
): Promise<Record<string, CryptoPriceData>> {
  try {
    // Cek cache individual terlebih dahulu
    const cached: Record<string, CryptoPriceData> = {}
    const uncached: string[] = []

    for (const symbol of symbols) {
      const entry = priceCache.get(`${symbol}-${currency}`)
      if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
        cached[symbol] = entry.data
      } else {
        uncached.push(symbol)
      }
    }

    if (uncached.length === 0) return cached

    // Fetch hanya simbol yang belum di-cache
    const binanceSymbols = uncached.map(s => toBinanceSymbol(s, currency))
    const url =
      `${BINANCE_API_BASE}/ticker/24hr?symbols=` +
      encodeURIComponent(JSON.stringify(binanceSymbols))

    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new Error(`Binance API error: ${res.status}`)

    const tickers: any[] = await res.json()
    const result: Record<string, CryptoPriceData> = { ...cached }

    for (const ticker of tickers) {
      const originalSymbol = ticker.symbol.replace(currency, '')
      if (!uncached.includes(originalSymbol)) continue

      const priceData: CryptoPriceData = {
        symbol: `${originalSymbol}/${currency === 'USDT' ? 'USD' : currency}`,
        name: originalSymbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.quoteVolume),
        lastUpdate: ticker.closeTime / 1000,
      }

      result[originalSymbol] = priceData
      priceCache.set(`${originalSymbol}-${currency}`, {
        data: priceData,
        timestamp: Date.now(),
      })
    }

    return result
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to fetch crypto prices from Binance:', error)
    }
    return getMockPrices(symbols, currency)
  }
}

/**
 * Ambil harga satu kripto
 */
export async function getSingleCryptoPrice(
  symbol: string,
  currency = 'USDT'
): Promise<CryptoPriceData | null> {
  try {
    const cacheKey = `${symbol}-${currency}`
    const cached = priceCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data

    const res = await fetchWithTimeout(
      `${BINANCE_API_BASE}/ticker/24hr?symbol=${toBinanceSymbol(symbol, currency)}`
    )
    if (!res.ok) throw new Error(`Binance API error: ${res.status}`)

    const ticker = await res.json()

    const priceData: CryptoPriceData = {
      symbol: `${symbol}/${currency === 'USDT' ? 'USD' : currency}`,
      name: symbol,
      price: parseFloat(ticker.lastPrice),
      change24h: parseFloat(ticker.priceChange),
      changePercent24h: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume24h: parseFloat(ticker.quoteVolume),
      lastUpdate: ticker.closeTime / 1000,
    }

    priceCache.set(cacheKey, { data: priceData, timestamp: Date.now() })
    return priceData
  } catch {
    return null
  }
}

/**
 * Subscribe ke pembaruan harga (polling)
 * Mengembalikan fungsi cleanup untuk dipanggil di useEffect
 */
export function subscribeToCryptoPrices(
  symbols: string[],
  callback: (prices: Record<string, CryptoPriceData>) => void,
  interval = 5000
): () => void {
  let isActive = true

  const fetchPrices = async () => {
    if (!isActive) return
    try {
      const prices = await getCryptoPrices(symbols)
      if (isActive) callback(prices)
    } catch {
      // diam-diam gagal — tidak crash UI
    }
    if (isActive) setTimeout(fetchPrices, interval)
  }

  fetchPrices()
  return () => { isActive = false }
}

/**
 * Generate data live trading palsu
 */
export function generateLiveTrade(cryptoSymbol: string, price: number): LiveTradeData {
  const usernames = [
    'kingtrader88','moon_hunter','trader_pro21','master_mind','hodl4life',
    'profit_seeker','diamond_hands','fire_warrior','swift_ninja','bullrun2024',
    'satoshi_fan','whale_alert','defi_king','moon_boy','alpha_trader',
    'lambo_soon','degen_ape','paper_hands','rekt_veteran','pumpit_up',
    'gem_hunter99','stack_lord','alt_season','wagmi_bro','wen_moon',
    'buy_the_dip','chart_wizard','bull_gang','legendary_ape','to_the_moon',
  ]
  return {
    user: usernames[Math.floor(Math.random() * usernames.length)],
    asset: cryptoSymbol,
    profit: Math.floor(Math.random() * 15_000) + 3_000,
    time: 'baru saja',
  }
}

export function formatCryptoPrice(price: number): string {
  const opts: Intl.NumberFormatOptions =
    price >= 1000
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : price >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
      : { minimumFractionDigits: 4, maximumFractionDigits: 6 }
  return new Intl.NumberFormat('en-US', opts).format(price)
}

export function formatChangePercent(change: number): string {
  return `${change >= 0 ? '+' : '-'}${Math.abs(change).toFixed(2)}%`
}

function getMockPrices(symbols: string[], currency: string): Record<string, CryptoPriceData> {
  const mockPrices: Record<string, number> = {
    BTC: 98342.56, ETH: 3456.78, BNB: 682.45, SOL: 142.35,
    XRP: 2.3456, ADA: 0.8967, DOT: 7.89, MATIC: 0.8934,
  }
  return Object.fromEntries(
    symbols.map(symbol => {
      const basePrice = mockPrices[symbol] ?? 100
      const change = (Math.random() - 0.5) * 5
      return [
        symbol,
        {
          symbol: `${symbol}/${currency === 'USDT' ? 'USD' : currency}`,
          name: symbol,
          price: basePrice,
          change24h: (basePrice * change) / 100,
          changePercent24h: change,
          high24h: basePrice * 1.05,
          low24h: basePrice * 0.95,
          volume24h: Math.random() * 1_000_000_000,
          lastUpdate: Date.now() / 1000,
        } satisfies CryptoPriceData,
      ]
    })
  )
}

export function clearPriceCache(): void {
  priceCache.clear()
}

export function subscribeToWebSocket(
  symbols: string[],
  callback: (data: any) => void
): WebSocket | null {
  try {
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
    ws.onmessage = (event) => callback(JSON.parse(event.data))
    ws.onerror = (error) => {
      if (process.env.NODE_ENV !== 'production') console.error('WebSocket error:', error)
    }
    return ws
  } catch {
    return null
  }
}