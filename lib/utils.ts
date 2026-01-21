import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount as Nigerian Naira
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

/**
 * Get initials from full name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Generate month-year date string for database (first day of month)
 */
export function getMonthYearDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/**
 * Parse month-year date string back to Date
 */
export function parseMonthYearDate(dateStr: string): Date {
  return new Date(dateStr)
}
