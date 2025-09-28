// worker/config.js - Configuration and Constants

export const CONFIG = {
  // Rate limiting and retry settings
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 500,
  REQUEST_TIMEOUT: 10000,

  // Provider settings with modular configuration
  PROVIDERS: {
    LIFI: {
      enabled: true,
      priority: 1,
      requiresAuth: false,
      adapter: "LiFiAdapter",
      rateLimit: { requests: 30, window: 60000 },
    },
    STARGATE: {
      enabled: true,
      priority: 2,
      requiresAuth: false,
      adapter: "StargateAdapter",
      rateLimit: { requests: 100, window: 60000 },
    },
    SOCKET: {
      enabled: true,
      priority: 3,
      requiresAuth: false,
      adapter: "SocketAdapter",
      rateLimit: { requests: 50, window: 60000 },
    },
    SQUID: {
      enabled: true,
      priority: 4,
      requiresAuth: false,
      adapter: "SquidAdapter",
      rateLimit: { requests: 30, window: 60000 },
    },
    RANGO: {
      enabled: true,
      priority: 5,
      requiresAuth: false,
      adapter: "RangoAdapter",
      rateLimit: { requests: 60, window: 60000 },
    },
    XYFINANCE: {
      enabled: true,
      priority: 6,
      requiresAuth: false,
      adapter: "XYFinanceAdapter",
      rateLimit: { requests: 30, window: 60000 },
    },
    RUBIC: {
      enabled: true,
      priority: 7,
      requiresAuth: false,
      adapter: "RubicAdapter",
      rateLimit: { requests: 10, window: 60000 },
    },
    OPENOCEAN: {
      enabled: true,
      priority: 8,
      requiresAuth: false,
      adapter: "OpenOceanAdapter",
      rateLimit: { requests: 30, window: 60000 },
    },
    ZEROX: {
      enabled: true,
      priority: 9,
      requiresAuth: true,
      adapter: "ZeroXAdapter",
      rateLimit: { requests: 100, window: 60000 },
    },
    ONEINCH: {
      enabled: true,
      priority: 10,
      requiresAuth: true,
      adapter: "OneInchAdapter",
      rateLimit: { requests: 30, window: 1000 },
    },
    VIA: {
      enabled: true,
      priority: 11,
      requiresAuth: false,
      adapter: "ViaAdapter",
      rateLimit: { requests: 30, window: 60000 },
    },
    JUMPER: {
      enabled: true,
      priority: 12,
      requiresAuth: false,
      adapter: "JumperAdapter",
      rateLimit: { requests: 30, window: 60000 },
    },
  },

  // Default values for quotes
  DEFAULT_SLIPPAGE: "1",
  DEFAULT_GAS_ESTIMATE: 5,

  // Cache settings
  CACHE_DURATION: 30000, // 30 seconds
};

export const CHAINS = {
  1: { name: "Ethereum", icon: "🔷", native: "ETH", decimals: 18 },
  137: { name: "Polygon", icon: "🟣", native: "MATIC", decimals: 18 },
  42161: { name: "Arbitrum", icon: "🔵", native: "ETH", decimals: 18 },
  10: { name: "Optimism", icon: "🔴", native: "ETH", decimals: 18 },
  56: { name: "BSC", icon: "🟡", native: "BNB", decimals: 18 },
  43114: { name: "Avalanche", icon: "🔺", native: "AVAX", decimals: 18 },
  8453: { name: "Base", icon: "🟦", native: "ETH", decimals: 18 },
  250: { name: "Fantom", icon: "👻", native: "FTM", decimals: 18 },
  100: { name: "Gnosis", icon: "🦉", native: "xDAI", decimals: 18 },
};

export const TOKENS = {
  ETH: {
    address: {
      1: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      42161: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      10: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      56: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      43114: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
      8453: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    },
    decimals: 18,
    symbol: "ETH",
  },
  USDC: {
    address: {
      1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      137: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      10: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      56: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    },
    decimals: 6,
    symbol: "USDC",
  },
  USDT: {
    address: {
      1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      137: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      56: "0x55d398326f99059ff775485246999027b3197955",
      42161: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      10: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
      43114: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
      8453: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",
    },
    decimals: 6,
    symbol: "USDT",
  },
  DAI: {
    address: {
      1: "0x6b175474e89094c44da98b954eedeac495271d0f",
      137: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      42161: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
      10: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
      56: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
      43114: "0xd586e7f844cea2f87f50152665bcbc2c279d8d70",
      8453: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
    },
    decimals: 18,
    symbol: "DAI",
  },
  WETH: {
    address: {
      1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      10: "0x4200000000000000000000000000000000000006",
      56: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      43114: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
      8453: "0x4200000000000000000000000000000000000006",
    },
    decimals: 18,
    symbol: "WETH",
  },
  WBTC: {
    address: {
      1: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      137: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
      42161: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
      10: "0x68f180fcce6836688e9084f035309e29bf0a2095",
      56: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
      43114: "0x50b7545627a5162f82a992c33b87adc75187b218",
      8453: "0x236aa50979d5f3de3bd1eeb40e81137f22ab794b",
    },
    decimals: 8,
    symbol: "WBTC",
  },
};
