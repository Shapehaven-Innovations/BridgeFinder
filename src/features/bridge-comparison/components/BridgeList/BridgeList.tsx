// src/features/bridge-comparison/components/BridgeList/BridgeList.tsx
import React from 'react'
import { BridgeCard } from '../BridgeCard/BridgeCard'
import type { BridgeQuote } from '../../../../types/bridge'
import styles from './BridgeList.module.css'

// Accept either BridgeQuote or any object with the required properties
interface BridgeListProps {
  bridges: Array<
    | BridgeQuote
    | {
        name: string
        provider: string
        protocol: string
        totalCost: number
        bridgeFee: number
        gasFee: number
        estimatedTime: string
        security: string
        liquidity: string
        route: string
        position: number
        isBest: boolean
        savings?: number | null
        icon?: string
        outputAmount?: string | number | null
        url?: string | null
        unavailable?: boolean
        unavailableReason?: string
        meta?: Record<string, unknown>
      }
  >
}

export const BridgeList: React.FC<BridgeListProps> = ({ bridges }) => {
  if (!bridges || bridges.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No bridge routes found.</p>
      </div>
    )
  }

  return (
    <div className={styles.bridgeList}>
      {bridges.map((bridge, index) => {
        // Transform to BridgeQuote format
        const bridgeQuote: BridgeQuote = {
          name: bridge.name,
          icon: bridge.icon || '🌉',
          provider: bridge.provider,
          protocol: bridge.protocol,
          totalCost: bridge.totalCost,
          bridgeFee: bridge.bridgeFee,
          gasFee: bridge.gasFee,
          estimatedTime: bridge.estimatedTime,
          security: bridge.security,
          liquidity: bridge.liquidity,
          route: bridge.route,
          outputAmount:
            typeof bridge.outputAmount === 'number'
              ? String(bridge.outputAmount)
              : bridge.outputAmount || null,
          position: bridge.position,
          isBest: bridge.isBest,
          savings: bridge.savings || null,
          url: bridge.url || null,
          unavailable: bridge.unavailable,
          unavailableReason: bridge.unavailableReason,
          meta: bridge.meta,
        }

        return (
          <BridgeCard
            key={`${bridge.name}-${bridge.protocol}-${index}`}
            bridge={bridgeQuote}
          />
        )
      })}
    </div>
  )
}
