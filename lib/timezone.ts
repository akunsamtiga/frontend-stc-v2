// lib/timezone.ts
export class TimezoneUtil {
  static readonly TIMEZONE = 'Asia/Jakarta';
  static readonly OFFSET_HOURS = 7;

  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static formatDateTime(date: Date = new Date()): string {
    const jakartaDate = new Date(date.toLocaleString('en-US', { timeZone: this.TIMEZONE }));
    
    const year = jakartaDate.getFullYear();
    const month = String(jakartaDate.getMonth() + 1).padStart(2, '0');
    const day = String(jakartaDate.getDate()).padStart(2, '0');
    const hours = String(jakartaDate.getHours()).padStart(2, '0');
    const minutes = String(jakartaDate.getMinutes()).padStart(2, '0');
    const seconds = String(jakartaDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  static toISOString(date: Date = new Date()): string {
    return new Date(date.toLocaleString('en-US', { timeZone: this.TIMEZONE })).toISOString();
  }

  static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  static toTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  static formatTimestamp(timestamp: number): string {
    return this.formatDateTime(this.fromTimestamp(timestamp));
  }

  static isExpired(expiryTimestamp: number): boolean {
    return this.getCurrentTimestamp() >= expiryTimestamp;
  }

  static getRemainingSecondsInMinute(timestamp: number): number {
    const date = this.fromTimestamp(timestamp);
    const seconds = date.getSeconds();
    return 60 - seconds;
  }

  static getEndOfCurrentMinute(timestamp: number): number {
    const date = this.fromTimestamp(timestamp);
    date.setMinutes(date.getMinutes() + 1, 0, 0);
    return this.toTimestamp(date);
  }

  static getDateTimeInfo(date: Date = new Date()) {
    return {
      datetime: this.formatDateTime(date),
      datetime_iso: this.toISOString(date),
      timestamp: this.toTimestamp(date),
      timezone: this.TIMEZONE,
    };
  }

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