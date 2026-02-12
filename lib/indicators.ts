// lib/indicators.ts - Technical Indicators Library (Enhanced)

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
// WEIGHTED MOVING AVERAGE (WMA)
// ===================================

export function calculateWMA(data: CandleData[], period: number): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  const weights = Array.from({ length: period }, (_, i) => i + 1)
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close * weights[period - 1 - j]
    }
    result.push({
      time: data[i].time,
      value: sum / weightSum
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
  width: number
  percentB: number
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
    
    const upper = sma + (stdDev * standardDeviation)
    const lower = sma - (stdDev * standardDeviation)
    const width = upper - lower
    const percentB = (data[i].close - lower) / width
    
    result.push({
      time: data[i].time,
      upper,
      middle: sma,
      lower,
      width,
      percentB
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

// ===================================
// ADX (Average Directional Index)
// ===================================

export interface ADXData {
  time: number
  adx: number
  plusDI: number
  minusDI: number
}

export function calculateADX(data: CandleData[], period: number = 14): ADXData[] {
  const result: ADXData[] = []
  
  if (data.length < period + 1) return result
  
  const trueRanges: number[] = []
  const plusDM: number[] = []
  const minusDM: number[] = []
  
  // Calculate True Range, +DM, and -DM
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high
    const low = data[i].low
    const prevHigh = data[i - 1].high
    const prevLow = data[i - 1].low
    const prevClose = data[i - 1].close
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    )
    trueRanges.push(tr)
    
    const upMove = high - prevHigh
    const downMove = prevLow - low
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
  }
  
  // Calculate smoothed TR, +DM, and -DM
  let smoothedTR = trueRanges.slice(0, period).reduce((sum, val) => sum + val, 0)
  let smoothedPlusDM = plusDM.slice(0, period).reduce((sum, val) => sum + val, 0)
  let smoothedMinusDM = minusDM.slice(0, period).reduce((sum, val) => sum + val, 0)
  
  const dxValues: number[] = []
  
  for (let i = period; i < data.length; i++) {
    smoothedTR = smoothedTR - (smoothedTR / period) + trueRanges[i - 1]
    smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDM[i - 1]
    smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDM[i - 1]
    
    const plusDI = (smoothedPlusDM / smoothedTR) * 100
    const minusDI = (smoothedMinusDM / smoothedTR) * 100
    
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100
    dxValues.push(dx)
  }
  
  // Calculate ADX (smoothed DX)
  if (dxValues.length >= period) {
    let adx = dxValues.slice(0, period).reduce((sum, val) => sum + val, 0) / period
    
    result.push({
      time: data[period * 2].time,
      adx,
      plusDI: (smoothedPlusDM / smoothedTR) * 100,
      minusDI: (smoothedMinusDM / smoothedTR) * 100
    })
    
    for (let i = period; i < dxValues.length; i++) {
      adx = ((adx * (period - 1)) + dxValues[i]) / period
      result.push({
        time: data[period + i + 1].time,
        adx,
        plusDI: (smoothedPlusDM / smoothedTR) * 100,
        minusDI: (smoothedMinusDM / smoothedTR) * 100
      })
    }
  }
  
  return result
}

// ===================================
// CCI (Commodity Channel Index)
// ===================================

export function calculateCCI(data: CandleData[], period: number = 20): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  const constant = 0.015
  
  for (let i = period - 1; i < data.length; i++) {
    // Calculate Typical Price
    const typicalPrices: number[] = []
    for (let j = 0; j < period; j++) {
      const tp = (data[i - j].high + data[i - j].low + data[i - j].close) / 3
      typicalPrices.push(tp)
    }
    
    // Calculate SMA of Typical Price
    const smaTP = typicalPrices.reduce((sum, val) => sum + val, 0) / period
    
    // Calculate Mean Deviation
    const meanDev = typicalPrices.reduce((sum, val) => sum + Math.abs(val - smaTP), 0) / period
    
    // Calculate CCI
    const currentTP = (data[i].high + data[i].low + data[i].close) / 3
    const cci = (currentTP - smaTP) / (constant * meanDev)
    
    result.push({
      time: data[i].time,
      value: cci
    })
  }
  
  return result
}

// ===================================
// PARABOLIC SAR
// ===================================

export interface ParabolicSARData {
  time: number
  value: number
  isLong: boolean
}

export function calculateParabolicSAR(
  data: CandleData[], 
  accelerationFactor: number = 0.02,
  maxAF: number = 0.2
): ParabolicSARData[] {
  const result: ParabolicSARData[] = []
  
  if (data.length < 2) return result
  
  let isLong = data[1].close > data[0].close
  let sar = isLong ? data[0].low : data[0].high
  let extremePoint = isLong ? data[1].high : data[1].low
  let af = accelerationFactor
  
  result.push({
    time: data[0].time,
    value: sar,
    isLong
  })
  
  for (let i = 1; i < data.length; i++) {
    // Calculate new SAR
    sar = sar + af * (extremePoint - sar)
    
    // Check for reversal
    const reversed = isLong ? data[i].low < sar : data[i].high > sar
    
    if (reversed) {
      isLong = !isLong
      sar = extremePoint
      extremePoint = isLong ? data[i].high : data[i].low
      af = accelerationFactor
    } else {
      // Update extreme point and acceleration factor
      if (isLong && data[i].high > extremePoint) {
        extremePoint = data[i].high
        af = Math.min(af + accelerationFactor, maxAF)
      } else if (!isLong && data[i].low < extremePoint) {
        extremePoint = data[i].low
        af = Math.min(af + accelerationFactor, maxAF)
      }
    }
    
    result.push({
      time: data[i].time,
      value: sar,
      isLong
    })
  }
  
  return result
}

// ===================================
// WILLIAMS %R
// ===================================

export function calculateWilliamsR(data: CandleData[], period: number = 14): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  for (let i = period - 1; i < data.length; i++) {
    let highestHigh = data[i].high
    let lowestLow = data[i].low
    
    for (let j = 0; j < period; j++) {
      highestHigh = Math.max(highestHigh, data[i - j].high)
      lowestLow = Math.min(lowestLow, data[i - j].low)
    }
    
    const williamsR = ((highestHigh - data[i].close) / (highestHigh - lowestLow)) * -100
    
    result.push({
      time: data[i].time,
      value: williamsR
    })
  }
  
  return result
}

// ===================================
// OBV (On Balance Volume)
// ===================================

export function calculateOBV(data: CandleData[]): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  if (data.length < 2) return result
  
  let obv = 0
  
  result.push({
    time: data[0].time,
    value: obv
  })
  
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume || 0
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume || 0
    }
    
    result.push({
      time: data[i].time,
      value: obv
    })
  }
  
  return result
}

// ===================================
// ICHIMOKU CLOUD
// ===================================

export interface IchimokuData {
  time: number
  tenkanSen: number
  kijunSen: number
  senkouSpanA: number
  senkouSpanB: number
  chikouSpan: number
}

export function calculateIchimoku(
  data: CandleData[],
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  senkouBPeriod: number = 52
): IchimokuData[] {
  const result: IchimokuData[] = []
  
  const displacement = 26
  
  for (let i = Math.max(tenkanPeriod, kijunPeriod, senkouBPeriod) - 1; i < data.length; i++) {
    // Tenkan-sen (Conversion Line)
    let tenkanHigh = -Infinity
    let tenkanLow = Infinity
    for (let j = 0; j < tenkanPeriod; j++) {
      tenkanHigh = Math.max(tenkanHigh, data[i - j].high)
      tenkanLow = Math.min(tenkanLow, data[i - j].low)
    }
    const tenkanSen = (tenkanHigh + tenkanLow) / 2
    
    // Kijun-sen (Base Line)
    let kijunHigh = -Infinity
    let kijunLow = Infinity
    for (let j = 0; j < kijunPeriod; j++) {
      kijunHigh = Math.max(kijunHigh, data[i - j].high)
      kijunLow = Math.min(kijunLow, data[i - j].low)
    }
    const kijunSen = (kijunHigh + kijunLow) / 2
    
    // Senkou Span A (Leading Span A)
    const senkouSpanA = (tenkanSen + kijunSen) / 2
    
    // Senkou Span B (Leading Span B)
    let senkouBHigh = -Infinity
    let senkouBLow = Infinity
    for (let j = 0; j < senkouBPeriod; j++) {
      if (i - j >= 0) {
        senkouBHigh = Math.max(senkouBHigh, data[i - j].high)
        senkouBLow = Math.min(senkouBLow, data[i - j].low)
      }
    }
    const senkouSpanB = (senkouBHigh + senkouBLow) / 2
    
    // Chikou Span (Lagging Span)
    const chikouSpan = data[i].close
    
    result.push({
      time: data[i].time,
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan
    })
  }
  
  return result
}

// ===================================
// VWAP (Volume Weighted Average Price)
// ===================================

export function calculateVWAP(data: CandleData[]): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  let cumulativeTPV = 0 // Typical Price * Volume
  let cumulativeVolume = 0
  
  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3
    const volume = data[i].volume || 1
    
    cumulativeTPV += typicalPrice * volume
    cumulativeVolume += volume
    
    const vwap = cumulativeTPV / cumulativeVolume
    
    result.push({
      time: data[i].time,
      value: vwap
    })
  }
  
  return result
}

// ===================================
// KELTNER CHANNELS
// ===================================

export interface KeltnerChannel {
  time: number
  upper: number
  middle: number
  lower: number
}

export function calculateKeltnerChannels(
  data: CandleData[],
  emaPeriod: number = 20,
  atrPeriod: number = 10,
  multiplier: number = 2
): KeltnerChannel[] {
  const result: KeltnerChannel[] = []
  
  const ema = calculateEMA(data, emaPeriod)
  const atr = calculateATR(data, atrPeriod)
  
  for (let i = 0; i < ema.length; i++) {
    const atrValue = atr.find(a => a.time === ema[i].time)
    if (atrValue) {
      result.push({
        time: ema[i].time,
        upper: ema[i].value + (multiplier * atrValue.value),
        middle: ema[i].value,
        lower: ema[i].value - (multiplier * atrValue.value)
      })
    }
  }
  
  return result
}

// ===================================
// DONCHIAN CHANNELS
// ===================================

export interface DonchianChannel {
  time: number
  upper: number
  middle: number
  lower: number
}

export function calculateDonchianChannels(data: CandleData[], period: number = 20): DonchianChannel[] {
  const result: DonchianChannel[] = []
  
  for (let i = period - 1; i < data.length; i++) {
    let highestHigh = data[i].high
    let lowestLow = data[i].low
    
    for (let j = 0; j < period; j++) {
      highestHigh = Math.max(highestHigh, data[i - j].high)
      lowestLow = Math.min(lowestLow, data[i - j].low)
    }
    
    result.push({
      time: data[i].time,
      upper: highestHigh,
      middle: (highestHigh + lowestLow) / 2,
      lower: lowestLow
    })
  }
  
  return result
}

// ===================================
// MFI (Money Flow Index)
// ===================================

export function calculateMFI(data: CandleData[], period: number = 14): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  if (data.length < period + 1) return result
  
  const typicalPrices: number[] = []
  const moneyFlows: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3
    typicalPrices.push(tp)
    moneyFlows.push(tp * (data[i].volume || 1))
  }
  
  for (let i = period; i < data.length; i++) {
    let positiveFlow = 0
    let negativeFlow = 0
    
    for (let j = 1; j <= period; j++) {
      if (typicalPrices[i - j + 1] > typicalPrices[i - j]) {
        positiveFlow += moneyFlows[i - j + 1]
      } else {
        negativeFlow += moneyFlows[i - j + 1]
      }
    }
    
    const moneyFlowRatio = positiveFlow / negativeFlow
    const mfi = 100 - (100 / (1 + moneyFlowRatio))
    
    result.push({
      time: data[i].time,
      value: mfi
    })
  }
  
  return result
}

// ===================================
// AROON INDICATOR
// ===================================

export interface AroonData {
  time: number
  aroonUp: number
  aroonDown: number
  oscillator: number
}

export function calculateAroon(data: CandleData[], period: number = 25): AroonData[] {
  const result: AroonData[] = []
  
  for (let i = period; i < data.length; i++) {
    let highestIndex = i
    let lowestIndex = i
    let highestHigh = data[i].high
    let lowestLow = data[i].low
    
    for (let j = 0; j <= period; j++) {
      if (data[i - j].high > highestHigh) {
        highestHigh = data[i - j].high
        highestIndex = i - j
      }
      if (data[i - j].low < lowestLow) {
        lowestLow = data[i - j].low
        lowestIndex = i - j
      }
    }
    
    const periodsSinceHigh = i - highestIndex
    const periodsSinceLow = i - lowestIndex
    
    const aroonUp = ((period - periodsSinceHigh) / period) * 100
    const aroonDown = ((period - periodsSinceLow) / period) * 100
    const oscillator = aroonUp - aroonDown
    
    result.push({
      time: data[i].time,
      aroonUp,
      aroonDown,
      oscillator
    })
  }
  
  return result
}

// ===================================
// SUPERTREND
// ===================================

export interface SupertrendData {
  time: number
  value: number
  direction: 'UP' | 'DOWN'
}

export function calculateSupertrend(
  data: CandleData[],
  period: number = 10,
  multiplier: number = 3
): SupertrendData[] {
  const result: SupertrendData[] = []
  
  const atr = calculateATR(data, period)
  
  let upperBand: number[] = []
  let lowerBand: number[] = []
  let finalUpperBand: number[] = []
  let finalLowerBand: number[] = []
  let supertrend: number[] = []
  let direction: ('UP' | 'DOWN')[] = []
  
  for (let i = 0; i < data.length; i++) {
    const hl2 = (data[i].high + data[i].low) / 2
    const atrValue = atr.find(a => a.time === data[i].time)?.value || 0
    
    upperBand[i] = hl2 + (multiplier * atrValue)
    lowerBand[i] = hl2 - (multiplier * atrValue)
    
    // Calculate final bands
    if (i === 0) {
      finalUpperBand[i] = upperBand[i]
      finalLowerBand[i] = lowerBand[i]
    } else {
      finalUpperBand[i] = upperBand[i] < finalUpperBand[i - 1] || data[i - 1].close > finalUpperBand[i - 1]
        ? upperBand[i]
        : finalUpperBand[i - 1]
      
      finalLowerBand[i] = lowerBand[i] > finalLowerBand[i - 1] || data[i - 1].close < finalLowerBand[i - 1]
        ? lowerBand[i]
        : finalLowerBand[i - 1]
    }
    
    // Calculate Supertrend
    if (i === 0) {
      supertrend[i] = finalUpperBand[i]
      direction[i] = 'DOWN'
    } else {
      if (supertrend[i - 1] === finalUpperBand[i - 1] && data[i].close <= finalUpperBand[i]) {
        supertrend[i] = finalUpperBand[i]
        direction[i] = 'DOWN'
      } else if (supertrend[i - 1] === finalUpperBand[i - 1] && data[i].close > finalUpperBand[i]) {
        supertrend[i] = finalLowerBand[i]
        direction[i] = 'UP'
      } else if (supertrend[i - 1] === finalLowerBand[i - 1] && data[i].close >= finalLowerBand[i]) {
        supertrend[i] = finalLowerBand[i]
        direction[i] = 'UP'
      } else if (supertrend[i - 1] === finalLowerBand[i - 1] && data[i].close < finalLowerBand[i]) {
        supertrend[i] = finalUpperBand[i]
        direction[i] = 'DOWN'
      } else {
        supertrend[i] = finalLowerBand[i]
        direction[i] = 'UP'
      }
    }
    
    result.push({
      time: data[i].time,
      value: supertrend[i],
      direction: direction[i]
    })
  }
  
  return result
}

// ===================================
// TRIX (Triple Exponential Average)
// ===================================

export function calculateTRIX(data: CandleData[], period: number = 14): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  
  // First EMA
  const ema1 = calculateEMA(data, period)
  
  // Convert first EMA to CandleData format
  const ema1Data: CandleData[] = ema1.map(e => ({
    time: e.time,
    open: e.value,
    high: e.value,
    low: e.value,
    close: e.value
  }))
  
  // Second EMA
  const ema2 = calculateEMA(ema1Data, period)
  
  // Convert second EMA to CandleData format
  const ema2Data: CandleData[] = ema2.map(e => ({
    time: e.time,
    open: e.value,
    high: e.value,
    low: e.value,
    close: e.value
  }))
  
  // Third EMA
  const ema3 = calculateEMA(ema2Data, period)
  
  // Calculate TRIX (percentage change)
  for (let i = 1; i < ema3.length; i++) {
    const trix = ((ema3[i].value - ema3[i - 1].value) / ema3[i - 1].value) * 100
    result.push({
      time: ema3[i].time,
      value: trix
    })
  }
  
  return result
}

// ===================================
// FIBONACCI RETRACEMENT
// ===================================

export interface FibonacciLevels {
  high: number
  low: number
  levels: {
    level: number
    value: number
    label: string
  }[]
}

export function calculateFibonacciRetracement(
  data: CandleData[],
  startIndex: number,
  endIndex: number
): FibonacciLevels {
  const high = Math.max(...data.slice(startIndex, endIndex + 1).map(d => d.high))
  const low = Math.min(...data.slice(startIndex, endIndex + 1).map(d => d.low))
  const diff = high - low
  
  const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
  
  return {
    high,
    low,
    levels: fibLevels.map(level => ({
      level,
      value: high - (diff * level),
      label: `${(level * 100).toFixed(1)}%`
    }))
  }
}

// ===================================
// PIVOT POINTS
// ===================================

export interface PivotPoints {
  time: number
  pivot: number
  r1: number
  r2: number
  r3: number
  s1: number
  s2: number
  s3: number
}

export function calculatePivotPoints(data: CandleData[]): PivotPoints[] {
  const result: PivotPoints[] = []
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1]
    const pivot = (prev.high + prev.low + prev.close) / 3
    
    result.push({
      time: data[i].time,
      pivot,
      r1: 2 * pivot - prev.low,
      r2: pivot + (prev.high - prev.low),
      r3: prev.high + 2 * (pivot - prev.low),
      s1: 2 * pivot - prev.high,
      s2: pivot - (prev.high - prev.low),
      s3: prev.low - 2 * (prev.high - pivot)
    })
  }
  
  return result
}

// ===================================
// ELDER RAY INDEX
// ===================================

export interface ElderRayData {
  time: number
  bullPower: number
  bearPower: number
}

export function calculateElderRay(data: CandleData[], period: number = 13): ElderRayData[] {
  const result: ElderRayData[] = []
  const ema = calculateEMA(data, period)
  
  for (let i = 0; i < ema.length; i++) {
    const candle = data.find(d => d.time === ema[i].time)
    if (candle) {
      result.push({
        time: ema[i].time,
        bullPower: candle.high - ema[i].value,
        bearPower: candle.low - ema[i].value
      })
    }
  }
  
  return result
}

// ===================================
// VOLUME PROFILE (Simplified)
// ===================================

export interface VolumeProfileData {
  priceLevel: number
  volume: number
  percentage: number
}

export function calculateVolumeProfile(
  data: CandleData[],
  numLevels: number = 24
): VolumeProfileData[] {
  const high = Math.max(...data.map(d => d.high))
  const low = Math.min(...data.map(d => d.low))
  const priceRange = high - low
  const levelSize = priceRange / numLevels
  
  const volumeByLevel = new Array(numLevels).fill(0)
  
  // Distribute volume to price levels
  data.forEach(candle => {
    const avgPrice = (candle.high + candle.low + candle.close) / 3
    const levelIndex = Math.min(
      Math.floor((avgPrice - low) / levelSize),
      numLevels - 1
    )
    volumeByLevel[levelIndex] += candle.volume || 0
  })
  
  const totalVolume = volumeByLevel.reduce((sum, vol) => sum + vol, 0)
  
  return volumeByLevel.map((volume, index) => ({
    priceLevel: low + (levelSize * index) + (levelSize / 2),
    volume,
    percentage: (volume / totalVolume) * 100
  }))
}

// ===================================
// EXPORT ALL INDICATOR FUNCTIONS
// ===================================

export const indicators = {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateATR,
  calculateADX,
  calculateCCI,
  calculateParabolicSAR,
  calculateWilliamsR,
  calculateOBV,
  calculateIchimoku,
  calculateVWAP,
  calculateKeltnerChannels,
  calculateDonchianChannels,
  calculateMFI,
  calculateAroon,
  calculateSupertrend,
  calculateTRIX,
  calculateFibonacciRetracement,
  calculatePivotPoints,
  calculateElderRay,
  calculateVolumeProfile
}