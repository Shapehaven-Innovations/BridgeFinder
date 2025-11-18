import React from 'react'
import {
  ChevronRight,
  Sparkles,
  Clock,
  DollarSign,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { BridgeWithPosition } from '../../types'
import { formatCurrency } from '../../../../lib/format'
import styles from './BridgeCard.module.css'

interface BridgeCardProps {
  bridge: BridgeWithPosition
  onSelect?: (bridge: BridgeWithPosition) => void
  isSelected?: boolean
  showDetails?: boolean
}

export const BridgeCard: React.FC<BridgeCardProps> = ({
  bridge,
  onSelect,
  isSelected = false,
  showDetails = false,
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(bridge)
    }
  }

  const getStatusIcon = () => {
    if (!bridge.available) {
      return <XCircle className={`${styles.statusIcon} ${styles.error}`} />
    }
    if (bridge.isBest) {
      return (
        <CheckCircle className={`${styles.statusIcon} ${styles.success}`} />
      )
    }
    return null
  }

  const formatTimeLocal = (t?: number | string | null) => {
    if (t === undefined || t === null) return 'N/A'
    if (typeof t === 'string') return t
    const minutes = Math.round(t)
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m === 0 ? `${h}h` : `${h}h ${m}m`
    }
    return `${minutes}m`
  }

  const getCardClassName = () => {
    const classes = [styles.bridgeCard]

    if (!bridge.available) classes.push(styles.unavailable)
    if (bridge.isBest) classes.push(styles.best)
    if (bridge.position <= 3 && !bridge.isBest) classes.push(styles.topThree)
    if (isSelected) classes.push(styles.selected)

    return classes.join(' ')
  }

  function formatTime(estimatedTime?: number | string | null): React.ReactNode {
    return formatTimeLocal(estimatedTime)
  }

  const route = bridge.route ?? []

  return (
    <div
      className={getCardClassName()}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${bridge.name} bridge option`}
    >
      {/* Header Section */}
      <div className={styles.bridgeCardHeader}>
        <div className={styles.bridgeInfo}>
          <div className={styles.bridgePosition}>#{bridge.position}</div>
          <h3 className={styles.bridgeName}>
            {bridge.name}
            {bridge.isBest && (
              <Sparkles className={styles.bestBadge} aria-label="Best option" />
            )}
          </h3>
          {getStatusIcon()}
        </div>

        <div className={styles.bridgeCost}>
          <DollarSign className={styles.costIcon} />
          <span className={styles.costValue}>
            {formatCurrency(bridge.totalCost)}
          </span>
          {bridge.savings !== undefined && bridge.savings > 0 && (
            <span className={styles.savings}>
              Save {formatCurrency(bridge.savings)}
              <span className={styles.metricValue}>
                {formatTimeLocal(bridge.estimatedTime)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.bridgeCardContent}>
        <div className={styles.bridgeMetrics}>
          <div className={styles.metric}>
            <Clock className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Time</span>
              <span className={styles.metricValue}>
                {formatTime(bridge.estimatedTime)}
              </span>
            </div>
          </div>

          <div className={styles.metric}>
            <Shield className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Security</span>
              <span className={styles.metricValue}>
                {bridge.securityScore || 'N/A'}
              </span>
            </div>
          </div>

          <div className={styles.metric}>
            <DollarSign className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Gas Fee</span>
              <span className={styles.metricValue}>
                {formatCurrency(bridge.gasCost)}
              </span>
            </div>
          </div>
          {/* Route Information */}
          {showDetails && route.length > 0 && (
            <div className={styles.bridgeRoute}>
              <h4 className={styles.routeTitle}>Route Details</h4>
              <div className={styles.routeSteps}>
                {route.map((step, index) => (
                  <div key={index} className={styles.routeStep}>
                    <span className={styles.stepNumber}>{index + 1}</span>
                    <span className={styles.stepDescription}>{step}</span>
                    {index < route.length - 1 && (
                      <ChevronRight className={styles.stepArrow} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Warnings or Additional Info */}
        {bridge.warning && (
          <div className={styles.bridgeWarning}>
            <AlertCircle className={styles.warningIcon} />
            <span className={styles.warningText}>{bridge.warning}</span>
          </div>
        )}

        {/* Unavailable Message */}
        {!bridge.available && (
          <div className={styles.bridgeUnavailable}>
            <XCircle className={styles.unavailableIcon} />
            <span className={styles.unavailableText}>
              This bridge is currently unavailable
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {bridge.available && onSelect && (
        <button
          className={styles.bridgeCardAction}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          aria-label={`Select ${bridge.name}`}
        >
          <span>Select Bridge</span>
          <ChevronRight className={styles.actionIcon} />
        </button>
      )}
    </div>
  )
}

// Modern Bridge Card variant for a more contemporary look
export const ModernBridgeCard: React.FC<BridgeCardProps> = (props) => {
  return <BridgeCard {...props} />
}

// Compact Bridge Card for list views
export const CompactBridgeCard: React.FC<
  Omit<BridgeCardProps, 'showDetails'>
> = (props) => {
  return <BridgeCard {...props} showDetails={false} />
}

// Default export
export default BridgeCard
