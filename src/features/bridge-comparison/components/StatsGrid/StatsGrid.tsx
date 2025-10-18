// src/features/bridge-comparison/components/StatsGrid/StatsGrid.tsx
import React from 'react'
import { Card } from '../../../../components/Card'
import styles from './StatsGrid.module.css'

interface ComparisonSummary {
  bestPrice: number | null
  averagePrice: number | null
  worstPrice: number | null
  availableRoutes: number
}

interface StatsGridProps {
  summary: ComparisonSummary
}

// Helper function to format currency values consistently
const formatCurrency = (value: number | null): string => {
  if (value === null) {
    return 'N/A'
  }

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

export const StatsGrid: React.FC<StatsGridProps> = ({ summary }) => {
  const stats = [
    {
      label: 'Best Price',
      value: formatCurrency(summary.bestPrice),
      // Removed custom className for color coding
    },
    {
      label: 'Average Price',
      value: formatCurrency(summary.averagePrice),
    },
    {
      label: 'Highest Price',
      value: formatCurrency(summary.worstPrice),
      // Removed custom className for color coding
    },
    {
      label: 'Available Routes',
      value: summary.availableRoutes.toString(),
    },
  ]

  return (
    <Card className={styles.container}>
      <div className={styles.grid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <div className={styles.label}>{stat.label}</div>
            <div className={styles.value}>{stat.value}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
