// src/utils/constants.ts
export const CHAINS = {
  ETHEREUM: { id: 1, name: 'Ethereum', icon: '⟠' },
  POLYGON: { id: 137, name: 'Polygon', icon: '⬡' },
  ARBITRUM: { id: 42161, name: 'Arbitrum', icon: '◆' },
  OPTIMISM: { id: 10, name: 'Optimism', icon: '🔴' },
  BSC: { id: 56, name: 'BNB Chain', icon: '◆' },
  AVALANCHE: { id: 43114, name: 'Avalanche', icon: '🔺' },
} as const

export const TOKENS = ['USDC', 'USDT', 'DAI', 'ETH', 'WBTC'] as const

export const BRIDGE_PROTOCOLS = {
  SOCKET: { id: 'socket', name: 'Socket', color: '#8B5CF6' },
  LIFI: { id: 'li.fi', name: 'LI.FI', color: '#3B82F6' },
  JUMPER: { id: 'jumper', name: 'Jumper', color: '#10B981' },
  STARGATE: { id: 'stargate', name: 'Stargate', color: '#F59E0B' },
} as const
