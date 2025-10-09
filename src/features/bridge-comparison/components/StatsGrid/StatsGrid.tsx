import React from 'react'
import { Card } from '@components/Card'
import type { ComparisonSummary } from '@/api/types'
import styles from './StatsGrid.module.css'

interface StatsGridProps {
  summary: ComparisonSummary
}

export const StatsGrid: React.FC<StatsGridProps> = ({ summary }) => {
  const stats = [
    {
      label: 'Best Price',
      value:
        summary.bestPrice !== null ? `$${summary.bestPrice.toFixed(2)}` : 'N/A',
      className: styles.success,
    },
    {
      label: 'Average Price',
      value:
        summary.averagePrice !== null
          ? `$${summary.averagePrice.toFixed(2)}`
          : 'N/A',
    },
    {
      label: 'Highest Price',
      value:
        summary.worstPrice !== null
          ? `$${summary.worstPrice.toFixed(2)}`
          : 'N/A',
      className: styles.error,
    },
    {
      label: 'Available Routes',
      value: `${summary.providersResponded}`,
    },
  ]

  return (
    <Card variant="outlined" padding="md">
      <div className={styles.grid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.label}>{stat.label}</span>
            <span className={`${styles.value} ${stat.className || ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
