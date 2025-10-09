export interface Chain {
  name: string
  icon: string
  native: string
  decimals: number
}

export interface Token {
  address: string | Record<number, string>
  decimals: number
  symbol: string
}

export interface BridgeQuote {
  name: string
  icon: string
  provider: string
  totalCost: number
  bridgeFee: number
  gasFee: number
  estimatedTime: string
  security: string
  liquidity: string
  route: string
  outputAmount: string | null
  protocol: string
  position: number | null
  isBest: boolean
  savings: number | null
  url: string | null
  unavailable?: boolean
  unavailableReason?: string
  meta?: Record<string, unknown>
}

export interface BridgeComparisonRequest {
  fromChainId: number
  toChainId: number
  token: string
  amount: string
  fromAddress?: string
  slippage?: string
}

export interface BridgeComparisonResponse {
  success: boolean
  bridges: BridgeQuote[]
  summary: {
    bestPrice: number | null
    worstPrice: number | null
    averagePrice: number | null
    providersQueried: number
    providersResponded: number
    providersUnavailable: number
  }
  timestamp: string
  error?: string
  details?: string
}
