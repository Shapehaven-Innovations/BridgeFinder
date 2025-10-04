// frontend/js/config.js - Enhanced Configuration
export const Config = {
  // Use your Cloudflare Worker URL
  apiUrl: "https://bridge-aggregator-api.shapehaveninnovations.workers.dev",

  chains: {
    // Layer 1 Blockchains
    1: {
      name: "Ethereum",
      icon: "🔷",
      chainId: "0x1",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://etherscan.io",
      type: "L1",
    },
    56: {
      name: "BNB Chain",
      icon: "🟡",
      chainId: "0x38",
      nativeToken: "BNB",
      decimals: 18,
      explorer: "https://bscscan.com",
      type: "L1",
    },
    137: {
      name: "Polygon",
      icon: "🟣",
      chainId: "0x89",
      nativeToken: "POL",
      decimals: 18,
      explorer: "https://polygonscan.com",
      type: "Sidechain",
    },
    43114: {
      name: "Avalanche",
      icon: "🔺",
      chainId: "0xa86a",
      nativeToken: "AVAX",
      decimals: 18,
      explorer: "https://snowtrace.io",
      type: "L1",
    },
    250: {
      name: "Fantom",
      icon: "👻",
      chainId: "0xfa",
      nativeToken: "FTM",
      decimals: 18,
      explorer: "https://ftmscan.com",
      type: "L1",
    },
    100: {
      name: "Gnosis",
      icon: "🦉",
      chainId: "0x64",
      nativeToken: "xDAI",
      decimals: 18,
      explorer: "https://gnosisscan.io",
      type: "Sidechain",
    },
    42220: {
      name: "Celo",
      icon: "🌱",
      chainId: "0xa4ec",
      nativeToken: "CELO",
      decimals: 18,
      explorer: "https://celoscan.io",
      type: "L1",
    },

    // Ethereum Layer 2s (Optimistic Rollups)
    42161: {
      name: "Arbitrum",
      icon: "🔵",
      chainId: "0xa4b1",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://arbiscan.io",
      type: "L2 Optimistic",
    },
    10: {
      name: "Optimism",
      icon: "🔴",
      chainId: "0xa",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://optimistic.etherscan.io",
      type: "L2 Optimistic",
    },
    8453: {
      name: "Base",
      icon: "🟦",
      chainId: "0x2105",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://basescan.org",
      type: "L2 Optimistic",
    },
    81457: {
      name: "Blast",
      icon: "💥",
      chainId: "0x13e31",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://blastscan.io",
      type: "L2 Optimistic",
    },

    // Ethereum Layer 2s (ZK Rollups)
    324: {
      name: "zkSync Era",
      icon: "⚡",
      chainId: "0x144",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://explorer.zksync.io",
      type: "L2 ZK",
    },
    59144: {
      name: "Linea",
      icon: "🌐",
      chainId: "0xe708",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://lineascan.build",
      type: "L2 ZK",
    },
    534352: {
      name: "Scroll",
      icon: "📜",
      chainId: "0x82750",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://scrollscan.com",
      type: "L2 ZK",
    },
    1101: {
      name: "Polygon zkEVM",
      icon: "🟪",
      chainId: "0x44d",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://zkevm.polygonscan.com",
      type: "L2 ZK",
    },
    5000: {
      name: "Mantle",
      icon: "🔷",
      chainId: "0x1388",
      nativeToken: "MNT",
      decimals: 18,
      explorer: "https://explorer.mantle.xyz",
      type: "L2 Optimistic",
    },

    // Other L2s
    7777777: {
      name: "Zora",
      icon: "⚫",
      chainId: "0x76adf1",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://explorer.zora.energy",
      type: "L2 Optimistic",
    },
    34443: {
      name: "Mode",
      icon: "🟢",
      chainId: "0x868b",
      nativeToken: "ETH",
      decimals: 18,
      explorer: "https://explorer.mode.network",
      type: "L2 Optimistic",
    },
  },

  // Tokens sorted by bridge volume
  tokens: [
    // Stablecoins (most bridged)
    "USDC",
    "USDT",
    "DAI",
    "USDC.e", // Bridged USDC on some chains

    // Native/Wrapped
    "ETH",
    "WETH",
    "WBTC",

    // Major DeFi (optional, lower volume)
    "UNI",
    "LINK",
    "AAVE",
  ],

  // Only cross-chain bridge protocols (removed DEX aggregators)
  protocols: [
    // Meta-Aggregators (use multiple bridges)
    { name: "Socket", type: "meta", working: true },
    { name: "LI.FI", type: "meta", working: true },
    { name: "Jumper", type: "meta", working: true },
    { name: "Rango", type: "meta", working: false, reason: "Needs API key" },

    // Direct Bridges
    { name: "Across", type: "direct", working: true },
    {
      name: "XY Finance",
      type: "direct",
      working: true,
      note: "Bridge fee only",
    },
    {
      name: "Stargate",
      type: "direct",
      working: false,
      reason: "Cloudflare blocked",
    },
    { name: "Hop Protocol", type: "direct", working: false, note: "Add next" },
    { name: "Synapse", type: "direct", working: false, note: "Add next" },
    { name: "Celer cBridge", type: "direct", working: false, note: "Consider" },

    // Currently Down (consider removing)
    { name: "Squid", type: "direct", working: false, reason: "Service down" },
    {
      name: "Rubic",
      type: "direct",
      working: false,
      reason: "Service unstable",
    },
  ],

  // Token metadata for calculations
  tokenInfo: {
    ETH: { decimals: 18, type: "native", priceStable: false },
    WETH: { decimals: 18, type: "wrapped", priceStable: false },
    USDC: { decimals: 6, type: "stablecoin", priceStable: true },
    "USDC.e": { decimals: 6, type: "stablecoin", priceStable: true },
    USDT: { decimals: 6, type: "stablecoin", priceStable: true },
    DAI: { decimals: 18, type: "stablecoin", priceStable: true },
    WBTC: { decimals: 8, type: "wrapped", priceStable: false },
    UNI: { decimals: 18, type: "governance", priceStable: false },
    LINK: { decimals: 18, type: "utility", priceStable: false },
    AAVE: { decimals: 18, type: "governance", priceStable: false },
  },

  // Feature flags
  features: {
    enableAnalytics: true,
    enablePriceAlerts: true,
    enableProtocolFilter: true,
    enableComparisonChart: true,
    showGasWarnings: true, // Show warnings when gas not included
    showChainType: true, // Show L1/L2/ZK labels
    cacheTimeout: 60000, // 1 minute
    maxResults: 20,
  },

  // Default user settings
  defaultSettings: {
    slippage: 1, // 1% slippage tolerance
    priceAlertThreshold: 10, // 10% price difference alert
    debugMode: false,
    showTestnets: false,
    preferredChains: [1, 137, 42161, 10, 8453], // Most popular
  },

  // UI display settings
  display: {
    sortBy: "cost", // cost, time, or rating
    showUnavailable: true,
    groupByProtocol: false,
    compactMode: false,
  },

  // Gas price estimation (for display only)
  gasEstimates: {
    1: { avg: 25, unit: "gwei", native: "ETH" }, // Ethereum
    137: { avg: 30, unit: "gwei", native: "POL" }, // Polygon
    42161: { avg: 0.1, unit: "gwei", native: "ETH" }, // Arbitrum
    10: { avg: 0.001, unit: "gwei", native: "ETH" }, // Optimism
    56: { avg: 3, unit: "gwei", native: "BNB" }, // BSC
    8453: { avg: 0.001, unit: "gwei", native: "ETH" }, // Base
  },

  // External resources
  externalLinks: {
    gasTrackers: {
      1: "https://etherscan.io/gastracker",
      137: "https://polygonscan.com/gastracker",
      42161: "https://arbiscan.io/gastracker",
      10: "https://optimistic.etherscan.io/gastracker",
      56: "https://bscscan.com/gastracker",
      8453: "https://basescan.org/gastracker",
    },
    documentation: "https://docs.yoursite.com",
    support: "https://support.yoursite.com",
  },

  // Version
  version: "5.0",
};

// Helper function to get working protocols only
export function getWorkingProtocols() {
  return Config.protocols.filter((p) => p.working);
}

// Helper function to get chain info
export function getChainInfo(chainId) {
  return Config.chains[chainId] || null;
}

// Helper function to get token decimals
export function getTokenDecimals(token) {
  return Config.tokenInfo[token]?.decimals || 18;
}

// Helper function to check if token is stablecoin
export function isStablecoin(token) {
  return Config.tokenInfo[token]?.priceStable === true;
}
