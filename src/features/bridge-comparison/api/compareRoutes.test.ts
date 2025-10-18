import { describe, it, expect } from 'vitest'
import {
  extractProtocols,
  sortBridges,
  filterByProtocols,
} from './compareRoutes'
import type { BridgeWithPosition } from '../types'

const mockBridges: BridgeWithPosition[] = [
  {
    name: 'Bridge A',
    provider: 'Provider A',
    protocol: 'Across',
    route: 'Route A',
    estimatedTime: '5 min',
    totalCost: 10,
    bridgeFee: 8,
    gasFee: 2,
    outputAmount: 990,
    security: 'High',
    liquidity: 'High',
    position: 1,
    isBest: true,
    unavailable: false,
  } as BridgeWithPosition,
  {
    name: 'Bridge B',
    provider: 'Provider B',
    protocol: 'Stargate',
    route: 'Route B',
    estimatedTime: '10 min',
    totalCost: 15,
    bridgeFee: 12,
    gasFee: 3,
    outputAmount: 985,
    security: 'Medium',
    liquidity: 'Medium',
    position: 2,
    isBest: false,
    unavailable: false,
  } as BridgeWithPosition,
  {
    name: 'Bridge C',
    provider: 'Provider C',
    protocol: 'Across',
    route: 'Route C',
    estimatedTime: '2 min',
    totalCost: 20,
    bridgeFee: 18,
    gasFee: 2,
    outputAmount: 980,
    security: 'High',
    liquidity: 'Low',
    position: 3,
    isBest: false,
    unavailable: false,
  } as BridgeWithPosition,
]

describe('compareRoutes utilities', () => {
  describe('extractProtocols', () => {
    it('extracts unique protocols from bridge list', () => {
      const protocols = extractProtocols(mockBridges)
      expect(protocols).toEqual(['Across', 'Stargate'])
      expect(protocols).toHaveLength(2)
    })

    it('filters out unavailable bridges', () => {
      const bridgesWithUnavailable = [
        ...mockBridges,
        {
          name: 'Bridge D',
          provider: 'Provider D',
          protocol: 'Hop',
          unavailable: true,
        } as BridgeWithPosition,
      ]
      const protocols = extractProtocols(bridgesWithUnavailable)
      expect(protocols).not.toContain('Hop')
      expect(protocols).toHaveLength(2)
    })

    it('returns empty array when no bridges provided', () => {
      const protocols = extractProtocols([])
      expect(protocols).toEqual([])
    })

    it('handles all unavailable bridges', () => {
      const unavailableBridges = mockBridges.map((b) => ({
        ...b,
        unavailable: true,
      }))
      const protocols = extractProtocols(unavailableBridges)
      expect(protocols).toEqual([])
    })

    it('sorts protocols alphabetically', () => {
      const unsortedBridges = [
        { ...mockBridges[1], protocol: 'Zebra' },
        { ...mockBridges[0], protocol: 'Alpha' },
        { ...mockBridges[2], protocol: 'Beta' },
      ] as BridgeWithPosition[]
      const protocols = extractProtocols(unsortedBridges)
      expect(protocols).toEqual(['Alpha', 'Beta', 'Zebra'])
    })
  })

  describe('sortBridges', () => {
    describe('cost sorting', () => {
      it('sorts by cost ascending', () => {
        const sorted = sortBridges(mockBridges, 'cost', 'asc')
        expect(sorted[0].totalCost).toBe(10)
        expect(sorted[1].totalCost).toBe(15)
        expect(sorted[2].totalCost).toBe(20)
      })

      it('sorts by cost descending', () => {
        const sorted = sortBridges(mockBridges, 'cost', 'desc')
        expect(sorted[0].totalCost).toBe(20)
        expect(sorted[1].totalCost).toBe(15)
        expect(sorted[2].totalCost).toBe(10)
      })
    })

    describe('time sorting', () => {
      it('sorts by time ascending', () => {
        const sorted = sortBridges(mockBridges, 'time', 'asc')
        expect(sorted[0].estimatedTime).toBe('2 min')
        expect(sorted[1].estimatedTime).toBe('5 min')
        expect(sorted[2].estimatedTime).toBe('10 min')
      })

      it('sorts by time descending', () => {
        const sorted = sortBridges(mockBridges, 'time', 'desc')
        expect(sorted[0].estimatedTime).toBe('10 min')
        expect(sorted[1].estimatedTime).toBe('5 min')
        expect(sorted[2].estimatedTime).toBe('2 min')
      })

      it('handles different time formats', () => {
        const bridgesWithVariedTimes = [
          { ...mockBridges[0], estimatedTime: '1 hour' },
          { ...mockBridges[1], estimatedTime: '30 min' },
          { ...mockBridges[2], estimatedTime: '45 sec' },
        ] as BridgeWithPosition[]

        const sorted = sortBridges(bridgesWithVariedTimes, 'time', 'asc')
        expect(sorted[0].estimatedTime).toBe('45 sec')
        expect(sorted[1].estimatedTime).toBe('30 min')
        expect(sorted[2].estimatedTime).toBe('1 hour')
      })
    })

    describe('security sorting', () => {
      it('sorts by security ascending (High first)', () => {
        const sorted = sortBridges(mockBridges, 'security', 'asc')
        expect(sorted[0].security).toBe('High')
        expect(sorted[1].security).toBe('High')
        expect(sorted[2].security).toBe('Medium')
      })

      it('sorts by security descending (Low first)', () => {
        const bridgesWithLowSecurity = [
          ...mockBridges,
          { ...mockBridges[0], name: 'Bridge D', security: 'Low', position: 4 },
        ] as BridgeWithPosition[]

        const sorted = sortBridges(bridgesWithLowSecurity, 'security', 'desc')
        expect(sorted[0].security).toBe('Low')
      })
    })

    describe('position reassignment', () => {
      it('reassigns positions after sorting', () => {
        const sorted = sortBridges(mockBridges, 'cost', 'desc')
        expect(sorted[0].position).toBe(1)
        expect(sorted[1].position).toBe(2)
        expect(sorted[2].position).toBe(3)
      })

      it('maintains sequential positions', () => {
        const sorted = sortBridges(mockBridges, 'time', 'asc')
        sorted.forEach((bridge, index) => {
          expect(bridge.position).toBe(index + 1)
        })
      })
    })

    describe('unavailable bridges handling', () => {
      it('places unavailable bridges at the end regardless of cost', () => {
        const bridgesWithUnavailable = [
          { ...mockBridges[0], totalCost: 5 }, // Cheapest
          { ...mockBridges[1], unavailable: true, totalCost: 1 }, // Unavailable but cheaper
          { ...mockBridges[2] },
        ] as BridgeWithPosition[]

        const sorted = sortBridges(bridgesWithUnavailable, 'cost', 'asc')
        expect(sorted[2].unavailable).toBe(true)
      })

      it('keeps unavailable bridges in original order', () => {
        const bridgesWithMultipleUnavailable = [
          { ...mockBridges[0] },
          { ...mockBridges[1], unavailable: true, name: 'Unavailable 1' },
          { ...mockBridges[2], unavailable: true, name: 'Unavailable 2' },
        ] as BridgeWithPosition[]

        const sorted = sortBridges(
          bridgesWithMultipleUnavailable,
          'cost',
          'asc'
        )
        expect(sorted[1].name).toBe('Unavailable 1')
        expect(sorted[2].name).toBe('Unavailable 2')
      })
    })

    it('does not mutate original array', () => {
      const original = [...mockBridges]
      sortBridges(mockBridges, 'cost', 'desc')
      expect(mockBridges).toEqual(original)
    })

    it('handles empty array', () => {
      const sorted = sortBridges([], 'cost', 'asc')
      expect(sorted).toEqual([])
    })

    it('handles single bridge', () => {
      const singleBridge = [mockBridges[0]]
      const sorted = sortBridges(singleBridge, 'cost', 'asc')
      expect(sorted).toHaveLength(1)
      expect(sorted[0].position).toBe(1)
    })
  })

  describe('filterByProtocols', () => {
    describe('protocol filtering', () => {
      it('shows all bridges when no protocols selected', () => {
        const filtered = filterByProtocols(mockBridges, [], true)
        expect(filtered).toHaveLength(3)
      })

      it('filters by single selected protocol', () => {
        const filtered = filterByProtocols(mockBridges, ['Across'], true)
        expect(filtered).toHaveLength(2)
        expect(filtered.every((b) => b.protocol === 'Across')).toBe(true)
      })

      it('filters by multiple selected protocols', () => {
        const filtered = filterByProtocols(
          mockBridges,
          ['Across', 'Stargate'],
          true
        )
        expect(filtered).toHaveLength(3)
      })

      it('returns empty array when no matches', () => {
        const filtered = filterByProtocols(mockBridges, ['NonExistent'], true)
        expect(filtered).toEqual([])
      })
    })

    describe('unavailable bridges handling', () => {
      const bridgesWithUnavailable = [
        ...mockBridges,
        {
          name: 'Bridge D',
          provider: 'Provider D',
          protocol: 'Across',
          unavailable: true,
        } as BridgeWithPosition,
      ]

      it('shows unavailable bridges when showUnavailable is true', () => {
        const filtered = filterByProtocols(bridgesWithUnavailable, [], true)
        expect(filtered).toHaveLength(4)
      })

      it('hides unavailable bridges when showUnavailable is false', () => {
        const filtered = filterByProtocols(bridgesWithUnavailable, [], false)
        expect(filtered).toHaveLength(3)
        expect(filtered.every((b) => !b.unavailable)).toBe(true)
      })

      it('filters unavailable bridges by protocol when showUnavailable is true', () => {
        const filtered = filterByProtocols(
          bridgesWithUnavailable,
          ['Across'],
          true
        )
        expect(filtered).toHaveLength(3) // 2 available + 1 unavailable
      })

      it('excludes unavailable bridges even if protocol matches when showUnavailable is false', () => {
        const filtered = filterByProtocols(
          bridgesWithUnavailable,
          ['Across'],
          false
        )
        expect(filtered).toHaveLength(2) // Only available Across bridges
        expect(filtered.every((b) => b.protocol === 'Across')).toBe(true)
        expect(filtered.every((b) => !b.unavailable)).toBe(true)
      })
    })

    it('does not mutate original array', () => {
      const original = [...mockBridges]
      filterByProtocols(mockBridges, ['Across'], true)
      expect(mockBridges).toEqual(original)
    })

    it('handles empty bridge array', () => {
      const filtered = filterByProtocols([], ['Across'], true)
      expect(filtered).toEqual([])
    })

    it('handles all unavailable bridges with showUnavailable false', () => {
      const allUnavailable = mockBridges.map((b) => ({
        ...b,
        unavailable: true,
      }))
      const filtered = filterByProtocols(allUnavailable, [], false)
      expect(filtered).toEqual([])
    })
  })

  describe('integration tests', () => {
    it('can chain sort and filter operations', () => {
      const filtered = filterByProtocols(mockBridges, ['Across'], true)
      const sorted = sortBridges(filtered, 'cost', 'asc')

      expect(sorted).toHaveLength(2)
      expect(sorted[0].protocol).toBe('Across')
      expect(sorted[1].protocol).toBe('Across')
      expect(sorted[0].totalCost).toBeLessThan(sorted[1].totalCost)
    })

    it('handles complex filtering and sorting scenario', () => {
      const complexBridges = [
        ...mockBridges,
        {
          name: 'Bridge D',
          protocol: 'Hop',
          totalCost: 8,
          estimatedTime: '3 min',
          security: 'High',
          unavailable: false,
        } as BridgeWithPosition,
        {
          name: 'Bridge E',
          protocol: 'Across',
          totalCost: 12,
          estimatedTime: '7 min',
          security: 'Low',
          unavailable: true,
        } as BridgeWithPosition,
      ]

      // Filter for Across and Hop, hide unavailable, sort by cost
      const filtered = filterByProtocols(
        complexBridges,
        ['Across', 'Hop'],
        false
      )
      const sorted = sortBridges(filtered, 'cost', 'asc')

      expect(sorted).toHaveLength(3) // 2 Across (available) + 1 Hop
      expect(sorted.every((b) => !b.unavailable)).toBe(true)
      expect(sorted[0].totalCost).toBe(8) // Hop bridge cheapest
    })
  })
})
