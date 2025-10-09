import React from 'react'
import { BridgeCard } from '../BridgeCard/BridgeCard'
import type { BridgeQuote } from '../../../../types/bridge'
import styles from './BridgeList.module.css'

interface BridgeListProps {
  bridges: BridgeQuote[]
}

export const BridgeList: React.FC<BridgeListProps> = ({ bridges }) => {
  if (bridges.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🌉</div>
        <p className={styles.emptyMessage}>
          No bridge routes found. Try adjusting your search parameters.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {bridges.map((bridge) => (
        <BridgeCard key={bridge.provider} bridge={bridge} />
      ))}
    </div>
  )
}
