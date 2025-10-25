import React, { useState } from 'react'
import { Card } from '@components/Card'
import { Button } from '@components/Button'
import type { ComparisonParams } from '@/api/types'
import styles from './BridgeForm.module.css'

const CHAINS = [
  { id: 1, name: 'Ethereum', icon: '🔷' },
  { id: 137, name: 'Polygon', icon: '🟣' },
  { id: 42161, name: 'Arbitrum', icon: '🔵' },
  { id: 10, name: 'Optimism', icon: '🔴' },
  { id: 56, name: 'BSC', icon: '🟡' },
  { id: 43114, name: 'Avalanche', icon: '🔺' },
  { id: 8453, name: 'Base', icon: '🟦' },
]

const TOKENS = ['USDC', 'USDT', 'ETH', 'DAI', 'WETH', 'WBTC']

interface BridgeFormProps {
  onSubmit: (params: ComparisonParams) => void
  isLoading: boolean
}

export const BridgeForm: React.FC<BridgeFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [fromChain, setFromChain] = useState(137)
  const [toChain, setToChain] = useState(42161)
  const [token, setToken] = useState('USDC')
  const [amount, setAmount] = useState('100')
  const [slippage, setSlippage] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (fromChain === toChain) {
      alert('Source and destination chains must be different')
      return
    }

    onSubmit({
      fromChainId: fromChain,
      toChainId: toChain,
      token,
      amount,
      slippage: (slippage / 100).toFixed(4),
    })
  }

  const handleSwapChains = () => {
    const temp = fromChain
    setFromChain(toChain)
    setToChain(temp)
  }

  return (
    <Card variant="elevated" padding="lg">
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Compare Bridge Routes</h2>

        <div className={styles.chainSection}>
          <div className={styles.chainGroup}>
            <label htmlFor="fromChain" className={styles.label}>
              From Chain
            </label>
            <select
              id="fromChain"
              value={fromChain}
              onChange={(e) => setFromChain(Number(e.target.value))}
              className={styles.select}
              disabled={isLoading}
            >
              {CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapChains}
            className={styles.swapButton}
            disabled={isLoading}
            aria-label="Swap chains"
          >
            ⇄
          </button>

          <div className={styles.chainGroup}>
            <label htmlFor="toChain" className={styles.label}>
              To Chain
            </label>
            <select
              id="toChain"
              value={toChain}
              onChange={(e) => setToChain(Number(e.target.value))}
              className={styles.select}
              disabled={isLoading}
            >
              {CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="token" className={styles.label}>
            Token
          </label>
          <select
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={styles.select}
            disabled={isLoading}
          >
            {TOKENS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="amount" className={styles.label}>
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={styles.input}
            placeholder="Enter amount"
            disabled={isLoading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="slippage" className={styles.label}>
            Slippage Tolerance: {slippage}%
          </label>
          <input
            id="slippage"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            className={styles.slider}
            disabled={isLoading}
          />
          <div className={styles.slippageHint}>
            <span>0.1%</span>
            <span>5%</span>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Comparing Routes...' : 'Compare Routes'}
        </Button>
      </form>
    </Card>
  )
}
