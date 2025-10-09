import { describe, it, expect, beforeEach } from 'vitest'
import { Storage, getTheme, setTheme } from './storage'

describe('Storage utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Storage class', () => {
    it('sets and gets string values', () => {
      Storage.set('test', 'value')
      expect(Storage.get('test')).toBe('value')
    })

    it('sets and gets object values', () => {
      const obj = { foo: 'bar', num: 123 }
      Storage.set('object', obj)
      expect(Storage.get('object')).toEqual(obj)
    })

    it('returns default value when key not found', () => {
      expect(Storage.get('missing', 'default')).toBe('default')
    })

    it('removes values', () => {
      Storage.set('test', 'value')
      Storage.remove('test')
      expect(Storage.get('test')).toBeNull()
    })

    it('checks if key exists', () => {
      Storage.set('test', 'value')
      expect(Storage.has('test')).toBe(true)
      expect(Storage.has('missing')).toBe(false)
    })

    it('clears all storage', () => {
      Storage.set('key1', 'value1')
      Storage.set('key2', 'value2')
      Storage.clear()
      expect(Storage.get('key1')).toBeNull()
      expect(Storage.get('key2')).toBeNull()
    })
  })

  describe('Theme management', () => {
    it('gets default theme', () => {
      const theme = getTheme()
      expect(['light', 'dark']).toContain(theme)
    })

    it('sets and gets theme', () => {
      setTheme('dark')
      expect(getTheme()).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })
  })
})
