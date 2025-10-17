// src/features/bridge-comparison/components/BridgeCard/BridgeCard.tsx
import React from 'react'
import { Button } from '@components/Button/Button'
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
      {isBestDeal && (
        <div className={styles.bestBadge}>
          <span className={styles.badgeIcon}>🏆</span>
          <span>Best Deal</span>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.protocol}>{protocol}</span>
        </div>
        {position && <div className={styles.position}>#{position}</div>}
      </div>

      <div className={styles.costSection}>
        <div className={styles.totalCost}>
          <span className={styles.label}>Total Cost</span>
          <span className={styles.amount}>${totalCost.toFixed(2)}</span>
        </div>
        {savings !== undefined && savings > 0 && (
          <div className={styles.savings}>Save ${savings.toFixed(2)}</div>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Bridge Fee:</span>
          <span className={styles.detailValue}>${bridgeFee.toFixed(4)}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Gas Fee:</span>
          <span className={styles.detailValue}>${gasFee.toFixed(4)}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Time:</span>
          <span className={styles.detailValue}>{time}</span>
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

      <div className={styles.actions}>
        <Button variant="primary" fullWidth>
          Use {name}
        </Button>
      </div>
    </div>
  )
}
