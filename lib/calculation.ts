// lib/calculation.ts 
import { TimezoneUtil } from './timezone';
import type { BinaryOrder, Asset } from '@/types';

export class CalculationUtil {
  static calculateBinaryProfit(amount: number, profitRate: number): number {
    return (amount * profitRate) / 100;
  }

  static determineBinaryResult(
    direction: 'CALL' | 'PUT',
    entryPrice: number,
    exitPrice: number,
  ): 'WON' | 'LOST' {
    if (direction === 'CALL') {
      return exitPrice > entryPrice ? 'WON' : 'LOST';
    } else {
      return exitPrice < entryPrice ? 'WON' : 'LOST';
    }
  }

  static calculateExpiryTimestamp(
    entryTimestamp: number,
    durationMinutes: number,
    thresholdSeconds: number = 20
  ): number {
    const date = TimezoneUtil.fromTimestamp(entryTimestamp);
    const secondsFromStart = date.getSeconds();
    
    // Backend logic: if seconds > threshold, add extra minute
    const needsExtraMinute = secondsFromStart > thresholdSeconds;
    const totalMinutesToAdd = durationMinutes + (needsExtraMinute ? 1 : 0);
    
    // Set to exact minute:00
    date.setMinutes(date.getMinutes() + totalMinutesToAdd, 0, 0);
    
    return TimezoneUtil.toTimestamp(date);
  }

  static formatDurationDisplay(durationMinutes: number): string {
    if (durationMinutes < 1) {
      const seconds = Math.round(durationMinutes * 60);
      return `${seconds}s`;
    } else if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  }

  static isValidDuration(durationMinutes: number, allowedDurations: number[]): boolean {
    const tolerance = 0.0001;
    return allowedDurations.some(allowed => 
      Math.abs(allowed - durationMinutes) < tolerance
    );
  }

  static formatExpiryInfo(exitTimestamp: number): {
    isExpired: boolean;
    timeRemaining: number;
    formattedRemaining: string;
  } {
    const now = TimezoneUtil.getCurrentTimestamp();
    const timeRemaining = Math.max(0, exitTimestamp - now);
    const isExpired = timeRemaining === 0;

    return {
      isExpired,
      timeRemaining,
      formattedRemaining: this.formatDuration(timeRemaining),
    };
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  static calculatePayout(amount: number, profitRate: number): number {
    return amount + this.calculateBinaryProfit(amount, profitRate);
  }

  /**
   * ✅ FIXED: Format order timing with correct expiry calculation
   */
  static formatOrderTiming(
    asset: Asset,
    duration: number,
    entryTime?: number
  ): {
    entryTimestamp: number;
    expiryTimestamp: number;
    entryDateTime: string;
    expiryDateTime: string;
    durationDisplay: string;
    isEndOfCandle: boolean;
  } {
    const entryTimestamp = entryTime || TimezoneUtil.getCurrentTimestamp();
    const expiryTimestamp = this.calculateExpiryTimestamp(entryTimestamp, duration);
    
    const entryDate = TimezoneUtil.fromTimestamp(entryTimestamp);
    const expiryDate = TimezoneUtil.fromTimestamp(expiryTimestamp);

    // For display: check if entry is near end of candle
    const secondsFromStart = entryDate.getSeconds();
    const isEndOfCandle = secondsFromStart > 20;

    return {
      entryTimestamp,
      expiryTimestamp,
      entryDateTime: TimezoneUtil.formatDateTime(entryDate),
      expiryDateTime: TimezoneUtil.formatDateTime(expiryDate),
      durationDisplay: this.formatDurationDisplay(duration),
      isEndOfCandle,
    };
  }

  /**
   * ✅ NEW: Parse duration from display string to minutes
   */
  static parseDurationToMinutes(display: string): number {
    const match = display.match(/^(\d+)(s|m|h)$/);
    if (!match) {
      throw new Error('Invalid duration format. Use format like: 1s, 1m, 15m, 1h');
    }

    const [, value, unit] = match;
    const numValue = parseInt(value);

    switch (unit) {
      case 's': return numValue / 60;
      case 'm': return numValue;
      case 'h': return numValue * 60;
      default: throw new Error('Invalid duration unit');
    }
  }

  /**
   * ✅ NEW: Get current timestamp
   */
  static getCurrentTimestamp(): number {
    return TimezoneUtil.getCurrentTimestamp();
  }

  /**
   * ✅ NEW: Get current ISO string
   */
  static getCurrentISOString(): string {
    return TimezoneUtil.toISOString();
  }

  /**
   * ✅ NEW: Format date time
   */
  static formatDateTime(date: Date = new Date()): string {
    return TimezoneUtil.formatDateTime(date);
  }

  /**
   * ✅ NEW: Check if order is expired
   */
  static isOrderExpired(exitTimestamp: number): boolean {
    return TimezoneUtil.isExpired(exitTimestamp);
  }

  /**
   * ✅ NEW: Get time until expiry in seconds
   */
  static getTimeUntilExpiry(exitTimestamp: number): number {
    const now = TimezoneUtil.getCurrentTimestamp();
    return Math.max(0, exitTimestamp - now);
  }

  /**
   * ✅ NEW: Calculate bar period timestamp - CRITICAL for candle alignment
   * MUST match backend simulator exactly (Math.floor)
   */
  static getBarPeriodTimestamp(timestamp: number, timeframe: string): number {
    const seconds = this.getTimeframeSeconds(timeframe);
    // CRITICAL: Use Math.floor to match backend (simulator uses Math.floor)
    return Math.floor(timestamp / seconds) * seconds;
  }

  /**
   * ✅ NEW: Get timeframe in seconds
   */
  static getTimeframeSeconds(timeframe: string): number {
    const map: Record<string, number> = {
      '1s': 1,
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400
    };
    return map[timeframe] || 60;
  }
}

// ✅ Export instance untuk backward compatibility
export const calculationUtil = CalculationUtil;

// ✅ NEW: Standalone exports untuk convenience (bisa dipakai langsung di TradingChart)
export const getBarPeriodTimestamp = CalculationUtil.getBarPeriodTimestamp;
export const getTimeframeSeconds = CalculationUtil.getTimeframeSeconds;