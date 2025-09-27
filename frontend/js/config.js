// frontend/js/config.js - Enhanced Configuration

export const Config = {
  // Use your Cloudflare Worker URL
  apiUrl: "https://bridge-aggregator-api.shapehaveninnovations.workers.dev",

  chains: {
    1: { name: "Ethereum", icon: "🔷", chainId: "0x1" },
    137: { name: "Polygon", icon: "🟣", chainId: "0x89" },
    42161: { name: "Arbitrum", icon: "🔵", chainId: "0xa4b1" },
    10: { name: "Optimism", icon: "🔴", chainId: "0xa" },
    56: { name: "BSC", icon: "🟡", chainId: "0x38" },
    43114: { name: "Avalanche", icon: "🔺", chainId: "0xa86a" },
    8453: { name: "Base", icon: "🟦", chainId: "0x2105" },
    250: { name: "Fantom", icon: "👻", chainId: "0xfa" },
    100: { name: "Gnosis", icon: "🦉", chainId: "0x64" },
  },

  tokens: ["ETH", "USDC", "USDT", "DAI", "WETH", "WBTC"],

  protocols: [
    "LI.FI",
    "Stargate",
    "Socket",
    "Squid",
    "Rango",
    "XY Finance",
    "Rubic",
    "OpenOcean",
    "0x",
    "1inch",
    "Via Protocol",
    "Jumper",
  ],

  features: {
    enableAnalytics: true,
    enablePriceAlerts: true,
    enableProtocolFilter: true,
    enableComparisonChart: true,
    cacheTimeout: 60000, // 1 minute
    maxResults: 20,
  },

  defaultSettings: {
    slippage: 1,
    priceAlertThreshold: 10,
    debugMode: false,
  },
};
