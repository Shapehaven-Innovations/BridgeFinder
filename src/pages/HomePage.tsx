// src/pages/HomePage.tsx
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
import { getSlippage, setSlippage as saveSlippage } from '@/lib/storage'
import { getRelativeTime } from '@/lib/dates'
import type { ComparisonParams } from '@/api/types'
import type {
  BridgeWithPosition,
  SortField,
} from '@/features/bridge-comparison/types'
import styles from './HomePage.module.css'

export function HomePage() {
  const { success, error, toasts, removeToast } = useToast()
  const [showSettings, setShowSettings] = useState(false)
  const [localSlippage, setLocalSlippage] = useState(() => {
    const slippage = getSlippage()
    return slippage < 1 ? slippage * 100 : slippage
  })

  const {
    result,
    isLoading,
    isError,
    error: comparisonError,
    compare,
  } = useBridgeComparison()

  const bridges = result?.bridges || []

  const {
    filteredBridges,
    protocolOptions,
    showUnavailable,
    toggleProtocol,
    selectAll: selectAllProtocols,
    clearAll: clearAllProtocols,
    toggleShowUnavailable,
  } = useProtocolFilter(bridges)

  const { sortedBridges, sortField, sortOrder, setSorting, toggleSortOrder } =
    useSortResults(filteredBridges)

  const handleCompare = async (params: ComparisonParams) => {
    try {
      compare(params)
    } catch (err) {
      error('Failed to compare bridge routes. Please try again.')
    }
  }

  const handleSaveSettings = () => {
    const slippageValue =
      localSlippage > 1 ? localSlippage / 100 : localSlippage
    saveSlippage(slippageValue)
    setShowSettings(false)
    success('Settings saved successfully!')
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      toggleSortOrder()
    } else {
      setSorting(field, 'asc')
    }
  }

  return (
    <>
      <div className={styles.page}>
        <Header />

        <main className={styles.main}>
          <div className={styles.container}>
            <section className={styles.formSection}>
              <BridgeForm onSubmit={handleCompare} isLoading={isLoading} />
            </section>

            {isError && comparisonError && (
              <div className={styles.errorBanner}>
                <span className={styles.errorIcon}>⚠️</span>
                <div className={styles.errorContent}>
                  <h3 className={styles.errorTitle}>Comparison Failed</h3>
                  <p className={styles.errorMessage}>
                    {comparisonError.message || 'Unable to fetch bridge routes'}
                  </p>
                  {comparisonError.details && (
                    <p className={styles.errorDetails}>
                      {comparisonError.details}
                    </p>
                  )}
                </div>
              </div>
            )}

            {result && (
              <section className={styles.statsSection}>
                <StatsGrid summary={result.summary} />
              </section>
            )}

            {result && result.bridges.length > 0 && (
              <section className={styles.filterSection}>
                <ProtocolFilter
                  protocols={protocolOptions}
                  onToggle={toggleProtocol}
                  onSelectAll={selectAllProtocols}
                  onClearAll={clearAllProtocols}
                  showUnavailable={showUnavailable}
                  onToggleShowUnavailable={toggleShowUnavailable}
                />
              </section>
            )}

            {result && (
              <section className={styles.resultsSection}>
                <div className={styles.resultsHeader}>
                  <div className={styles.resultsTitle}>
                    <h2>Bridge Routes</h2>
                    <p className={styles.timestamp}>
                      Updated {getRelativeTime(result.timestamp)}
                    </p>
                  </div>
                  <div className={styles.sortControls}>
                    <span className={styles.sortLabel}>Sort by:</span>
                    {(['cost', 'time', 'security'] as SortField[]).map(
                      (field) => (
                        <Button
                          key={field}
                          variant={sortField === field ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handleSort(field)}
                        >
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                          {sortField === field &&
                            (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <BridgeList bridges={sortedBridges} />
              </section>
            )}

            {!isLoading && !result && (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>🌉</div>
                <h2 className={styles.placeholderTitle}>
                  Ready to Find Your Perfect Bridge?
                </h2>
                <p className={styles.placeholderText}>
                  Enter your transfer details above to compare bridge routes and
                  find the best rates across multiple providers.
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
        <div className={styles.settingsContent}>
          <div className={styles.settingGroup}>
            <label htmlFor="slippage" className={styles.settingLabel}>
              Max Slippage Tolerance
            </label>
            <div className={styles.slippageInput}>
              <input
                id="slippage"
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={localSlippage}
                onChange={(e) =>
                  setLocalSlippage(parseFloat(e.target.value) || 0)
                }
                className={styles.input}
              />
              <span className={styles.slippagePercent}>%</span>
            </div>
            <p className={styles.settingHelp}>
              Your transaction will revert if the price changes unfavorably by
              more than this percentage.
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
