import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  ComparisonParams,
  ComparisonResponse,
  ProvidersResponse,
  StatusResponse,
  Chain,
  Token,
} from './types'

// Query keys for cache management
export const queryKeys = {
  comparison: (params: ComparisonParams) => ['comparison', params] as const,
  providers: () => ['providers'] as const,
  status: () => ['status'] as const,
  chains: () => ['chains'] as const,
  tokens: () => ['tokens'] as const,
}

// Bridge comparison query
export function useBridgeComparison(
  params: ComparisonParams,
  options?: Omit<UseQueryOptions<ComparisonResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.comparison(params),
    queryFn: () => apiClient.post<ComparisonResponse>('/api/compare', params),
    enabled: Boolean(
      params.fromChainId &&
        params.toChainId &&
        params.token &&
        Number(params.amount) > 0
    ),
    ...options,
  })
}

// Bridge comparison mutation (for manual triggering)
export function useBridgeComparisonMutation() {
  return useMutation({
    mutationFn: (params: ComparisonParams) =>
      apiClient.post<ComparisonResponse>('/api/compare', params),
  })
}

// Providers query
export function useProviders(
  options?: Omit<UseQueryOptions<ProvidersResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.providers(),
    queryFn: () => apiClient.get<ProvidersResponse>('/api/providers'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

// Status query
export function useStatus(
  options?: Omit<UseQueryOptions<StatusResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.status(),
    queryFn: () => apiClient.get<StatusResponse>('/api/status'),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  })
}

// Chains query
export function useChains(
  options?: Omit<
    UseQueryOptions<{ chains: Record<string, Chain>; count: number }>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: queryKeys.chains(),
    queryFn: () =>
      apiClient.get<{ chains: Record<string, Chain>; count: number }>(
        '/api/chains'
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}

// Tokens query
export function useTokens(
  options?: Omit<
    UseQueryOptions<{ tokens: Record<string, Token>; count: number }>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: queryKeys.tokens(),
    queryFn: () =>
      apiClient.get<{ tokens: Record<string, Token>; count: number }>(
        '/api/tokens'
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  })
}
