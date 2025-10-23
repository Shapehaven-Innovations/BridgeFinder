import { apiClient } from '@/api/client'
import type { ComparisonParams, ComparisonResponse } from '@/api/types'
import type { BridgeWithPosition, ComparisonResult } from '../types'
import { parseEstimatedTime } from '@/lib/dates'

/**
 * Enrich bridge data with position, best flag, and savings
 */
function enrichBridges(
  bridges: ComparisonResponse['bridges']
): BridgeWithPosition[] {
  if (bridges.length === 0) return []

  // Separate available and unavailable bridges
  const available = bridges.filter((b) => !b.unavailable)
  const unavailable = bridges.filter((b) => b.unavailable)

  // Sort available by total cost (ascending)
  const sorted = [...available].sort((a, b) => a.totalCost - b.totalCost)

  // Find best price
  const bestPrice = sorted.length > 0 ? sorted[0].totalCost : 0

  // Add positions and calculate savings
  const enriched: BridgeWithPosition[] = sorted.map((bridge, index) => ({
    ...bridge,
    position: index + 1,
    isBest: index === 0,
    savings: index > 0 ? bridge.totalCost - bestPrice : undefined,
  }))

  // Add unavailable bridges at the end
  const unavailableEnriched: BridgeWithPosition[] = unavailable.map(
    (bridge, index) => ({
      ...bridge,
      position: sorted.length + index + 1,
      isBest: false,
      savings: undefined,
    })
  )

  return [...enriched, ...unavailableEnriched]
}

/**
 * Compare bridge routes
 */
export async function compareRoutes(
  params: ComparisonParams
): Promise<ComparisonResult> {
  console.log('🔵 compareRoutes called with params:', params)

  try {
    const response = await apiClient.post<ComparisonResponse>(
      '/api/compare',
      params
    )

    console.log('🟢 API Response received:', response)
    console.log('🟢 Response type:', typeof response)
    console.log('🟢 Response.success:', response?.success)
    console.log('🟢 Response.bridges:', response?.bridges)
    console.log('🟢 Response keys:', Object.keys(response || {}))

    // Validate we have bridges array (API client already handles HTTP errors)
    if (!response.bridges || !Array.isArray(response.bridges)) {
      console.error('🔴 Invalid response - missing bridges:', response)
      throw new Error(`Invalid API response: ${JSON.stringify(response)}`)
    }

    console.log('🟢 Bridges array length:', response.bridges.length)

    const enrichedBridges = enrichBridges(response.bridges)
    console.log('🟢 Enriched bridges:', enrichedBridges)

    return {
      bridges: enrichedBridges,
      summary: response.summary || {
        totalRoutes: 0,
        avgCost: 0,
        avgTime: '0 min',
        availableRoutes: 0,
      },
      timestamp: response.timestamp || new Date().toISOString(),
      params: {
        fromChainId: params.fromChainId,
        toChainId: params.toChainId,
        token: params.token,
        amount: Number(params.amount),
      },
    }
  } catch (error) {
    console.error('🔴 compareRoutes error:', error)
    console.error('🔴 Error type:', error?.constructor?.name)
    console.error('🔴 Error message:', (error as Error)?.message)

    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error during bridge comparison')
  }
}

/**
 * Get unique protocols from bridge list
 */
export function extractProtocols(bridges: BridgeWithPosition[]): string[] {
  const protocols = new Set(
    bridges.filter((b) => !b.unavailable).map((b) => b.protocol)
  )
  return Array.from(protocols).sort()
}

/**
 * Sort bridges by field
 */
export function sortBridges(
  bridges: BridgeWithPosition[],
  field: 'cost' | 'time' | 'security',
  order: 'asc' | 'desc'
): BridgeWithPosition[] {
  const sorted = [...bridges].sort((a, b) => {
    // Unavailable bridges always go to end
    if (a.unavailable && !b.unavailable) return 1
    if (!a.unavailable && b.unavailable) return -1
    if (a.unavailable && b.unavailable) return 0

    let comparison = 0

    switch (field) {
      case 'cost':
        comparison = a.totalCost - b.totalCost
        break
      case 'time':
        comparison =
          parseEstimatedTime(a.estimatedTime) -
          parseEstimatedTime(b.estimatedTime)
        break
      case 'security': {
        const securityOrder = ['High', 'Medium', 'Low']
        comparison =
          securityOrder.indexOf(a.security) - securityOrder.indexOf(b.security)
        break
      }
    }

    return order === 'asc' ? comparison : -comparison
  })

  // Reassign positions
  return sorted.map((bridge, index) => ({
    ...bridge,
    position: index + 1,
  }))
}

/**
 * Filter bridges by selected protocols
 */
export function filterByProtocols(
  bridges: BridgeWithPosition[],
  selectedProtocols: string[],
  showUnavailable: boolean
): BridgeWithPosition[] {
  return bridges.filter((bridge) => {
    // Filter unavailable if needed
    if (!showUnavailable && bridge.unavailable) {
      return false
    }

    // If no protocols selected, show all
    if (selectedProtocols.length === 0) {
      return true
    }

    // Filter by protocol
    return selectedProtocols.includes(bridge.protocol)
  })
}
