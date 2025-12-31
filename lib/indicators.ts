// lib/indicators.ts - Technical Indicators Library

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// ===================================
// MOVING AVERAGE (SMA)
// ===================================

export function calculateSMA(data: CandleData[], period: number): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    const average = sum / period
    result.push({
      time: data[i].time,
      value: average
    })
  }
  
  return result
}

// ===================================
// EXPONENTIAL MOVING AVERAGE (EMA)
// ===================================

export function calculateEMA(data: CandleData[], period: number): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  const multiplier = 2 / (period + 1)
  
  // Start with SMA for first value
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i].close
  }
  let ema = sum / period
  
  result.push({
    time: data[period - 1].time,
    value: ema
  })
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema
    result.push({
      time: data[i].time,
      value: ema
    })
  }
  
  return result
}

// ===================================
// BOLLINGER BANDS
// ===================================

export interface BollingerBand {
  time: number
  upper: number
  middle: number
  lower: number
}

export function calculateBollingerBands(
  data: CandleData[], 
  period: number = 20, 
  stdDev: number = 2
): BollingerBand[] {
  const result: BollingerBand[] = []
  
  for (let i = period - 1; i < data.length; i++) {
    // Calculate SMA (middle band)
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    const sma = sum / period
    
    // Calculate standard deviation
    let squaredDiffSum = 0
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma
      squaredDiffSum += diff * diff
    }
    const standardDeviation = Math.sqrt(squaredDiffSum / period)
    
    result.push({
      time: data[i].time,
      upper: sma + (stdDev * standardDeviation),
      middle: sma,
      lower: sma - (stdDev * standardDeviation)
    })
  }
  
  return result
}

// ===================================
// RSI (Relative Strength Index)
// ===================================

export function calculateRSI(data: CandleData[], period: number = 14): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  if (data.length < period + 1) return result
  
  // Calculate initial average gain and loss
  let avgGain = 0
  let avgLoss = 0
  
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close
    if (change > 0) {
      avgGain += change
    } else {
      avgLoss += Math.abs(change)
    }
  }
  
  avgGain /= period
  avgLoss /= period
  
  // Calculate RSI for first period
  let rs = avgGain / avgLoss
  let rsi = 100 - (100 / (1 + rs))
  
  result.push({
    time: data[period].time,
    value: rsi
  })
  
  // Calculate RSI for remaining periods using smoothed averages
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    
    avgGain = ((avgGain * (period - 1)) + gain) / period
    avgLoss = ((avgLoss * (period - 1)) + loss) / period
    
    rs = avgGain / avgLoss
    rsi = 100 - (100 / (1 + rs))
    
    result.push({
      time: data[i].time,
      value: rsi
    })
  }
  
  return result
}

// ===================================
// MACD (Moving Average Convergence Divergence)
// ===================================

export interface MACDData {
  time: number
  macd: number
  signal: number
  histogram: number
}

export function calculateMACD(
  data: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  const result: MACDData[] = []
  
  // Calculate fast and slow EMA
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  // Calculate MACD line (difference between fast and slow EMA)
  const macdLine: Array<{ time: number; value: number }> = []
  
  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA.find(f => f.time === slowEMA[i].time)
    if (fastValue) {
      macdLine.push({
        time: slowEMA[i].time,
        value: fastValue.value - slowEMA[i].value
      })
    }
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine: Array<{ time: number; value: number }> = []
  const multiplier = 2 / (signalPeriod + 1)
  
  if (macdLine.length >= signalPeriod) {
    // Start with SMA for signal line
    let sum = 0
    for (let i = 0; i < signalPeriod; i++) {
      sum += macdLine[i].value
    }
    let emaSignal = sum / signalPeriod
    
    signalLine.push({
      time: macdLine[signalPeriod - 1].time,
      value: emaSignal
    })
    
    // Calculate EMA for remaining values
    for (let i = signalPeriod; i < macdLine.length; i++) {
      emaSignal = (macdLine[i].value - emaSignal) * multiplier + emaSignal
      signalLine.push({
        time: macdLine[i].time,
        value: emaSignal
      })
    }
  }
  
  // Combine MACD and Signal to create histogram
  for (let i = 0; i < signalLine.length; i++) {
    const macdValue = macdLine.find(m => m.time === signalLine[i].time)
    if (macdValue) {
      result.push({
        time: signalLine[i].time,
        macd: macdValue.value,
        signal: signalLine[i].value,
        histogram: macdValue.value - signalLine[i].value
      })
    }
  }
  
  return result
}

// ===================================
// VOLUME PROFILE
// ===================================

export function calculateVolumeMA(data: CandleData[], period: number = 20): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].volume || 0
    }
    const average = sum / period
    result.push({
      time: data[i].time,
      value: average
    })
  }
  
  return result
}

// ===================================
// STOCHASTIC OSCILLATOR
// ===================================

export interface StochasticData {
  time: number
  k: number
  d: number
}

export function calculateStochastic(
  data: CandleData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticData[] {
  const result: StochasticData[] = []
  const kValues: Array<{ time: number; value: number }> = []
  
  // Calculate %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    let highestHigh = data[i].high
    let lowestLow = data[i].low
    
    for (let j = 0; j < kPeriod; j++) {
      highestHigh = Math.max(highestHigh, data[i - j].high)
      lowestLow = Math.min(lowestLow, data[i - j].low)
    }
    
    const k = ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100
    kValues.push({
      time: data[i].time,
      value: k
    })
  }
  
  // Calculate %D (SMA of %K)
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    let sum = 0
    for (let j = 0; j < dPeriod; j++) {
      sum += kValues[i - j].value
    }
    const d = sum / dPeriod
    
    result.push({
      time: kValues[i].time,
      k: kValues[i].value,
      d: d
    })
  }
  
  return result
}

// ===================================
// ATR (Average True Range)
// ===================================

export function calculateATR(data: CandleData[], period: number = 14): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  if (data.length < period + 1) return result
  
  // Calculate True Range for each period
  const trueRanges: number[] = []
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high
    const low = data[i].low
    const prevClose = data[i - 1].close
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    
    trueRanges.push(tr)
  }
  
  // Calculate initial ATR (simple average)
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i]
  }
  let atr = sum / period
  
  result.push({
    time: data[period].time,
    value: atr
  })
  
  // Calculate smoothed ATR
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period
    result.push({
      time: data[i + 1].time,
      value: atr
    })
  }
  
  return result
}