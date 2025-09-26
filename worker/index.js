// worker/index.js - Production Bridge Aggregator API with Real Integrations
// ============================================
// CHAIN & TOKEN CONFIGURATIONS
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
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    decimals: 18,
    137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    42161: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    10: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    56: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    43114: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
    8453: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    symbol: "ETH",
  },
  USDC: {
    address: {
      1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      137: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
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
          message: error.message,
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

    // ============================================
    // FETCH QUOTES FROM ALL PROVIDERS IN PARALLEL
    // ============================================
    const quotePromises = [];

    // Provider 1: LI.FI (uses API key from Cloudflare secrets)
    if (env.LIFI_API_KEY) {
      quotePromises.push(
        fetchLiFiQuote(fromChainId, toChainId, token, amount, env)
      );
    }

    // Provider 2: Jumper (free, no API key needed)
    quotePromises.push(
      fetchJumperQuote(fromChainId, toChainId, token, amount, env)
    );

    // Provider 3: Socket (free public API)
    quotePromises.push(
      fetchSocketQuote(fromChainId, toChainId, token, amount, env)
    );

    // Provider 4: Squid Router (free public API)
    quotePromises.push(
      fetchSquidQuote(fromChainId, toChainId, token, amount, env)
    );

    // TO ADD MORE PROVIDERS:
    // 1. Create a new fetch function below (e.g., fetchNewProviderQuote)
    // 2. Add it here: quotePromises.push(fetchNewProviderQuote(...))
    // 3. Follow the same return format as other providers

    // Wait for all providers to respond
    const quotes = await Promise.allSettled(quotePromises);

    // Process and filter valid quotes
    const bridges = quotes
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value)
      .filter((bridge) => bridge !== null && bridge.totalCost > 0)
      .sort((a, b) => a.totalCost - b.totalCost);

    if (bridges.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No routes available for this pair",
          bridges: [],
        }),
        { headers }
      );
    }

    // Add referral/monetization links
    const bridgesWithReferral = bridges.map((bridge, index) => ({
      ...bridge,
      url: generateReferralUrl(bridge, env),
      isBest: index === 0,
      saveAmount:
        index > 0
          ? bridges[bridges.length - 1].totalCost - bridge.totalCost
          : 0,
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
        details: error.message,
      }),
      { status: 500, headers }
    );
  }
}

// ============================================
// BRIDGE PROVIDER INTEGRATIONS
// ============================================
// Each function fetches real quotes from a specific bridge provider
// Returns standardized format: name, icon, provider, costs, timing, etc.
// ============================================

// ============================================
// PROVIDER 1: LI.FI
// Requires API key (stored in Cloudflare Workers secrets)
// Docs: https://docs.li.fi/li.fi-api/li.fi-api
// ============================================
async function fetchLiFiQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) return null;

    // Get token addresses for source and destination chains
    const fromTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    const toTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[toChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    // Convert amount to smallest unit (wei/gwei)
    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    // Build request parameters
    const params = new URLSearchParams({
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: amountInWei,
      slippage: "0.005",
      integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
      allowDestinationCall: "false",
    });

    // Add monetization parameters if configured
    if (env.FEE_RECEIVER_ADDRESS) {
      params.append("fee", env.FEE_PERCENTAGE || "0.003");
      params.append("referrer", env.FEE_RECEIVER_ADDRESS);
    }

    // Make API request with API key from Cloudflare secrets
    const response = await fetch(`https://li.quest/v1/quote?${params}`, {
      headers: {
        Accept: "application/json",
        "x-lifi-api-key": env.LIFI_API_KEY, // From Cloudflare Workers secrets
      },
    });

    if (!response.ok) {
      console.error("LI.FI error:", response.status);
      return null;
    }

    const data = await response.json();

    // Extract cost information from response
    const estimate = data.estimate || {};
    const gasCostUSD = parseFloat(estimate.gasCosts?.[0]?.amountUSD || "0");
    const feeCostUSD = parseFloat(estimate.feeCosts?.[0]?.amountUSD || "0");
    const slippageUSD = Math.abs(
      parseFloat(estimate.toAmountUSD || "0") -
        parseFloat(estimate.fromAmountUSD || "0")
    );

    const totalCost =
      gasCostUSD + feeCostUSD + (slippageUSD > 0 ? slippageUSD : 0);

    return {
      name: "LI.FI",
      icon: "🔷",
      provider: "lifi",
      totalCost: totalCost || 5,
      bridgeFee: feeCostUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil(
        (estimate.executionDuration || 300) / 60
      )} mins`,
      security: "Audited",
      liquidity: "High",
      route: data.toolDetails?.name || "Best Route",
      outputAmount: estimate.toAmount || null,
    };
  } catch (error) {
    console.error("LI.FI fetch error:", error);
    return null;
  }
}

// ============================================
// PROVIDER 2: JUMPER EXCHANGE
// Free API, no key required
// Powered by LI.FI infrastructure
// Docs: https://docs.jumper.exchange/
// ============================================
async function fetchJumperQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) return null;

    const fromTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    const toTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[toChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    // Jumper uses LI.FI's advanced routes endpoint (free access)
    const params = new URLSearchParams({
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: amountInWei,
      slippage: "0.5",
      integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
    });

    const response = await fetch(
      `https://li.quest/v1/advanced/routes?${params}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) return null;

    // Extract costs from route data
    const gasCostUSD = parseFloat(route.gasCostUSD || "3");
    const steps = route.steps || [];
    const totalFeeCost = steps.reduce((sum, step) => {
      return sum + parseFloat(step.estimate?.feeCosts?.[0]?.amountUSD || "0");
    }, 0);

    return {
      name: "Jumper",
      icon: "🦘",
      provider: "jumper",
      totalCost: gasCostUSD + totalFeeCost + 2,
      bridgeFee: totalFeeCost + 2,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil(
        (route.steps?.[0]?.estimate?.executionDuration || 300) / 60
      )} mins`,
      security: "Verified",
      liquidity: "High",
      route: route.steps?.[0]?.toolDetails?.name || "Jumper Route",
    };
  } catch (error) {
    console.error("Jumper fetch error:", error);
    return null;
  }
}

// ============================================
// PROVIDER 3: SOCKET
// Free public API, no authentication required
// Docs: https://docs.socket.tech/socket-api/v2
// ============================================
async function fetchSocketQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) return null;

    const fromTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    const toTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[toChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    const amountInWei = Math.floor(
      parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
    ).toString();

    // Socket v2 public quote endpoint
    const params = new URLSearchParams({
      fromChainId: fromChainId,
      fromTokenAddress: fromTokenAddress,
      toChainId: toChainId,
      toTokenAddress: toTokenAddress,
      fromAmount: amountInWei,
      userAddress:
        env.FEE_RECEIVER_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      uniqueRoutesPerBridge: "true",
      sort: "output",
      singleTxOnly: "false",
    });

    const response = await fetch(`https://api.socket.tech/v2/quote?${params}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const route = data.result?.routes?.[0];
    if (!route) return null;

    // Extract fee information
    const totalGas = parseFloat(route.totalGasFeesInUsd || "0");
    const bridgeFee = parseFloat(
      route.userTxs?.[0]?.protocolFees?.feesInUsd || "0"
    );

    return {
      name: "Socket",
      icon: "🔌",
      provider: "socket",
      totalCost: totalGas + bridgeFee || 5,
      bridgeFee: bridgeFee,
      gasFee: totalGas,
      estimatedTime: `${Math.ceil((route.serviceTime || 360) / 60)} mins`,
      security: "Multi-sig",
      liquidity: "High",
      route: route.usedBridgeNames?.join(" → ") || "Socket Bridge",
    };
  } catch (error) {
    console.error("Socket fetch error:", error);
    return null;
  }
}

// ============================================
// PROVIDER 4: SQUID ROUTER
// Free public API for basic quotes
// Docs: https://docs.squidrouter.com/
// ============================================
async function fetchSquidQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) return null;

    // Squid uses different chain IDs, map them
    const squidChainMap = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
      56: "binance",
      43114: "Avalanche",
      8453: "base",
    };

    if (!squidChainMap[fromChainId] || !squidChainMap[toChainId]) {
      return null; // Chain not supported by Squid
    }

    const fromTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    const toTokenAddress =
      typeof tokenConfig.address === "object"
        ? tokenConfig.address[toChainId] || tokenConfig.address[1]
        : tokenConfig.address;

    // Squid public route endpoint
    const requestBody = {
      fromChain: squidChainMap[fromChainId],
      toChain: squidChainMap[toChainId],
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: (
        parseFloat(amount) * Math.pow(10, tokenConfig.decimals)
      ).toString(),
      slippage: 1,
      enableExpress: true,
      prefer: ["FASTEST"],
    };

    const response = await fetch("https://api.squidrouter.com/v1/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const route = data.route;
    if (!route) return null;

    // Parse Squid response
    const gasCost = parseFloat(route.estimate?.gasCosts?.[0]?.amountUSD || "3");
    const feeCost = parseFloat(route.estimate?.feeCosts?.[0]?.amountUSD || "2");
    const totalCost = parseFloat(
      route.estimate?.totalCostUSD || gasCost + feeCost
    );

    return {
      name: "Squid",
      icon: "🦑",
      provider: "squid",
      totalCost: totalCost || 5,
      bridgeFee: feeCost,
      gasFee: gasCost,
      estimatedTime: `${Math.ceil(
        (route.estimate?.estimatedRouteDuration || 420) / 60
      )} mins`,
      security: "Axelar Network",
      liquidity: "Medium",
      route: route.estimate?.routeType || "Squid Route",
    };
  } catch (error) {
    console.error("Squid fetch error:", error);
    return null;
  }
}

// ============================================
// TO ADD A NEW PROVIDER:
// ============================================
// 1. Copy this template function below
// 2. Update the API endpoint and parameters
// 3. Add the function call in handleCompare above
// ============================================
/*
async function fetchNewProviderQuote(fromChainId, toChainId, token, amount, env) {
  try {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) return null;

    // Get token addresses
    const fromTokenAddress = typeof tokenConfig.address === "object"
      ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
      : tokenConfig.address;

    // Make API call to provider
    const response = await fetch("PROVIDER_API_URL", {
      // Add request configuration
    });

    if (!response.ok) return null;
    const data = await response.json();

    // Return standardized format
    return {
      name: "Provider Name",
      icon: "🌉",
      provider: "providername",
      totalCost: 5,  // Total cost in USD
      bridgeFee: 2,  // Bridge fee in USD
      gasFee: 3,     // Gas fee in USD
      estimatedTime: "5 mins",
      security: "Audited",
      liquidity: "High",
      route: "Route Name",
    };
  } catch (error) {
    console.error("Provider fetch error:", error);
    return null;
  }
}
*/

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate referral URLs for monetization
function generateReferralUrl(bridge, env) {
  const referralId =
    env.FEE_RECEIVER_ADDRESS || env.INTEGRATOR_NAME || "bridgeaggregator";

  // Each provider has different referral URL formats
  const baseUrls = {
    lifi: `https://jumper.exchange/?fromChain=1&toChain=137&integrator=${referralId}`,
    jumper: `https://jumper.exchange/?ref=${referralId}`,
    socket: `https://socketbridge.com/?ref=${referralId}`,
    squid: `https://app.squidrouter.com/?ref=${referralId}`,
    default: "#",
  };

  return baseUrls[bridge.provider] || baseUrls.default;
}

// ============================================
// INFO ENDPOINTS
// ============================================

function handleStatus(env, headers) {
  return new Response(
    JSON.stringify({
      status: "operational",
      version: "3.1.0",
      environment: env.ENVIRONMENT || "production",
      timestamp: new Date().toISOString(),
      integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
      feeReceiver: env.FEE_RECEIVER_ADDRESS || "Not configured",
      feePercentage: env.FEE_PERCENTAGE || "0.003",
      apis: {
        lifi: env.LIFI_API_KEY ? "Active (with API key)" : "Inactive",
        jumper: "Active (free public API)",
        socket: "Active (free public API)",
        squid: "Active (free public API)",
      },
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
      details: TOKENS,
      count: Object.keys(TOKENS).length,
    }),
    { headers }
  );
}
