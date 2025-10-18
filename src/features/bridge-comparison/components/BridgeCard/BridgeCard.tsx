// src/features/bridge-comparison/components/BridgeCard/BridgeCard.tsx
import React from 'react'
import { Button } from '../../../../components/Button'
import styles from './BridgeCard.module.css'

interface BridgeCardProps {
  bridge: {
    name: string
    protocol: string
    totalCost: number
    bridgeFee: number
    gasFee: number
    time: string
    security: string
    liquidity: string
    route: string
    isBestDeal?: boolean
    position?: number
    savings?: number
  }
}

const formatCurrency = (value: number): string => {
  if (value === 0) {
    return '$0.00'
  }
  // Always show 2 decimals for consistency
  return `$${value.toFixed(2)}`
}

export const BridgeCard: React.FC<BridgeCardProps> = ({ bridge }) => {
  const {
    name,
    protocol,
    totalCost,
    bridgeFee,
    gasFee,
    time,
    security,
    liquidity,
    route,
    isBestDeal,
    position,
    savings,
  } = bridge

  return (
    <div className={`${styles.card} ${isBestDeal ? styles.bestDeal : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.name}>{name}</h3>
        </div>
        <div className={styles.badges}>
          {isBestDeal && <span className={styles.bestBadge}>Best</span>}
          {position && <span className={styles.position}>#{position}</span>}
        </div>
      </div>

      <div className={styles.provider}>{protocol}</div>

      <div className={styles.costSection}>
        <div className={styles.costLabel}>Total Cost</div>
        <div className={styles.costValue}>{formatCurrency(totalCost)}</div>
        <div className={styles.savingsContainer}>
          <div className={styles.savings}>
            Save {formatCurrency(savings && savings > 0 ? savings : 0)}
          </div>
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
          <span className={styles.detailValue}>{time || 'N/A'}</span>
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

      <Button variant="primary" size="lg" className={styles.bridgeButton}>
        Use {name}
      </Button>
    </div>
  )
}
