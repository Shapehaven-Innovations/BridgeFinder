// src/utils/formatters.ts
export const formatCurrency = (
  amount: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
    ...options,
  }).format(amount)
}

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

export const formatTime = (minutes: number): string => {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} mins`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}`
}

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`
}
