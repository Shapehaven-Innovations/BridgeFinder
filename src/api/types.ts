// Request types
export interface ComparisonParams {
  fromChainId: number
  toChainId: number
  token: string
  amount: string
  fromAddress?: string
  slippage?: string
}

// Bridge types
export interface Bridge {
  name: string
  provider: string
  protocol: string
  route: string
  estimatedTime: string
  totalCost: number
  bridgeFee: number
  gasFee: number
  outputAmount: number
  security: string
  liquidity: string
  url?: string
  position: number
  isBest?: boolean
  savings?: number
  meta?: Record<string, unknown>
  unavailable?: boolean
  unavailableReason?: string
  unavailableDetails?: string
}

export interface ComparisonSummary {
  bestPrice: number | null
  worstPrice: number | null
  averagePrice: number | null
  providersQueried: number
  providersResponded: number
  providersUnavailable: number
}

export interface ComparisonResponse {
  success: boolean
  bridges: Bridge[]
  summary: ComparisonSummary
  timestamp: string
  error?: string
  details?: string
}

// Provider types
export interface Provider {
  name: string
  adapter: string
  status: 'Active' | 'Limited' | 'Disabled'
  priority: number
  requiresAuth: boolean
  authConfigured: boolean | 'N/A'
  rateLimit: string
}

export interface ProvidersResponse {
  count: number
  providers: Provider[]
}

// Status types
export interface StatusResponse {
  status: 'operational' | 'degraded' | 'down'
  version: string
  architecture: string
  environment: string
  timestamp: string
  settings: {
    integrator: string
    feeReceiver: string
    quoteAddress: string
  }
  providers: Record<
    string,
    {
      status: string
      adapter: string
      priority: number
      rateLimit: string
    }
  >
  features: {
    caching: string
    rateLimit: string
    retry: string
    timeout: string
    adapters: string[]
  }
}

// Chain types
export interface Chain {
  id: number
  name: string
  icon?: string
}

// Token types
export interface Token {
  symbol: string
  name: string
  decimals: number
}

// Error types
export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: string
}
