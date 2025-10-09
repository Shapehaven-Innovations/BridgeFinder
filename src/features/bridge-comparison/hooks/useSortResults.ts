import { useState, useMemo, useCallback } from 'react'
import { sortBridges } from '../api/compareRoutes'
import type { BridgeWithPosition, SortField, SortOrder } from '../types'

export function useSortResults(bridges: BridgeWithPosition[]) {
  const [sortField, setSortField] = useState<SortField>('cost')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const sortedBridges = useMemo(
    () => sortBridges(bridges, sortField, sortOrder),
    [bridges, sortField, sortOrder]
  )

  const setSorting = useCallback((field: SortField, order: SortOrder) => {
    setSortField(field)
    setSortOrder(order)
  }, [])

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  const sortByCost = useCallback(() => {
    setSorting('cost', 'asc')
  }, [setSorting])

  const sortByTime = useCallback(() => {
    setSorting('time', 'asc')
  }, [setSorting])

  const sortBySecurity = useCallback(() => {
    setSorting('security', 'asc')
  }, [setSorting])

  return {
    sortedBridges,
    sortField,
    sortOrder,
    setSorting,
    toggleSortOrder,
    sortByCost,
    sortByTime,
    sortBySecurity,
  }
}
