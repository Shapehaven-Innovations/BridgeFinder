import { useState } from 'react'
import { Header } from '@components/Header'
import { Modal } from '@components/Modal'
import { Button } from '@components/Button'
import { ToastContainer, useToast } from '@components/Toast'
import { BridgeForm } from '@/features/bridge-comparison/components/BridgeForm'
import { BridgeList } from '@/features/bridge-comparison/components/BridgeList'
import { StatsGrid } from '@/features/bridge-comparison/components/StatsGrid'
import { ProtocolFilter } from '@/features/bridge-comparison/components/ProtocolFilter'
import { useBridgeComparison } from '@/features/bridge-comparison/hooks/useBridgeComparison'
import { useProtocolFilter } from '@/features/bridge-comparison/hooks/useProtocolFilter'
import { useSortResults } from '@/features/bridge-comparison/hooks/useSortResults'
import { getSlippage, setSlippage } from '@/lib/storage'
import { getRelativeTime } from '@/lib/dates'
import type { ComparisonParams } from '@/api/types'
import type {
  BridgeWithPosition,
  SortField,
} from '@/features/bridge-comparison/types'
import styles from './HomePage.module.css'

export function HomePage() {
  const [showSettings, setShowSettings] = useState(false)
  const [slippageInput, setSlippageInput] = useState(getSlippage())
  const { toasts, removeToast, success } = useToast()

  const {
    result,
    isLoading,
    isError,
    error: apiError,
    compare,
  } = useBridgeComparison()

  const bridges = result?.bridges || []

  const {
    filteredBridges,
    protocolOptions,
    showUnavailable,
    toggleProtocol,
    selectAll,
    clearAll,
    toggleShowUnavailable,
  } = useProtocolFilter(bridges)

  const { sortedBridges, sortField, sortOrder, setSorting, toggleSortOrder } =
    useSortResults(filteredBridges)

  const handleCompare = (params: ComparisonParams) => {
    compare(params)
  }

  const handleSaveSettings = () => {
    setSlippage(slippageInput)
    setShowSettings(false)
    success('Settings saved successfully')
  }

  const handleBridgeSelect = (bridge: BridgeWithPosition) => {
    window.open(bridge.url, '_blank', 'noopener,noreferrer')
  }

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      toggleSortOrder()
    } else {
      setSorting(field, 'asc')
    }
  }

  return (
    <>
      <div className={styles.page}>
        <Header onSettingsOpen={() => setShowSettings(true)} />

        <main className={styles.main}>
          <div className={styles.container}>
            <section className={styles.formSection}>
              <BridgeForm onSubmit={handleCompare} isLoading={isLoading} />
            </section>

            {isError && apiError && (
              <div className={styles.errorBanner}>
                <span className={styles.errorIcon}>⚠️</span>
                <div className={styles.errorContent}>
                  <h3 className={styles.errorTitle}>Comparison Failed</h3>
                  <p className={styles.errorMessage}>
                    {apiError.message || 'Unable to compare bridge routes'}
                  </p>
                  {apiError.details && (
                    <p className={styles.errorDetails}>{apiError.details}</p>
                  )}
                </div>
              </div>
            )}

            {result && (
              <>
                <section className={styles.resultsHeader}>
                  <div className={styles.resultsTitle}>
                    <h2>Comparison Results</h2>
                    <span className={styles.timestamp}>
                      Updated {getRelativeTime(result.timestamp)}
                    </span>
                  </div>
                  <div className={styles.sortControls}>
                    <span className={styles.sortLabel}>Sort by:</span>
                    <Button
                      variant={sortField === 'cost' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange('cost')}
                    >
                      Cost{' '}
                      {sortField === 'cost' &&
                        (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button
                      variant={sortField === 'time' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange('time')}
                    >
                      Time{' '}
                      {sortField === 'time' &&
                        (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button
                      variant={sortField === 'security' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange('security')}
                    >
                      Security{' '}
                      {sortField === 'security' &&
                        (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                </section>

                <section className={styles.statsSection}>
                  <StatsGrid summary={result.summary} />
                </section>

                {protocolOptions.length > 0 && (
                  <section className={styles.filterSection}>
                    <ProtocolFilter
                      protocols={protocolOptions}
                      onToggle={toggleProtocol}
                      onSelectAll={selectAll}
                      onClearAll={clearAll}
                      showUnavailable={showUnavailable}
                      onToggleShowUnavailable={toggleShowUnavailable}
                    />
                  </section>
                )}

                <section className={styles.resultsSection}>
                  <BridgeList
                    bridges={sortedBridges}
                    onBridgeSelect={handleBridgeSelect}
                  />
                </section>
              </>
            )}

            {!result && !isLoading && (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>🌉</div>
                <h2 className={styles.placeholderTitle}>
                  Ready to Find the Best Bridge?
                </h2>
                <p className={styles.placeholderText}>
                  Select your chains and token above to compare routes across
                  multiple bridge providers and find the best deal.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
        size="md"
      >
        <div className={styles.settings}>
          <div className={styles.settingGroup}>
            <label htmlFor="slippage" className={styles.settingLabel}>
              Slippage Tolerance (%)
            </label>
            <input
              id="slippage"
              type="number"
              min="0.1"
              max="50"
              step="0.1"
              value={slippageInput}
              onChange={(e) => setSlippageInput(e.target.value)}
              className={styles.settingInput}
            />
            <p className={styles.settingHint}>
              Lower values reduce slippage risk but may cause transactions to
              fail.
            </p>
          </div>

          <div className={styles.settingGroup}>
            <h4 className={styles.settingSubtitle}>About</h4>
            <p className={styles.settingText}>
              Settings are stored locally in your browser and will persist
              across sessions.
            </p>
          </div>

          <div className={styles.settingsActions}>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
