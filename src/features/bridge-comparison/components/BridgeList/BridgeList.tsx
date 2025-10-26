// src/features/bridge-comparison/components/BridgeCard/BridgeCard.tsx
import React from 'react'
import { Button } from '../../../../components/Button'
import type { BridgeQuote } from '../../../../types/bridge'
import styles from './BridgeCard.module.css'

interface BridgeCardProps {
  bridge: BridgeQuote
}

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  if (value === 0) {
    return '$0.00'
  }

  // For very small values (less than 0.01), show 4 decimals
  if (value < 0.01) {
    return `$${value.toFixed(4)}`
  }

  // For normal values, show 2 decimals
  return `$${value.toFixed(2)}`
}

export const BridgeCard: React.FC<BridgeCardProps> = ({ bridge }) => {
  const {
    name,
    protocol,
    totalCost,
    bridgeFee,
    gasFee,
    estimatedTime,
    security,
    liquidity,
    route,
    isBest,
    position,
    savings,
  } = bridge

  return (
    <div className={`${styles.card} ${isBest ? styles.bestDeal : ''}`}>
      {isBest && (
        <div className={styles.badge}>
          <span className={styles.badgeIcon}>⭐</span>
          <span className={styles.badgeText}>Best Deal</span>
        </div>
      )}

      {position && (
        <div className={styles.position}>
          <span className={styles.positionNumber}>#{position}</span>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.nameSection}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.protocol}>{protocol}</span>
        </div>

        <div className={styles.costSection}>
          <div className={styles.totalCost}>
            <span className={styles.costLabel}>Total Cost</span>
            <span className={styles.costValue}>
              {formatCurrency(totalCost)}
            </span>
          </div>
          {savings && savings > 0 && (
            <div className={styles.savings}>
              <span className={styles.savingsText}>
                Save {formatCurrency(savings)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Bridge Fee:</span>
          <span className={styles.detailValue}>
            {formatCurrency(bridgeFee)}
          </span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Gas Fee:</span>
          <span className={styles.detailValue}>{formatCurrency(gasFee)}</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Time:</span>
          <span className={styles.detailValue}>{estimatedTime}</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Security:</span>
          <span className={styles.detailValue}>{security}</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Liquidity:</span>
          <span className={styles.detailValue}>{liquidity}</span>
        </div>

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Route:</span>
          <span className={styles.detailValue}>{route}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="primary" size="md" className={styles.bridgeButton}>
          Use {name}
        </Button>
      </div>
    </div>
  )
}
