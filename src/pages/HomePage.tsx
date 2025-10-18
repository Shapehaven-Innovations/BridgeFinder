// src/pages/HomePage.tsx
import { useState } from 'react'
import { Header } from '../components/Header'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { ToastContainer, useToast } from '../components/Toast'
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
import type { SortField } from '@/features/bridge-comparison/types'
import styles from './HomePage.module.css'

export function HomePage() {
  const { success, error, toasts, removeToast } = useToast()
  const [showSettings, setShowSettings] = useState(false)
  const [localSlippage, setLocalSlippage] = useState(() => {
    const slippage = getSlippage()
    const numericSlippage = Number(slippage)
    return numericSlippage < 1 ? numericSlippage * 100 : numericSlippage
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
    saveSlippage(String(slippageValue))
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
            {/* Form Section */}
            <section className={styles.formSection}>
              <BridgeForm onSubmit={handleCompare} isLoading={isLoading} />
            </section>

            {/* Error Banner */}
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

            {/* Stats Grid - WITH DEFENSIVE CHECK */}
            {result && result.summary && (
              <section className={styles.statsSection}>
                <StatsGrid
                  summary={{
                    ...result.summary,
                    availableRoutes: Array.isArray(result.bridges)
                      ? result.bridges.length
                      : 0,
                  }}
                />
              </section>
            )}

            {/* Protocol Filter */}
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

            {/* Results Section */}
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
                          {sortField === field && (
                            <span className={styles.sortIcon}>
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <BridgeList bridges={sortedBridges} />
              </section>
            )}

            {/* Empty State */}
            {!isLoading && result && sortedBridges.length === 0 && (
              <section className={styles.section}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🌉</div>
                  <h3 className={styles.emptyTitle}>No routes found</h3>
                  <p className={styles.emptyText}>
                    Try adjusting your filters or selecting different chains to
                    find available bridge routes.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => selectAllProtocols()}
                  >
                    Reset Filters
                  </Button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
        size="md"
      >
        <div className={styles.settingsContent}>
          <div className={styles.settingGroup}>
            <h4 className={styles.settingSubtitle}>Slippage Tolerance</h4>
            <p className={styles.settingText}>
              Set your maximum acceptable slippage percentage
            </p>
            <div className={styles.slippageControl}>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={localSlippage}
                onChange={(e) => setLocalSlippage(Number(e.target.value))}
                className={styles.slippageSlider}
              />
              <span className={styles.slippageValue}>{localSlippage}%</span>
            </div>
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
