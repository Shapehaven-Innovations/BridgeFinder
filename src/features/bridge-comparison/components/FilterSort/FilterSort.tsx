// src/features/bridge-comparison/components/FilterSort/FilterSort.tsx
import React from 'react'
import styles from './FilterSort.module.css'

interface Protocol {
  id: string
  name: string
  count: number
}

interface FilterSortProps {
  protocols: Protocol[]
  selectedProtocols: string[]
  onProtocolToggle: (protocolId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  sortBy: 'cost' | 'time' | 'security'
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: 'cost' | 'time' | 'security') => void
}

export const FilterSort: React.FC<FilterSortProps> = ({
  protocols,
  selectedProtocols,
  onProtocolToggle,
  onSelectAll,
  onClearAll,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  return (
    <div className={styles.container}>
      {/* Sort Section */}
      <div className={styles.sortSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Sort by:</h3>
        </div>
        <div className={styles.sortButtons}>
          <button
            className={`${styles.sortButton} ${sortBy === 'cost' ? styles.active : ''}`}
            onClick={() => onSortChange('cost')}
          >
            <span className={styles.sortLabel}>Cost</span>
            <span
              className={`${styles.arrow} ${sortBy === 'cost' && sortOrder === 'desc' ? styles.desc : ''}`}
            >
              ↑
            </span>
          </button>
          <button
            className={`${styles.sortButton} ${sortBy === 'time' ? styles.active : ''}`}
            onClick={() => onSortChange('time')}
          >
            <span className={styles.sortLabel}>Time</span>
            <span
              className={`${styles.arrow} ${sortBy === 'time' && sortOrder === 'desc' ? styles.desc : ''}`}
            >
              ↑
            </span>
          </button>
          <button
            className={`${styles.sortButton} ${sortBy === 'security' ? styles.active : ''}`}
            onClick={() => onSortChange('security')}
          >
            <span className={styles.sortLabel}>Security</span>
            <span
              className={`${styles.arrow} ${sortBy === 'security' && sortOrder === 'desc' ? styles.desc : ''}`}
            >
              ↑
            </span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Filter by Protocol</h3>
          <div className={styles.filterActions}>
            <button className={styles.actionButton} onClick={onSelectAll}>
              Select All
            </button>
            <button className={styles.actionButton} onClick={onClearAll}>
              Clear All
            </button>
          </div>
        </div>

        <div className={styles.protocolPills}>
          {protocols.map((protocol) => (
            <button
              key={protocol.id}
              className={`${styles.pill} ${
                selectedProtocols.includes(protocol.id) ? styles.pillActive : ''
              }`}
              onClick={() => onProtocolToggle(protocol.id)}
            >
              <span className={styles.pillCheck}>
                {selectedProtocols.includes(protocol.id) ? '✓' : ''}
              </span>
              <span className={styles.pillName}>{protocol.name}</span>
              <span className={styles.pillCount}>{protocol.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// src/features/bridge-comparison/components/ComparisonSummary/ComparisonSummary.tsx
interface SummaryProps {
  bestPrice: number
  averagePrice: number
  highestPrice: number
  availableRoutes: number
  updatedAt?: Date
}

export const ComparisonSummary: React.FC<SummaryProps> = ({
  bestPrice,
  averagePrice,
  highestPrice,
  availableRoutes,
  updatedAt,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryHeader}>
        <h2 className={styles.summaryTitle}>Comparison Results</h2>
        {updatedAt && (
          <p className={styles.updatedTime}>
            Updated {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryItem} ${styles.best}`}>
          <div className={styles.summaryIcon}>✓</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Best Price</div>
            <div className={styles.summaryValue}>
              {formatCurrency(bestPrice)}
            </div>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>≈</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Average Price</div>
            <div className={styles.summaryValue}>
              {formatCurrency(averagePrice)}
            </div>
          </div>
        </div>

        <div className={`${styles.summaryItem} ${styles.highest}`}>
          <div className={styles.summaryIcon}>↑</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Highest Price</div>
            <div className={styles.summaryValue}>
              {formatCurrency(highestPrice)}
            </div>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>🌉</div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryLabel}>Available Routes</div>
            <div className={styles.summaryValue}>{availableRoutes}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
