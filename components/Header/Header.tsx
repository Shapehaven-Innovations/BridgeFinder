import React, { useState } from 'react'
import { Button } from '../Button/Button'
import { Modal } from '../Modal/Modal'
import styles from './Header.module.css'

export const Header: React.FC = () => {
  const [showAbout, setShowAbout] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <h1 className={styles.title}>
              <span className={styles.icon}>🌉</span>
              BridgeFinder
            </h1>
            <p className={styles.subtitle}>
              Compare cross-chain bridge routes and find the best rates
            </p>
          </div>
          <nav className={styles.nav}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAbout(true)}
            >
              About
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <Modal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        title="About BridgeFinder"
        size="md"
      >
        <div className={styles.aboutContent}>
          <p>
            BridgeFinder helps you compare cross-chain bridge routes across
            multiple providers to find the best rates and fastest transfers for
            your crypto assets.
          </p>
          <div className={styles.features}>
            <h3>Features</h3>
            <ul>
              <li>Real-time comparison across 12+ bridge providers</li>
              <li>Support for major chains and tokens</li>
              <li>Transparent fee breakdown</li>
              <li>Security and liquidity ratings</li>
              <li>Direct links to execute transfers</li>
            </ul>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Settings"
        size="md"
      >
        <div className={styles.settingsContent}>
          <p className={styles.settingText}>
            Settings and preferences will be available in a future update.
          </p>
        </div>
      </Modal>
    </>
  )
}
