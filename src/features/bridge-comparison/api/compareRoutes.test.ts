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
    totalCost: 10,
    estimatedTime: '5 min',
    security: 'High',
    position: 1,
    isBest: true,
  } as BridgeWithPosition,
  {
    name: 'Bridge B',
    provider: 'Provider B',
    protocol: 'Stargate',
    totalCost: 15,
    estimatedTime: '10 min',
    security: 'Medium',
    position: 2,
    isBest: false,
  } as BridgeWithPosition,
  {
    name: 'Bridge C',
    provider: 'Provider C',
    protocol: 'Across',
    totalCost: 20,
    estimatedTime: '2 min',
    security: 'High',
    position: 3,
    isBest: false,
  } as BridgeWithPosition,
]

describe('compareRoutes utilities', () => {
  describe('extractProtocols', () => {
    it('extracts unique protocols', () => {
      const protocols = extractProtocols(mockBridges)
      expect(protocols).toEqual(['Across', 'Stargate'])
    })

    it('filters out unavailable bridges', () => {
      const bridgesWithUnavailable = [
        ...mockBridges,
        {
          protocol: 'Hop',
          unavailable: true,
        } as BridgeWithPosition,
      ]
      const protocols = extractProtocols(bridgesWithUnavailable)
      expect(protocols).not.toContain('Hop')
    })
  })

  describe('sortBridges', () => {
    it('sorts by cost ascending', () => {
      const sorted = sortBridges(mockBridges, 'cost', 'asc')
      expect(sorted[0].totalCost).toBe(10)
      expect(sorted[2].totalCost).toBe(20)
    })

    it('sorts by cost descending', () => {
      const sorted = sortBridges(mockBridges, 'cost', 'desc')
      expect(sorted[0].totalCost).toBe(20)
      expect(sorted[2].totalCost).toBe(10)
    })

    it('reassigns positions after sorting', () => {
      const sorted = sortBridges(mockBridges, 'cost', 'desc')
      expect(sorted[0].position).toBe(1)
      expect(sorted[1].position).toBe(2)
      expect(sorted[2].position).toBe(3)
    })
  })

  describe('filterByProtocols', () => {
    it('shows all when no protocols selected', () => {
      const filtered = filterByProtocols(mockBridges, [], true)
      expect(filtered).toHaveLength(3)
    })

    it('filters by selected protocols', () => {
      const filtered = filterByProtocols(mockBridges, ['Across'], true)
      expect(filtered).toHaveLength(2)
      expect(filtered.every((b) => b.protocol === 'Across')).toBe(true)
    })

    it('hides unavailable bridges when showUnavailable is false', () => {
      const bridgesWithUnavailable = [
        ...mockBridges,
        {
          protocol: 'Across',
          unavailable: true,
        } as BridgeWithPosition,
      ]
      const filtered = filterByProtocols(bridgesWithUnavailable, [], false)
      expect(filtered).toHaveLength(3)
    })
  })
})
