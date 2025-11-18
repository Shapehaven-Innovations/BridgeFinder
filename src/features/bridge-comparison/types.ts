// types.ts - Bridge Comparison Type Definitions

/**
 * Base Bridge interface from API response
 */
export interface Bridge {
  id: string
  name: string
  available: boolean
  totalCost: number
  gasCost: number
  bridgeFee: number
  estimatedTime: number // in seconds
  route?: string[]
  warning?: string
  securityScore?: number | string
  protocol?: string
  liquidity?: number
  slippage?: number
}

/**
 * Enhanced Bridge with position and comparison data
 */
export interface BridgeWithPosition extends Bridge {
  position: number
  isBest: boolean
  savings?: number
}

/**
 * Parameters for bridge comparison
 */
export interface ComparisonParams {
  fromChainId: number
  toChainId: number
  token: string
  amount: string | number
  slippage?: number
  userAddress?: string
}

/**
 * Summary statistics for comparison
 */
export interface ComparisonSummary {
  totalRoutes: number
  avgCost: number
  avgTime: string
  availableRoutes: number
  bestBridge?: string
  potentialSavings?: number
}

/**
 * API Response from comparison endpoint
 */
export interface ComparisonResponse {
  success: boolean
  bridges: Bridge[]
  summary?: ComparisonSummary
  timestamp?: string
  error?: string
  message?: string
}

/**
 * Final comparison result after enrichment
 */
export interface ComparisonResult {
  bridges: BridgeWithPosition[]
  summary: ComparisonSummary
  timestamp: string
  params: {
    fromChainId: number
    toChainId: number
    token: string
    amount: number
  }
}

/**
 * Chain information
 */
export interface Chain {
  id: number
  name: string
  shortName: string
  icon?: string
  rpcUrl?: string
  explorerUrl?: string
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
}

/**
 * Token information
 */
export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI?: string
  priceUSD?: number
}

/**
 * Error types for better error handling
 */
export enum BridgeErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
  API_ERROR = 'API_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for bridge operations
 */
export class BridgeError extends Error {
  constructor(
    public type: BridgeErrorType,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'BridgeError'
  }
}

/**
 * Filter options for bridge display
 */
export interface BridgeFilters {
  showUnavailable: boolean
  maxCost?: number
  maxTime?: number // in seconds
  protocols?: string[]
  minSecurityScore?: number
}

/**
 * Sorting options
 */
export enum BridgeSortBy {
  COST = 'cost',
  TIME = 'time',
  SECURITY = 'security',
  POSITION = 'position',
}

/**
 * User preferences
 */
export interface UserPreferences {
  slippage: number
  prioritize: 'cost' | 'time' | 'security'
  favoriteProtocols: string[]
  maxAcceptableCost?: number
  maxAcceptableTime?: number
}
