import { useState, useMemo, useCallback } from 'react'
import { filterByProtocols, extractProtocols } from '../api/compareRoutes'
import type { BridgeWithPosition, ProtocolOption } from '../types'
import {
  getSelectedProtocols,
  setSelectedProtocols as saveSelectedProtocols,
} from '@/lib/storage'

export function useProtocolFilter(bridges: BridgeWithPosition[]) {
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(
    () => getSelectedProtocols() || []
  )
  const [showUnavailable, setShowUnavailable] = useState(true)

  // Get all unique protocols
  const allProtocols = useMemo(() => extractProtocols(bridges), [bridges])

  // Create protocol options with counts
  const protocolOptions = useMemo<ProtocolOption[]>(() => {
    return allProtocols.map((protocol) => {
      const count = bridges.filter(
        (b) => b.protocol === protocol && !b.unavailable
      ).length
      return {
        name: protocol,
        count,
        enabled:
          selectedProtocols.length === 0 ||
          selectedProtocols.includes(protocol),
      }
    })
  }, [allProtocols, bridges, selectedProtocols])

  // Filter bridges
  const filteredBridges = useMemo(
    () => filterByProtocols(bridges, selectedProtocols, showUnavailable),
    [bridges, selectedProtocols, showUnavailable]
  )

  // Toggle a single protocol
  const toggleProtocol = useCallback((protocol: string) => {
    setSelectedProtocols((prev) => {
      const newSelection = prev.includes(protocol)
        ? prev.filter((p) => p !== protocol)
        : [...prev, protocol]

      saveSelectedProtocols(newSelection)
      return newSelection
    })
  }, [])

  // Select all protocols
  const selectAll = useCallback(() => {
    setSelectedProtocols([])
    saveSelectedProtocols([])
  }, [])

  // Clear all protocols
  const clearAll = useCallback(() => {
    setSelectedProtocols(allProtocols)
    saveSelectedProtocols(allProtocols)
  }, [allProtocols])

  // Toggle show unavailable
  const toggleShowUnavailable = useCallback(() => {
    setShowUnavailable((prev) => !prev)
  }, [])

  return {
    filteredBridges,
    protocolOptions,
    selectedProtocols,
    showUnavailable,
    toggleProtocol,
    selectAll,
    clearAll,
    toggleShowUnavailable,
  }
}
