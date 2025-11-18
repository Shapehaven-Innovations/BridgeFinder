// lib/format.ts - Formatting utility functions

/**
 * Format a number as currency (USD by default)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0.00'
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 0.01 ? 6 : 2,
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    return `$${amount.toFixed(2)}`
  }
}

/**
 * Format time from seconds to human-readable string
 */
export function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0 sec'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} min`)
  }
  if (secs > 0 && hours === 0) {
    parts.push(`${secs} sec`)
  }

  return parts.length > 0 ? parts.join(' ') : '< 1 sec'
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0'

  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(2)}B`
  }
  if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(2)}M`
  }
  if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(2)}K`
  }

  return `${sign}${absNum.toFixed(2)}`
}

/**
 * Format percentage
 */
export function formatPercentage(decimal: number): string {
  if (!decimal && decimal !== 0) return '0%'

  const num = typeof decimal === 'string' ? parseFloat(decimal) : decimal
  return `${(num * 100).toFixed(2)}%`
}

/**
 * Format address with ellipsis
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 3) return address

  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Format date to locale string
 */
export function formatDate(
  date: string | Date | number,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj =
      typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
  } catch (error) {
    return 'Invalid date'
  }
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(
  amount: number | string,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  if (!amount || amount === '0') return '0'

  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const value = num / Math.pow(10, decimals)

  if (value < 0.0001) {
    return '< 0.0001'
  }

  return value.toFixed(displayDecimals).replace(/\.?0+$/, '')
}

/**
 * Parse token amount to wei/smallest unit
 */
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): string {
  try {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0'

    const value = num * Math.pow(10, decimals)
    return Math.floor(value).toString()
  } catch (error) {
    return '0'
  }
}
