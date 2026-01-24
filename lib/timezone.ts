// lib/timezone.ts - FIXED: Match backend timezone utils exactly
export class TimezoneUtil {
  static readonly TIMEZONE = 'Asia/Jakarta';
  static readonly OFFSET_HOURS = 7;

  /**
   * ✅ Get current timestamp in seconds
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * ✅ Get current date
   */
  static getCurrentDate(): Date {
    return new Date();
  }

  /**
   * ✅ Convert date to ISO string
   */
  static toISOString(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * ✅ Format date to Jakarta timezone string (YYYY-MM-DD HH:mm:ss)
   */
  static formatDateTime(date: Date = new Date()): string {
    const jakartaDate = new Date(date.toLocaleString('en-US', { 
      timeZone: this.TIMEZONE 
    }));
    
    const year = jakartaDate.getFullYear();
    const month = String(jakartaDate.getMonth() + 1).padStart(2, '0');
    const day = String(jakartaDate.getDate()).padStart(2, '0');
    const hours = String(jakartaDate.getHours()).padStart(2, '0');
    const minutes = String(jakartaDate.getMinutes()).padStart(2, '0');
    const seconds = String(jakartaDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * ✅ Convert timestamp to Date
   */
  static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * ✅ Convert Date to timestamp
   */
  static toTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * ✅ Format timestamp to string
   */
  static formatTimestamp(timestamp: number): string {
    const date = this.fromTimestamp(timestamp);
    return this.formatDateTime(date);
  }

  /**
   * ✅ Check if timestamp is expired
   */
  static isExpired(expiryTimestamp: number): boolean {
    return this.getCurrentTimestamp() >= expiryTimestamp;
  }

  /**
   * ✅ FIXED: Get remaining seconds in current minute
   * Returns: 60 - current_seconds
   */
  static getRemainingSecondsInMinute(timestamp: number): number {
    const date = this.fromTimestamp(timestamp);
    const seconds = date.getSeconds();
    return 60 - seconds;
  }

  /**
   * ✅ Get end of current minute (next :00)
   */
  static getEndOfCurrentMinute(timestamp: number): number {
    const date = this.fromTimestamp(timestamp);
    date.setMinutes(date.getMinutes() + 1, 0, 0);
    return this.toTimestamp(date);
  }

  /**
   * ✅ Get end of next minute
   */
  static getEndOfNextMinute(timestamp: number): number {
    const date = this.fromTimestamp(timestamp);
    date.setMinutes(date.getMinutes() + 2, 0, 0);
    return this.toTimestamp(date);
  }

  /**
   * ✅ REMOVED: isEntryAtEndOfCandle - use backend logic instead
   * Backend uses: secondsFromStart > thresholdSeconds
   */

  /**
   * ✅ Get datetime info object
   */
  static getDateTimeInfo(date: Date = new Date()): {
    datetime: string;
    datetime_iso: string;
    timestamp: number;
    timezone: string;
  } {
    return {
      datetime: this.formatDateTime(date),
      datetime_iso: this.toISOString(date),
      timestamp: this.toTimestamp(date),
      timezone: this.TIMEZONE,
    };
  }

  /**
   * ✅ Format duration in seconds to readable string
   */
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

  /**
   * ✅ Add minutes to date
   */
  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  /**
   * ✅ Check if two timestamps are the same second
   */
  static isSameSecond(timestamp1: number, timestamp2: number): boolean {
    return timestamp1 === timestamp2;
  }

  /**
   * ✅ Get difference in seconds between two timestamps
   */
  static getDifferenceInSeconds(timestamp1: number, timestamp2: number): number {
    return Math.abs(timestamp1 - timestamp2);
  }

  /**
   * ✅ Validate timestamp is within reasonable range (± 1 hour from now)
   */
  static isValidTimestamp(timestamp: number): boolean {
    const now = this.getCurrentTimestamp();
    const diff = Math.abs(now - timestamp);
    return diff <= 3600;
  }

  /**
   * ✅ Get start of day (00:00:00) in Jakarta timezone
   */
  static getStartOfDay(date: Date = new Date()): number {
    const jakartaDate = new Date(date.toLocaleString('en-US', { 
      timeZone: this.TIMEZONE 
    }));
    jakartaDate.setHours(0, 0, 0, 0);
    return this.toTimestamp(jakartaDate);
  }

  /**
   * ✅ Get end of day (23:59:59) in Jakarta timezone
   */
  static getEndOfDay(date: Date = new Date()): number {
    const jakartaDate = new Date(date.toLocaleString('en-US', { 
      timeZone: this.TIMEZONE 
    }));
    jakartaDate.setHours(23, 59, 59, 999);
    return this.toTimestamp(jakartaDate);
  }

  /**
   * ✅ Check if current time is within trading hours
   * Trading hours: Mon-Fri, 09:00-16:00 Jakarta time
   */
  static isWithinTradingHours(date: Date = new Date()): boolean {
    const jakartaDate = new Date(date.toLocaleString('en-US', { 
      timeZone: this.TIMEZONE 
    }));
    const hour = jakartaDate.getHours();
    const day = jakartaDate.getDay();
    
    // Weekend check
    if (day === 0 || day === 6) return false;
    
    // Trading hours: 9 AM - 4 PM
    return hour >= 9 && hour < 16;
  }

  /**
   * ✅ Format WIB time (HH:mm:ss)
   */
  static formatWIBTime(timestamp: number): string {
    const date = this.fromTimestamp(timestamp);
    const jakartaDate = new Date(date.toLocaleString('en-US', { timeZone: this.TIMEZONE }));
    return jakartaDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: this.TIMEZONE
    });
  }

  /**
   * ✅ Format WIB date (DD/MM/YYYY)
   */
  static formatWIBDate(timestamp: number): string {
    const date = this.fromTimestamp(timestamp);
    const jakartaDate = new Date(date.toLocaleString('en-US', { timeZone: this.TIMEZONE }));
    return jakartaDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: this.TIMEZONE
    });
  }
}

export const timezoneUtil = TimezoneUtil;