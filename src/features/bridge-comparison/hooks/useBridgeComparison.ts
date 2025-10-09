import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { compareRoutes } from '../api/compareRoutes'
import type { ComparisonParams } from '@/api/types'
import type { ComparisonResult } from '../types'
import { setLastComparison } from '@/lib/storage'

export function useBridgeComparison() {
  const [result, setResult] = useState<ComparisonResult | null>(null)

  const mutation = useMutation({
    mutationFn: compareRoutes,
    onSuccess: (data) => {
      setResult(data)
      // Save to localStorage for persistence
      setLastComparison({
        fromChainId: data.params.fromChainId,
        toChainId: data.params.toChainId,
        token: data.params.token,
        amount: data.params.amount,
      })
    },
  })

  const compare = useCallback(
    (params: ComparisonParams) => {
      mutation.mutate(params)
    },
    [mutation]
  )

  const reset = useCallback(() => {
    setResult(null)
    mutation.reset()
  }, [mutation])

  return {
    result,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error as { message: string; details?: string } | null,
    compare,
    reset,
  }
}
