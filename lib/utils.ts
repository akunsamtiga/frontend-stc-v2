import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // Rupiah tanpa desimal
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(value: number, decimals = 3): string {
  return value.toFixed(decimals)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm:ss')
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm:ss')
}

export function calculateTimeLeft(exitTime: string): string {
  const now = new Date()
  const exit = new Date(exitTime)
  const diff = exit.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  return `${minutes}m ${seconds}s`
}

export function getPriceChangeClass(change: number): string {
  if (change > 0) return 'text-success'
  if (change < 0) return 'text-danger'
  return 'text-gray-400'
}

export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-blue-400'
    case 'WON':
      return 'text-success'
    case 'LOST':
      return 'text-danger'
    default:
      return 'text-gray-400'
  }
}

export const DURATIONS = [1, 2, 3, 4, 5, 15, 30, 45, 60] as const