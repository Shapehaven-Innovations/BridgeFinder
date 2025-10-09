import { Card } from '@components/Card'
import { Button } from '@components/Button'
import type { ProtocolOption } from '../../types'
import styles from './ProtocolFilter.module.css'

interface ProtocolFilterProps {
  protocols: ProtocolOption[]
  onToggle: (protocol: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  showUnavailable: boolean
  onToggleShowUnavailable: () => void
}

export function ProtocolFilter({
  protocols,
  onToggle,
  onSelectAll,
  onClearAll,
  showUnavailable,
  onToggleShowUnavailable,
}: ProtocolFilterProps) {
  if (protocols.length === 0) {
    return null
  }

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Filter by Protocol</h3>
          <div className={styles.actions}>
            <Button variant="ghost" size="sm" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear All
            </Button>
          </div>
        </div>

        <div className={styles.chips}>
          {protocols.map((protocol) => (
            <label key={protocol.name} className={styles.chip}>
              <input
                type="checkbox"
                checked={protocol.enabled}
                onChange={() => onToggle(protocol.name)}
                className={styles.checkbox}
              />
              <span className={styles.chipLabel}>
                {protocol.name}
                <span className={styles.count}>({protocol.count})</span>
              </span>
            </label>
          ))}
        </div>

        <div className={styles.footer}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showUnavailable}
              onChange={onToggleShowUnavailable}
              className={styles.checkbox}
            />
            <span>Show unavailable routes</span>
          </label>
        </div>
      </div>
    </Card>
  )
}
