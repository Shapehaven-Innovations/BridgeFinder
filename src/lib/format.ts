/**
 * Format a number with thousand separators and decimal places
 */
export function formatNumber(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return String(value)
  }

  // Format with specified decimals
  const formatted = num.toFixed(decimals)

  // Split into integer and decimal parts
  const parts = formatted.split('.')

  // Add thousand separators to integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return parts.join('.')
}

/**
 * Format a number as currency with symbol
 */
export function formatCurrency(
  value: number | string,
  options: {
    decimals?: number
    symbol?: string
    symbolPosition?: 'before' | 'after'
  } = {}
): string {
  const { decimals = 2, symbol = '$', symbolPosition = 'before' } = options

  const formatted = formatNumber(value, decimals)

  return symbolPosition === 'before'
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`
}

/**
 * Format a number as percentage
 */
export function formatPercentage(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) {
    return String(value)
  }

  return `${formatNumber(num * 100, decimals)}%`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompact(value: number, decimals: number = 1): string {
  if (value < 1000) {
    return formatNumber(value, decimals)
  }

  const units = ['K', 'M', 'B', 'T']
  const magnitude = Math.floor(Math.log10(value) / 3)
  const suffix = units[magnitude - 1]

  if (!suffix) {
    return formatNumber(value, decimals)
  }

  const scaled = value / Math.pow(1000, magnitude)
  return `${formatNumber(scaled, decimals)}${suffix}`
}

/**
 * Truncate a string to a maximum length with ellipsis
 */
export function truncate(
  str: string,
  maxLength: number,
  ellipsis: string = '...'
): string {
  if (str.length <= maxLength) {
    return str
  }

  return str.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Truncate an Ethereum address for display
 */
export function truncateAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address || address.length <= startLength + endLength) {
    return address
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * Format a decimal slippage value to percentage string
 */
export function formatSlippage(decimal: string | number): string {
  const num = typeof decimal === 'string' ? parseFloat(decimal) : decimal
  return `${(num * 100).toFixed(2)}%`
}

/**
 * Parse a percentage string to decimal number
 */
export function parseSlippage(percentage: string): number {
  const cleaned = percentage.replace('%', '').trim()
  const num = parseFloat(cleaned)

  if (isNaN(num)) {
    return 0.01 // Default 1%
  }

  return num / 100
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert a string to title case
 */
export function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ')
}
