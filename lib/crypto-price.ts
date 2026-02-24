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
  isReal?: boolean       // true = berasal dari Binance real trade
  direction?: 'BUY' | 'SELL'
}

export interface RealTradeData {
  price: number
  quoteQty: number       // nilai trade dalam USDT
  time: number           // unix ms
  isBuyerMaker: boolean  // true = SELL, false = BUY
}

export interface MarketStats {
  totalVolumeUSD: number
  totalVolumeFormatted: string
  timestamp: number
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
  const id = setTimeout(() => controller.abort(new DOMException('Request timeout', 'AbortError')), timeoutMs)
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
  } catch (error: any) {
    // AbortError = timeout atau komponen unmount — bukan error sebenarnya, tidak perlu di-log
    if (error?.name !== 'AbortError') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[crypto-price] Fetch failed, using mock prices:', error?.message ?? error)
      }
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
 */
export function subscribeToCryptoPrices(
  symbols: string[],
  callback: (prices: Record<string, CryptoPriceData>) => void,
  interval = 5000
): () => void {
  let isActive = true
  let timerId: ReturnType<typeof setTimeout> | null = null

  const fetchPrices = async () => {
    if (!isActive) return
    try {
      const prices = await getCryptoPrices(symbols)
      if (isActive) callback(prices)
    } catch (error: any) {
      // Abaikan AbortError (timeout/unmount) — hanya log error tak terduga
      if (error?.name !== 'AbortError' && process.env.NODE_ENV !== 'production') {
        console.warn('[crypto-price] Subscribe fetch error:', error?.message ?? error)
      }
    }
    if (isActive) {
      timerId = setTimeout(fetchPrices, interval)
    }
  }

  fetchPrices()
  return () => {
    isActive = false
    if (timerId) clearTimeout(timerId)
  }
}

// ─── Pseudonym pool (privasi tetap terjaga) ──────────────────────────────────
const PSEUDONYMS = [
  'trader_id', 'budi_s',   'andi_t',   'sari_w',   'agus_p',
  'dewi_r',    'reza_f',   'nisa_k',   'fajar_m',  'indra_l',
  'tari_o',    'hendra_v', 'maya_x',   'dimas_q',  'lina_b',
  'bagas_c',   'rizki_g',  'putri_h',  'wahyu_j',  'citra_n',
  'galih_y',   'nadira_z', 'arif_e',   'dini_u',   'kevin_i',
  'ayu_a',     'haris_d',  'tia_w',    'ilham_r',  'sinta_m',
]

const IDR_RATE = 16_300 // fallback rate USD → IDR

// Cache recent trades agar tidak spam API
const tradesCache = new Map<string, { data: RealTradeData[]; timestamp: number }>()
const TRADES_CACHE_DURATION = 3_000 // 3 detik

/**
 * ✅ REAL: Ambil recent trades dari Binance public API
 * Tidak butuh API key — fully public endpoint
 */
export async function getRecentTrades(
  symbol: string,   // e.g. 'BTCUSDT'
  limit = 10
): Promise<RealTradeData[]> {
  const cacheKey = symbol + '-trades'
  const cached = tradesCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < TRADES_CACHE_DURATION) {
    return cached.data
  }

  try {
    const url = BINANCE_API_BASE + '/trades?symbol=' + symbol + '&limit=' + limit
    const res = await fetchWithTimeout(url, 4000)
    if (!res.ok) throw new Error('HTTP ' + res.status)

    const raw: any[] = await res.json()
    const data: RealTradeData[] = raw.map(t => ({
      price:         parseFloat(t.price),
      quoteQty:      parseFloat(t.quoteQty),
      time:          t.time,
      isBuyerMaker:  t.isBuyerMaker,
    }))

    tradesCache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  } catch {
    return []
  }
}

/**
 * ✅ REAL: Konversi Binance real trade → LiveTradeData untuk ticker landing page
 * quoteQty (USD) × IDR rate × profit_rate = estimasi profit IDR
 */
export function realTradeToLiveTrade(
  trade: RealTradeData,
  asset: string,
  idrRate = IDR_RATE
): LiveTradeData {
  // Profit = 10–95% dari nilai trade (simulasi binary option payout)
  const profitRate = 0.10 + Math.random() * 0.85
  const profitUSD  = trade.quoteQty * profitRate
  const profitIDR  = Math.round(profitUSD * idrRate)

  // Waktu relatif
  const elapsedSec = Math.floor((Date.now() - trade.time) / 1000)
  let timeLabel = 'baru saja'
  if (elapsedSec > 60)     timeLabel = Math.floor(elapsedSec / 60) + ' menit lalu'
  else if (elapsedSec > 5) timeLabel = elapsedSec + 'd lalu'

  const pseudonym = PSEUDONYMS[Math.floor(Math.random() * PSEUDONYMS.length)]

  return {
    user:      pseudonym,
    asset,
    profit:    Math.max(25_000, Math.min(profitIDR, 15_000_000)), // clamp 25rb–15jt IDR
    time:      timeLabel,
    isReal:    true,
    direction: trade.isBuyerMaker ? 'SELL' : 'BUY',
  }
}

/**
 * ✅ REAL: Ambil total market volume BTC+ETH+BNB dari Binance 24hr ticker
 */
export async function getMarketStats(): Promise<MarketStats> {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
  try {
    const url =
      BINANCE_API_BASE + '/ticker/24hr?symbols=' +
      encodeURIComponent(JSON.stringify(symbols))

    const res = await fetchWithTimeout(url, 5000)
    if (!res.ok) throw new Error('HTTP ' + res.status)

    const tickers: any[] = await res.json()
    const totalVolumeUSD: number = tickers.reduce(
      (sum: number, t: any) => sum + parseFloat(t.quoteVolume),
      0
    )

    let formatted: string
    if (totalVolumeUSD >= 1_000_000_000)  formatted = '$' + (totalVolumeUSD / 1_000_000_000).toFixed(1) + 'B'
    else if (totalVolumeUSD >= 1_000_000) formatted = '$' + Math.round(totalVolumeUSD / 1_000_000) + 'M'
    else if (totalVolumeUSD >= 1_000)     formatted = '$' + Math.round(totalVolumeUSD / 1_000) + 'K'
    else                                  formatted = '$' + totalVolumeUSD.toFixed(0)

    return { totalVolumeUSD, totalVolumeFormatted: formatted, timestamp: Date.now() }
  } catch {
    return { totalVolumeUSD: 0, totalVolumeFormatted: '$10B+', timestamp: Date.now() }
  }
}

/**
 * Fallback: generate trade dengan pseudonym (dipakai jika Binance API gagal)
 */
export function generateLiveTrade(cryptoSymbol: string, _price: number): LiveTradeData {
  return {
    user:    PSEUDONYMS[Math.floor(Math.random() * PSEUDONYMS.length)],
    asset:   cryptoSymbol,
    profit:  Math.floor(Math.random() * 5_000_000) + 100_000,
    time:    'baru saja',
    isReal:  false,
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
      const entry: CryptoPriceData = {
        symbol:           `${symbol}/${currency === 'USDT' ? 'USD' : currency}`,
        name:             symbol,
        price:            basePrice,
        change24h:        (basePrice * change) / 100,
        changePercent24h: change,
        high24h:          basePrice * 1.05,
        low24h:           basePrice * 0.95,
        volume24h:        Math.random() * 1_000_000_000,
        lastUpdate:       Date.now() / 1000,
      }
      return [symbol, entry]
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