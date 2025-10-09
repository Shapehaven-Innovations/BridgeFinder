import type { Bridge, ComparisonSummary } from '@/api/types'

// UI-specific extensions to API types
export interface BridgeWithPosition extends Bridge {
  position: number
  isBest: boolean
  savings?: number
}

// Form state types
export interface BridgeComparisonFormData {
  fromChainId: number | null
  toChainId: number | null
  token: string
  amount: string
  slippage: string
}

export interface BridgeComparisonFormErrors {
  fromChainId?: string
  toChainId?: string
  token?: string
  amount?: string
  slippage?: string
}

// Filter and sort types
export type SortField = 'cost' | 'time' | 'security'
export type SortOrder = 'asc' | 'desc'

export interface FilterState {
  selectedProtocols: string[]
  showUnavailable: boolean
}

export interface SortState {
  field: SortField
  order: SortOrder
}

// Comparison result state
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

// Chart data types
export interface ChartDataPoint {
  name: string
  cost: number
  time: number
  color: string
  provider: string
}

// Protocol types for filtering
export interface ProtocolOption {
  name: string
  count: number
  enabled: boolean
}
