import React from 'react'
import { Card } from '@components/Card'
import { Button } from '@components/Button'
import type { BridgeWithPosition } from '../../types'
import styles from './BridgeCard.module.css'

interface BridgeCardProps {
  bridge: BridgeWithPosition
}

export const BridgeCard: React.FC<BridgeCardProps> = ({ bridge }) => {
  if (bridge.unavailable) {
    return (
      <Card variant="default" padding="md" className={styles.cardUnavailable}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div>
              <h3 className={styles.name}>{bridge.name}</h3>
              <p className={styles.provider}>{bridge.provider}</p>
            </div>
          </div>
          <div className={styles.badges}>
            <span className={styles.unavailableBadge}>Unavailable</span>
          </div>
        </div>
        <div className={styles.unavailableContent}>
          <p className={styles.unavailableReason}>
            {bridge.unavailableReason || 'No route available'}
          </p>
          {bridge.unavailableDetails && (
            <p className={styles.unavailableDetails}>
              {bridge.unavailableDetails}
            </p>
          )}
        </div>
      </Card>
    )
  }

  const cardClass = bridge.isBest ? styles.cardBest : styles.card

  return (
    <Card variant="elevated" padding="md" className={cardClass}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div>
            <h3 className={styles.name}>{bridge.name}</h3>
            <p className={styles.provider}>{bridge.provider}</p>
          </div>
        </div>
        <div className={styles.badges}>
          {bridge.isBest && <span className={styles.bestBadge}>Best Deal</span>}
          <span className={styles.position}>#{bridge.position}</span>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricRow}>
          <span className={styles.label}>Total Cost</span>
          <span className={styles.valuePrimary}>
            ${bridge.totalCost.toFixed(2)}
          </span>
        </div>
        <div className={styles.metricRow}>
          <span className={styles.label}>Bridge Fee</span>
          <span className={styles.value}>${bridge.bridgeFee.toFixed(2)}</span>
        </div>
        <div className={styles.metricRow}>
          <span className={styles.label}>Gas Fee</span>
          <span className={styles.value}>
            ${bridge.gasFee ? bridge.gasFee.toFixed(2) : 'N/A'}
          </span>
        </div>
        {bridge.savings && bridge.savings > 0 && (
          <div className={styles.savings}>
            Save ${bridge.savings.toFixed(2)} vs highest
          </div>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Time</span>
          <span className={styles.detailValue}>{bridge.estimatedTime}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Security</span>
          <span className={styles.detailValue}>{bridge.security}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Liquidity</span>
          <span className={styles.detailValue}>{bridge.liquidity}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.route}>
          <span className={styles.routeLabel}>Route</span>
          <span className={styles.routeValue}>{bridge.route}</span>
        </div>
        <div className={styles.protocol}>
          <span className={styles.protocolBadge}>{bridge.protocol}</span>
        </div>
      </div>

      <div className={styles.actions}>
        {bridge.url && (
          <Button
            variant="primary"
            size="md"
            onClick={() => window.open(bridge.url as string, '_blank')}
          >
            Bridge Now →
          </Button>
        )}
      </div>
    </Card>
  )
}
