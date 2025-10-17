// src/pages/BridgeFinderPage.tsx
import React, { useState } from 'react'
import { Button } from '@components/Button'
import { BridgeCard } from '@/features/bridge-comparison/components/BridgeCard/BridgeCard'
import {
  FilterSort,
  ComparisonSummary,
} from '@/features/bridge-comparison/components/FilterSort/FilterSort'
import { CardSkeletonGrid } from '@components/LoadingSkeleton'
import styles from './BridgeFinderPage.module.css'

export const BridgeFinderPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProtocols, setSelectedProtocols] = useState([
    'li.fi',
    'socket',
  ])
  const [sortBy, setSortBy] = useState<'cost' | 'time' | 'security'>('cost')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Mock data
  const protocols = [
    { id: 'li.fi', name: 'LI.FI', count: 2 },
    { id: 'socket', name: 'Socket/Bungee', count: 1 },
    { id: 'jumper', name: 'Jumper', count: 1 },
  ]

  const bridges = [
    {
      name: 'Socket',
      protocol: 'socket',
      totalCost: 0.01,
      bridgeFee: 0.0,
      gasFee: 0.01,
      time: '1 mins',
      security: 'Multi-Bridge Aggregator',
      liquidity: 'Aggregated',
      route: 'across',
      isBestDeal: true,
      position: 1,
      savings: 0.54,
    },
    {
      name: 'LI.FI',
      protocol: 'li.fi',
      totalCost: 0.55,
      bridgeFee: 0.55,
      gasFee: 0.01,
      time: '1 mins',
      security: 'Unspecified',
      liquidity: 'Unknown',
      route: 'Relay',
      position: 2,
    },
    {
      name: 'Jumper',
      protocol: 'jumper',
      totalCost: 0.75,
      bridgeFee: 0.74,
      gasFee: 0.01,
      time: '2 mins',
      security: 'Multi-Bridge',
      liquidity: 'High',
      route: 'Stargate',
      position: 3,
    },
  ]

  const handleProtocolToggle = (protocolId: string) => {
    setSelectedProtocols((prev) =>
      prev.includes(protocolId)
        ? prev.filter((id) => id !== protocolId)
        : [...prev, protocolId]
    )
  }

  const handleSortChange = (field: 'cost' | 'time' | 'security') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleBridge = (bridgeName: string) => {
    console.log(`Bridging with ${bridgeName}`)
    // Navigate to external bridge URL
  }

  const filteredBridges = bridges.filter((bridge) =>
    selectedProtocols.includes(bridge.protocol)
  )

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroIcon}>🌉</span>
              Find the Best Bridge
            </h1>
            <p className={styles.heroSubtitle}>
              Compare cross-chain bridge routes across 12+ providers to find the
              best rates and fastest transfers for your crypto assets.
            </p>
          </div>
        </section>

        {/* Comparison Form - You would import your BridgeForm here */}
        <section className={styles.section}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Compare Bridge Routes</h2>
            {/* Your BridgeForm component would go here */}
            <div className={styles.placeholder}>
              <p className={styles.placeholderText}>Form goes here</p>
              <Button
                variant="primary-gradient"
                size="lg"
                onClick={() => setIsLoading(!isLoading)}
              >
                {isLoading ? 'Comparing...' : 'Compare Routes'}
              </Button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {(isLoading || filteredBridges.length > 0) && (
          <>
            <section className={styles.section}>
              <ComparisonSummary
                bestPrice={0.01}
                averagePrice={0.37}
                highestPrice={0.75}
                availableRoutes={3}
                updatedAt={new Date()}
              />
            </section>

            <section className={styles.section}>
              <FilterSort
                protocols={protocols}
                selectedProtocols={selectedProtocols}
                onProtocolToggle={handleProtocolToggle}
                onSelectAll={() =>
                  setSelectedProtocols(protocols.map((p) => p.id))
                }
                onClearAll={() => setSelectedProtocols([])}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            </section>

            <section className={styles.section}>
              {isLoading ? (
                <CardSkeletonGrid count={3} />
              ) : (
                <div className={styles.bridgeGrid}>
                  {filteredBridges.map((bridge, index) => (
                    <BridgeCard
                      key={`${bridge.protocol}-${index}`}
                      {...bridge}
                      onBridge={() => handleBridge(bridge.name)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Empty State */}
        {!isLoading && filteredBridges.length === 0 && (
          <section className={styles.section}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🌉</div>
              <h3 className={styles.emptyTitle}>No routes found</h3>
              <p className={styles.emptyText}>
                Try adjusting your filters or selecting different chains to find
                available bridge routes.
              </p>
              <Button
                variant="primary"
                onClick={() => setSelectedProtocols(protocols.map((p) => p.id))}
              >
                Reset Filters
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
