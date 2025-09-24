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
  },

  tokens: ["ETH", "USDC", "USDT", "DAI", "WETH", "WBTC"],

  features: {
    enableAnalytics: true,
    enablePriceAlerts: true,
    cacheTimeout: 60000, // 1 minute
  },
};
