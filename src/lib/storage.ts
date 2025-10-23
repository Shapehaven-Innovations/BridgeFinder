/**
 * Type-safe localStorage wrapper with error handling
 */
class LocalStorage {
  /**
   * Get item from localStorage with type safety
   */
  get<T>(key: string): T | null {
    try {
      const item = window.localStorage.getItem(key)
      if (!item) return null
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error)
      return null
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage [${key}]:`, error)
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error)
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      window.localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

export const Storage = new LocalStorage()

// Storage keys
export const STORAGE_KEYS = {
  THEME: 'bridge-finder-theme',
  SLIPPAGE: 'bridge-finder-slippage',
  SELECTED_PROTOCOLS: 'bridge-finder-protocols',
  LAST_COMPARISON: 'bridge-finder-last-comparison',
  PREFERRED_PROVIDERS: 'bridge-finder-providers',
} as const

/**
 * Theme management
 */
export function getTheme(): 'light' | 'dark' {
  const stored = Storage.get<string>(STORAGE_KEYS.THEME)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  // Check system preference
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }

  return 'light'
}

export function setTheme(theme: 'light' | 'dark'): void {
  Storage.set(STORAGE_KEYS.THEME, theme)
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Slippage management
 */
export function getSlippage(): string {
  return Storage.get<string>(STORAGE_KEYS.SLIPPAGE) || '0.01'
}

export function setSlippage(slippage: string): void {
  Storage.set(STORAGE_KEYS.SLIPPAGE, slippage)
}

/**
 * Protocol filter management
 */
export function getSelectedProtocols(): string[] | null {
  return Storage.get<string[]>(STORAGE_KEYS.SELECTED_PROTOCOLS)
}

export function setSelectedProtocols(protocols: string[]): void {
  Storage.set(STORAGE_KEYS.SELECTED_PROTOCOLS, protocols)
}

/**
 * Last comparison parameters
 */
export interface LastComparisonParams {
  fromChainId: string
  toChainId: string
  token: string
  amount: string
}

export function getLastComparison(): LastComparisonParams | null {
  return Storage.get<LastComparisonParams>(STORAGE_KEYS.LAST_COMPARISON)
}

export function setLastComparison(params: LastComparisonParams): void {
  Storage.set(STORAGE_KEYS.LAST_COMPARISON, params)
}
