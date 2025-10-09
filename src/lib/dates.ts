/**
 * Convert relative time to human-readable format
 * @param timestamp ISO 8601 timestamp string
 * @returns Human-readable relative time (e.g., "2 minutes ago")
 */
export function getRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 10) {
      return 'just now'
    } else if (diffSecs < 60) {
      return `${diffSecs} seconds ago`
    } else if (diffMins < 60) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffDays < 30) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  } catch (error) {
    console.error('Error parsing timestamp:', error)
    return 'recently'
  }
}

/**
 * Parse estimated time string to minutes
 * @param timeStr Time string like "5 min", "2 hours", "30 sec"
 * @returns Time in minutes
 */
export function parseEstimatedTime(timeStr: string): number {
  try {
    const str = timeStr.toLowerCase().trim()

    // Extract number
    const numMatch = str.match(/(\d+(\.\d+)?)/)
    if (!numMatch) return 0

    const num = parseFloat(numMatch[0])

    // Determine unit
    if (str.includes('sec')) {
      return num / 60
    } else if (str.includes('min')) {
      return num
    } else if (str.includes('hour') || str.includes('hr')) {
      return num * 60
    } else if (str.includes('day')) {
      return num * 60 * 24
    }

    // Default to minutes if no unit specified
    return num
  } catch (error) {
    console.error('Error parsing estimated time:', error)
    return 0
  }
}

/**
 * Format time in minutes to human-readable string
 * @param minutes Time in minutes
 * @returns Formatted string (e.g., "5 min", "2 hours")
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} sec`
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min`
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  } else {
    const days = Math.round(minutes / 1440)
    return `${days} ${days === 1 ? 'day' : 'days'}`
  }
}
