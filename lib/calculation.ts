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
    endOfCandleThreshold: number = 20
  ): number {
    const remainingSeconds = TimezoneUtil.getRemainingSecondsInMinute(entryTimestamp);
    const isEndOfCandle = remainingSeconds <= endOfCandleThreshold;

    if (isEndOfCandle) {
      const nextCandleEnd = TimezoneUtil.getEndOfCurrentMinute(entryTimestamp);
      const entryDate = TimezoneUtil.fromTimestamp(nextCandleEnd);
      entryDate.setMinutes(entryDate.getMinutes() + durationMinutes, 0, 0);
      return TimezoneUtil.toTimestamp(entryDate);
    } else {
      const currentCandleEnd = TimezoneUtil.getEndOfCurrentMinute(entryTimestamp);
      const entryDate = TimezoneUtil.fromTimestamp(currentCandleEnd);
      entryDate.setMinutes(entryDate.getMinutes() + durationMinutes, 0, 0);
      return TimezoneUtil.toTimestamp(entryDate);
    }
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

    const remainingSeconds = TimezoneUtil.getRemainingSecondsInMinute(entryTimestamp);
    const isEndOfCandle = remainingSeconds <= 20;

    return {
      entryTimestamp,
      expiryTimestamp,
      entryDateTime: TimezoneUtil.formatDateTime(entryDate),
      expiryDateTime: TimezoneUtil.formatDateTime(expiryDate),
      durationDisplay: this.formatDurationDisplay(duration),
      isEndOfCandle,
    };
  }
}

export const calculationUtil = CalculationUtil;