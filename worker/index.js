// worker/index.js - Complete Bridge Aggregator API with Monetization

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const CHAINS = {
  1: {
    name: "Ethereum",
    icon: "🔷",
    native: "ETH",
    lifiId: 1,
    socketId: 1,
    decimals: 18,
  },
  137: {
    name: "Polygon",
    icon: "🟣",
    native: "MATIC",
    lifiId: 137,
    socketId: 137,
    decimals: 18,
  },
  42161: {
    name: "Arbitrum",
    icon: "🔵",
    native: "ETH",
    lifiId: 42161,
    socketId: 42161,
    decimals: 18,
  },
  10: {
    name: "Optimism",
    icon: "🔴",
    native: "ETH",
    lifiId: 10,
    socketId: 10,
    decimals: 18,
  },
  56: {
    name: "BSC",
    icon: "🟡",
    native: "BNB",
    lifiId: 56,
    socketId: 56,
    decimals: 18,
  },
  43114: {
    name: "Avalanche",
    icon: "🔺",
    native: "AVAX",
    lifiId: 43114,
    socketId: 43114,
    decimals: 18,
  },
  8453: {
    name: "Base",
    icon: "🟦",
    native: "ETH",
    lifiId: 8453,
    socketId: 8453,
    decimals: 18,
  },
};

const TOKENS = {
  ETH: {
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    symbol: "ETH",
  },
  USDC: {
    address: {
      1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      137: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      10: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
      default: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    },
    decimals: 6,
    symbol: "USDC",
  },
  USDT: {
    address: {
      1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      137: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      default: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    decimals: 6,
    symbol: "USDT",
  },
  DAI: {
    address: {
      1: "0x6b175474e89094c44da98b954eedeac495271d0f",
      137: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      default: "0x6b175474e89094c44da98b954eedeac495271d0f",
    },
    decimals: 18,
    symbol: "DAI",
  },
  WETH: {
    address: {
      1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      default: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    },
    decimals: 18,
    symbol: "WETH",
  },
  WBTC: {
    address: {
      1: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      default: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    },
    decimals: 8,
    symbol: "WBTC",
  },
};

const API_CONFIG = {
  LIFI: {
    url: "https://li.quest/v1/quote",
    name: "LI.FI",
    icon: "🔷",
    priority: 1,
  },
  SOCKET: {
    url: "https://api.socket.tech/v2/quote",
    name: "Socket",
    icon: "🔌",
    priority: 2,
  },
  ZEROX: {
    url: "https://api.0x.org/swap/v1/quote",
    name: "0x",
    icon: "0️⃣",
    priority: 3,
  },
  ONEINCH: {
    url: "https://api.1inch.exchange/v5.0",
    name: "1inch",
    icon: "🦄",
    priority: 4,
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Content-Type": "application/json",
};

// ============================================
// MAIN WORKER HANDLER
// ============================================

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case "/api/compare":
          if (request.method === "POST") {
            return await handleCompare(request, env, corsHeaders);
          }
          break;
        case "/api/status":
          if (request.method === "GET") {
            return handleStatus(env, corsHeaders);
          }
          break;
        case "/api/chains":
          if (request.method === "GET") {
            return handleChains(corsHeaders);
          }
          break;
        case "/api/tokens":
          if (request.method === "GET") {
            return handleTokens(corsHeaders);
          }
          break;
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: env.ENVIRONMENT === "staging" ? error.message : undefined,
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

// ============================================
// MAIN COMPARE HANDLER
// ============================================

async function handleCompare(request, env, headers) {
  try {
    const body = await request.json();
    const { fromChainId, toChainId, token, amount } = body;

    // Validation
    if (!fromChainId || !toChainId || !token || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers }
      );
    }

    if (fromChainId === toChainId) {
      return new Response(
        JSON.stringify({ error: "Source and destination must be different" }),
        { status: 400, headers }
      );
    }

    // Fetch quotes from all providers
    const quotePromises = [];

    if (env.LIFI_API_KEY) {
      quotePromises.push(
        fetchLiFiQuote(fromChainId, toChainId, token, amount, env)
      );
    }

    if (env.SOCKET_API_KEY) {
      quotePromises.push(
        fetchSocketQuote(fromChainId, toChainId, token, amount, env)
      );
    }

    if (env.ZEROX_API_KEY) {
      quotePromises.push(
        fetch0xQuote(fromChainId, toChainId, token, amount, env)
      );
    }

    if (env.ONE_INCH_API_KEY) {
      quotePromises.push(
        fetch1inchQuote(fromChainId, toChainId, token, amount, env)
      );
    }

    // Use mock data if no API keys configured
    if (quotePromises.length === 0) {
      console.log("No API keys configured, using mock data");
      return new Response(
        JSON.stringify({
          success: true,
          bridges: generateMockBridges(amount),
          timestamp: new Date().toISOString(),
          notice: "Demo mode - Configure API keys for real quotes",
        }),
        { headers }
      );
    }

    const quotes = await Promise.allSettled(quotePromises);

    const bridges = quotes
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value)
      .filter((bridge) => bridge !== null && bridge.totalCost > 0)
      .sort((a, b) => a.totalCost - b.totalCost);

    // Fallback to mock if all APIs fail
    if (bridges.length === 0) {
      console.log("All API calls failed, using mock data");
      return new Response(
        JSON.stringify({
          success: true,
          bridges: generateMockBridges(amount),
          timestamp: new Date().toISOString(),
          notice: "Real-time quotes unavailable - showing estimated costs",
        }),
        { headers }
      );
    }

    // Add referral links
    const bridgesWithReferral = bridges.map((bridge) => ({
      ...bridge,
      url: generateReferralUrl(bridge, env),
      saveAmount: bridges[bridges.length - 1].totalCost - bridge.totalCost,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        bridges: bridgesWithReferral,
        timestamp: new Date().toISOString(),
        totalProviders: quotes.length,
        successfulQuotes: bridges.length,
      }),
      { headers }
    );
  } catch (error) {
    console.error("Compare error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to compare bridges",
        details: env.ENVIRONMENT === "staging" ? error.message : undefined,
      }),
      { status: 500, headers }
    );
  }
}

// ============================================
// BRIDGE PROVIDER INTEGRATIONS
// ============================================

async function fetchLiFiQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token] || TOKENS["USDC"];
    const tokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address.default
        : tokenConfig.address;

    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    const params = new URLSearchParams({
      fromChain: CHAINS[fromChainId]?.lifiId || fromChainId,
      toChain: CHAINS[toChainId]?.lifiId || toChainId,
      fromToken: tokenAddress,
      toToken: tokenAddress,
      fromAmount: amountInWei,
      slippage: "0.005",
      integrator: env.INTEGRATOR_NAME,
      fee: env.FEE_PERCENTAGE,
      referrer: env.FEE_RECEIVER_ADDRESS,
    });

    const response = await fetch(`${API_CONFIG.LIFI.url}?${params}`, {
      headers: {
        Accept: "application/json",
        "x-lifi-api-key": env.LIFI_API_KEY || "",
      },
    });

    if (!response.ok) {
      console.error("LI.FI error:", response.status);
      return null;
    }

    const data = await response.json();
    const gasCostUSD = parseFloat(data.estimate?.gasCosts?.usd || "3");
    const feeCostUSD = parseFloat(data.estimate?.feeCosts?.usd || "2");

    return {
      name: API_CONFIG.LIFI.name,
      icon: API_CONFIG.LIFI.icon,
      provider: "lifi",
      totalCost: gasCostUSD + feeCostUSD,
      bridgeFee: feeCostUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil(
        (data.estimate?.executionDuration || 300) / 60
      )} mins`,
      security: "Audited",
      liquidity: "High",
      route: "Best Route",
    };
  } catch (error) {
    console.error("LI.FI fetch error:", error);
    return null;
  }
}

async function fetchSocketQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token] || TOKENS["USDC"];
    const tokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address.default
        : tokenConfig.address;

    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    const requestBody = {
      fromChainId: CHAINS[fromChainId]?.socketId || fromChainId,
      toChainId: CHAINS[toChainId]?.socketId || toChainId,
      fromTokenAddress: tokenAddress,
      toTokenAddress: tokenAddress,
      fromAmount: amountInWei,
      userAddress: env.FEE_RECEIVER_ADDRESS,
      partnerId: env.INTEGRATOR_NAME,
      feePercent: parseFloat(env.FEE_PERCENTAGE) * 100,
      sort: "output",
    };

    const response = await fetch(API_CONFIG.SOCKET.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": env.SOCKET_API_KEY || "",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Socket error:", response.status);
      return null;
    }

    const data = await response.json();
    const route = data.result?.routes?.[0];
    if (!route) return null;

    return {
      name: API_CONFIG.SOCKET.name,
      icon: API_CONFIG.SOCKET.icon,
      provider: "socket",
      totalCost: parseFloat(route.totalGasFeesInUsd || "5"),
      bridgeFee: parseFloat(route.bridgeFee?.feesInUsd || "2"),
      gasFee: parseFloat(route.gasFees?.feesInUsd || "3"),
      estimatedTime: `${Math.ceil((route.serviceTime || 360) / 60)} mins`,
      security: "Multi-sig",
      liquidity: "High",
      route: "Direct",
    };
  } catch (error) {
    console.error("Socket fetch error:", error);
    return null;
  }
}

async function fetch0xQuote(fromChainId, toChainId, token, amount, env) {
  try {
    // 0x only works on select chains
    if (!["1", "137", "42161", "10", "56", "8453"].includes(fromChainId)) {
      return null;
    }

    const tokenConfig = TOKENS[token] || TOKENS["USDC"];
    const tokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address.default
        : tokenConfig.address;

    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    const params = new URLSearchParams({
      sellToken: tokenAddress,
      buyToken: tokenAddress,
      sellAmount: amountInWei,
      slippagePercentage: "0.005",
      affiliateAddress: env.FEE_RECEIVER_ADDRESS,
      buyTokenPercentageFee: env.FEE_PERCENTAGE,
    });

    const chainPath = fromChainId === "1" ? "" : `/${fromChainId}`;
    const response = await fetch(
      `https://api.0x.org${chainPath}/swap/v1/quote?${params}`,
      {
        headers: {
          Accept: "application/json",
          "0x-api-key": env.ZEROX_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      console.error("0x error:", response.status);
      return null;
    }

    const data = await response.json();
    const gasPrice = parseFloat(data.gasPrice || "20000000000") / 1e9;
    const gasEstimate = parseFloat(data.estimatedGas || "200000");
    const ethPrice = 2500; // Would fetch from price API in production
    const gasCostUSD = (gasEstimate * gasPrice * ethPrice) / 1e9;

    return {
      name: API_CONFIG.ZEROX.name,
      icon: API_CONFIG.ZEROX.icon,
      provider: "0x",
      totalCost: gasCostUSD + 2.0,
      bridgeFee: 2.0,
      gasFee: gasCostUSD,
      estimatedTime: "5 mins",
      security: "Audited",
      liquidity: "High",
      route: "0x Aggregation",
    };
  } catch (error) {
    console.error("0x fetch error:", error);
    return null;
  }
}

async function fetch1inchQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const chainMap = {
      1: "1",
      10: "10",
      56: "56",
      137: "137",
      8453: "8453",
      42161: "42161",
      43114: "43114",
    };

    if (!chainMap[fromChainId]) return null;

    const tokenConfig = TOKENS[token] || TOKENS["USDC"];
    const tokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address.default
        : tokenConfig.address;

    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    const params = new URLSearchParams({
      src: tokenAddress,
      dst: tokenAddress,
      amount: amountInWei,
      from: env.FEE_RECEIVER_ADDRESS,
      slippage: "0.5",
      referrer: env.FEE_RECEIVER_ADDRESS,
      fee: parseFloat(env.FEE_PERCENTAGE) * 100,
    });

    const response = await fetch(
      `${API_CONFIG.ONEINCH.url}/${chainMap[fromChainId]}/quote?${params}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${env.ONE_INCH_API_KEY || ""}`,
        },
      }
    );

    if (!response.ok) {
      console.error("1inch error:", response.status);
      return null;
    }

    const data = await response.json();
    const estimatedGas = parseFloat(data.estimatedGas || "250000");
    const gasCostUSD = (estimatedGas * 50 * 2500) / 1e18;

    return {
      name: API_CONFIG.ONEINCH.name,
      icon: API_CONFIG.ONEINCH.icon,
      provider: "1inch",
      totalCost: gasCostUSD + 2.5,
      bridgeFee: 2.5,
      gasFee: gasCostUSD,
      estimatedTime: "7 mins",
      security: "Audited",
      liquidity: "High",
      route: "1inch Fusion",
    };
  } catch (error) {
    console.error("1inch fetch error:", error);
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateMockBridges(amount) {
  const providers = [
    { name: "LI.FI", icon: "🔷", provider: "lifi" },
    { name: "Socket", icon: "🔌", provider: "socket" },
    { name: "1inch", icon: "🦄", provider: "1inch" },
    { name: "0x", icon: "0️⃣", provider: "0x" },
  ];

  return providers
    .map((provider, index) => {
      const baseFee = 2 + index * 0.5;
      const gasFee = 1 + Math.random();

      return {
        ...provider,
        totalCost: +(baseFee + gasFee).toFixed(2),
        bridgeFee: baseFee,
        gasFee: +gasFee.toFixed(2),
        estimatedTime: `${5 + index * 2} mins`,
        security: "Demo Mode",
        liquidity: "Simulated",
        route: "Mock Route",
        url: "#",
      };
    })
    .sort((a, b) => a.totalCost - b.totalCost);
}

function generateReferralUrl(bridge, env) {
  const baseUrls = {
    lifi: `https://jumper.exchange/?integrator=${env.INTEGRATOR_NAME}`,
    socket: `https://socketbridge.com/?ref=${env.INTEGRATOR_NAME}`,
    "0x": `https://matcha.xyz/?ref=${env.FEE_RECEIVER_ADDRESS}`,
    "1inch": `https://app.1inch.io/?ref=${env.FEE_RECEIVER_ADDRESS}`,
  };

  return baseUrls[bridge.provider] || "#";
}

// ============================================
// INFO ENDPOINTS
// ============================================

function handleStatus(env, headers) {
  const configuredAPIs = [];
  if (env.LIFI_API_KEY) configuredAPIs.push("LI.FI");
  if (env.SOCKET_API_KEY) configuredAPIs.push("Socket");
  if (env.ZEROX_API_KEY) configuredAPIs.push("0x");
  if (env.ONE_INCH_API_KEY) configuredAPIs.push("1inch");

  return new Response(
    JSON.stringify({
      status: "operational",
      version: "2.1.0",
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      integrator: env.INTEGRATOR_NAME,
      feeReceiver: env.FEE_RECEIVER_ADDRESS,
      feePercentage: env.FEE_PERCENTAGE,
      configuredAPIs:
        configuredAPIs.length > 0 ? configuredAPIs : ["Mock Data"],
      totalAPIs: Object.keys(API_CONFIG).length,
    }),
    { headers }
  );
}

function handleChains(headers) {
  return new Response(
    JSON.stringify({
      chains: CHAINS,
      count: Object.keys(CHAINS).length,
    }),
    { headers }
  );
}

function handleTokens(headers) {
  return new Response(
    JSON.stringify({
      tokens: Object.keys(TOKENS),
      count: Object.keys(TOKENS).length,
    }),
    { headers }
  );
}
