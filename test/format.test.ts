import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompact,
  truncate,
  truncateAddress,
} from './format'

describe('format utilities', () => {
  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
      expect(formatNumber(1000000)).toBe('1,000,000.00')
    })

    it('handles custom decimals', () => {
      expect(formatNumber(1234.5678, 4)).toBe('1,234.5678')
      expect(formatNumber(1234.5, 0)).toBe('1,235')
    })

    it('handles invalid input', () => {
      expect(formatNumber('invalid')).toBe('invalid')
    })
  })

  describe('formatCurrency', () => {
    it('formats with default $ symbol', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('formats with custom symbol', () => {
      expect(formatCurrency(1234.56, { symbol: '€' })).toBe('€1,234.56')
    })

    it('positions symbol after value', () => {
      expect(
        formatCurrency(1234.56, {
          symbol: 'USD',
          symbolPosition: 'after',
        })
      ).toBe('1,234.56 USD')
    })
  })

  describe('formatPercentage', () => {
    it('formats decimal as percentage', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%')
      expect(formatPercentage(1.5)).toBe('150.00%')
    })
  })

  describe('formatCompact', () => {
    it('formats large numbers with suffixes', () => {
      expect(formatCompact(1234)).toBe('1.2K')
      expect(formatCompact(1234567)).toBe('1.2M')
      expect(formatCompact(1234567890)).toBe('1.2B')
    })

    it('keeps small numbers unchanged', () => {
      expect(formatCompact(123)).toBe('123.0')
    })
  })

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('keeps short strings unchanged', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })
  })

  describe('truncateAddress', () => {
    it('truncates Ethereum addresses', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      expect(truncateAddress(address)).toBe('0x1234...5678')
    })

    it('handles custom lengths', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      expect(truncateAddress(address, 8, 6)).toBe('0x123456...345678')
    })
  })
})
