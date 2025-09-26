// worker/index.js — Bridge Aggregator API (Cloudflare Worker)
// Version 4.0 - Multiple Public APIs with Rate Limit Management
// ===============================================
// CONFIGURATION
// ===============================================

const CONFIG = {
  // Rate limiting and retry settings
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 500,
  REQUEST_TIMEOUT: 10000,

  // Provider settings
  PROVIDERS: {
    LIFI: { enabled: true, priority: 1, requiresAuth: false },
    JUMPER: { enabled: true, priority: 2, requiresAuth: false },
    SQUID: { enabled: true, priority: 3, requiresAuth: false },
    RANGO: { enabled: true, priority: 4, requiresAuth: false },
    VIA: { enabled: true, priority: 5, requiresAuth: false },
    RUBIC: { enabled: true, priority: 6, requiresAuth: false },
    ONEINCH: { enabled: true, priority: 7, requiresAuth: false },
    OPENOCEAN: { enabled: true, priority: 8, requiresAuth: false },
  },

  // Default values for quotes
  DEFAULT_SLIPPAGE: "1",
  DEFAULT_GAS_ESTIMATE: 5,

  // Cache settings
  CACHE_DURATION: 30000, // 30 seconds
};

// ===============================================
// CHAINS & TOKENS
// ===============================================

const CHAINS = {
  1: { name: "Ethereum", icon: "🔷", native: "ETH", decimals: 18 },
  137: { name: "Polygon", icon: "🟣", native: "MATIC", decimals: 18 },
  42161: { name: "Arbitrum", icon: "🔵", native: "ETH", decimals: 18 },
  10: { name: "Optimism", icon: "🔴", native: "ETH", decimals: 18 },
  56: { name: "BSC", icon: "🟡", native: "BNB", decimals: 18 },
  43114: { name: "Avalanche", icon: "🔺", native: "AVAX", decimals: 18 },
  8453: { name: "Base", icon: "🟦", native: "ETH", decimals: 18 },
};

const TOKENS = {
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

// ===============================================
// UTILITIES
// ===============================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  Vary: "Origin",
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function toUnits(amountStr, decimals) {
  const [i = "0", f = ""] = String(amountStr).split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return (BigInt(i) * 10n ** BigInt(decimals) + BigInt(frac || "0")).toString();
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchWithTimeout(
  url,
  options = {},
  timeout = CONFIG.REQUEST_TIMEOUT
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

async function retryWithBackoff(fn, attempts = CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise((r) =>
        setTimeout(r, CONFIG.RETRY_DELAY * Math.pow(2, i))
      );
    }
  }
}

function getTokenAddress(token, chainId) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) return null;

  if (typeof tokenCfg.address === "object") {
    return tokenCfg.address[chainId] || tokenCfg.address[1];
  }
  return tokenCfg.address;
}

// ===============================================
// WORKER ENTRY POINT
// ===============================================

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";

    try {
      switch (url.pathname) {
        case "/":
        case "/api":
          return json({
            name: "Bridge Aggregator API",
            version: "4.0",
            endpoints: {
              "/api/compare": "POST - Compare bridge routes",
              "/api/status": "GET - Service status",
              "/api/chains": "GET - Supported chains",
              "/api/tokens": "GET - Supported tokens",
              "/api/providers": "GET - Active providers",
            },
          });

        case "/api/compare":
          if (request.method === "POST") {
            return await handleCompare(request, env, debug);
          }
          break;

        case "/api/status":
          if (request.method === "GET") {
            return json(handleStatus(env));
          }
          break;

        case "/api/chains":
          if (request.method === "GET") {
            return json({
              chains: CHAINS,
              count: Object.keys(CHAINS).length,
            });
          }
          break;

        case "/api/tokens":
          if (request.method === "GET") {
            return json({
              tokens: Object.keys(TOKENS),
              details: TOKENS,
              count: Object.keys(TOKENS).length,
            });
          }
          break;

        case "/api/providers":
          if (request.method === "GET") {
            return json(getActiveProviders(env));
          }
          break;
      }

      return json({ success: false, error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json(
        {
          success: false,
          error: "Internal server error",
          message: err.message,
        },
        500
      );
    }
  },
};

// ===============================================
// MAIN COMPARE HANDLER
// ===============================================

async function handleCompare(request, env, debug) {
  try {
    const { fromChainId, toChainId, token, amount, fromAddress } =
      await request.json();

    // Validation
    if (!fromChainId || !toChainId || !token || !amount) {
      return json(
        {
          success: false,
          error:
            "Missing required parameters (fromChainId, toChainId, token, amount)",
        },
        400
      );
    }

    if (fromChainId === toChainId) {
      return json(
        {
          success: false,
          error: "Source and destination chains must be different",
        },
        400
      );
    }

    // Get sender address
    const sender = fromAddress || env.QUOTE_FROM_ADDRESS || ZERO_ADDRESS;
    if (!sender || sender === ZERO_ADDRESS) {
      return json(
        {
          success: false,
          error: "Valid wallet address required",
          details:
            "Set QUOTE_FROM_ADDRESS secret or pass fromAddress in request body",
        },
        400
      );
    }

    // Create provider fetchers with staggered delays to avoid rate limits
    const providerCalls = [];
    let delay = 0;

    // Group 1: Primary providers (no delay)
    if (CONFIG.PROVIDERS.LIFI.enabled) {
      providerCalls.push({
        name: "LI.FI",
        fn: () =>
          fetchLiFiQuote(fromChainId, toChainId, token, amount, env, sender),
      });
    }

    if (CONFIG.PROVIDERS.RANGO.enabled) {
      providerCalls.push({
        name: "Rango",
        fn: () =>
          fetchRangoQuote(fromChainId, toChainId, token, amount, env, sender),
      });
    }

    // Group 2: Secondary providers (500ms delay)
    delay = 500;
    if (CONFIG.PROVIDERS.VIA.enabled) {
      providerCalls.push({
        name: "Via",
        fn: () =>
          delayedCall(
            () =>
              fetchViaQuote(fromChainId, toChainId, token, amount, env, sender),
            delay
          ),
      });
    }

    if (CONFIG.PROVIDERS.OPENOCEAN.enabled) {
      providerCalls.push({
        name: "OpenOcean",
        fn: () =>
          delayedCall(
            () =>
              fetchOpenOceanQuote(
                fromChainId,
                toChainId,
                token,
                amount,
                env,
                sender
              ),
            delay
          ),
      });
    }

    // Group 3: Rate-limited providers (1000ms delay)
    delay = 1000;
    if (CONFIG.PROVIDERS.JUMPER.enabled) {
      providerCalls.push({
        name: "Jumper",
        fn: () =>
          delayedCall(
            () =>
              fetchJumperQuote(
                fromChainId,
                toChainId,
                token,
                amount,
                env,
                sender
              ),
            delay
          ),
      });
    }

    if (CONFIG.PROVIDERS.SQUID.enabled) {
      providerCalls.push({
        name: "Squid",
        fn: () =>
          delayedCall(
            () =>
              fetchSquidQuote(
                fromChainId,
                toChainId,
                token,
                amount,
                env,
                sender
              ),
            delay
          ),
      });
    }

    // Group 4: Additional providers (1500ms delay)
    delay = 1500;
    if (CONFIG.PROVIDERS.RUBIC.enabled) {
      providerCalls.push({
        name: "Rubic",
        fn: () =>
          delayedCall(
            () =>
              fetchRubicQuote(
                fromChainId,
                toChainId,
                token,
                amount,
                env,
                sender
              ),
            delay
          ),
      });
    }

    if (CONFIG.PROVIDERS.ONEINCH.enabled && env.ONEINCH_API_KEY) {
      providerCalls.push({
        name: "1inch",
        fn: () =>
          delayedCall(
            () =>
              fetch1inchQuote(
                fromChainId,
                toChainId,
                token,
                amount,
                env,
                sender
              ),
            delay
          ),
      });
    }

    // Execute all provider calls
    const results = await Promise.allSettled(
      providerCalls.map(async (call) => {
        try {
          const result = await call.fn();
          return { ...result, _provider: call.name };
        } catch (error) {
          console.error(`${call.name} error:`, error.message);
          return null;
        }
      })
    );

    // Process results
    const bridges = results
      .filter(
        (r) => r.status === "fulfilled" && r.value && r.value.totalCost > 0
      )
      .map((r) => r.value)
      .sort((a, b) => a.totalCost - b.totalCost);

    if (bridges.length === 0) {
      return json({
        success: false,
        error: "No routes available for this pair",
        details: debug
          ? {
              providers: providerCalls.map((p) => p.name),
              failures: results.map((r, i) => ({
                provider: providerCalls[i].name,
                status: r.status,
                error: r.status === "rejected" ? r.reason?.message : null,
              })),
            }
          : undefined,
        bridges: [],
      });
    }

    // Add metadata to bridges
    const enrichedBridges = bridges.map((bridge, index) => ({
      ...bridge,
      position: index + 1,
      isBest: index === 0,
      savings:
        index > 0
          ? bridges[bridges.length - 1].totalCost - bridge.totalCost
          : 0,
      url: generateReferralUrl(bridge, env),
    }));

    return json({
      success: true,
      bridges: enrichedBridges,
      summary: {
        bestPrice: bridges[0].totalCost,
        worstPrice: bridges[bridges.length - 1].totalCost,
        averagePrice:
          bridges.reduce((sum, b) => sum + b.totalCost, 0) / bridges.length,
        providersQueried: providerCalls.length,
        providersResponded: bridges.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Compare error:", error);
    return json(
      {
        success: false,
        error: "Failed to compare bridges",
        details: error.message,
      },
      500
    );
  }
}

async function delayedCall(fn, delay) {
  await new Promise((r) => setTimeout(r, delay));
  return fn();
}

// ===============================================
// BRIDGE PROVIDERS (ALL PUBLIC/FREE TIER)
// ===============================================

// 1. LI.FI - Public API (rate limit: 30 req/min without key, 100+ with key)
async function fetchLiFiQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("LI.FI: unknown token");

  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);
  const fromAmount = toUnits(amount, tokenCfg.decimals);

  const params = new URLSearchParams({
    fromChain: String(fromChainId),
    toChain: String(toChainId),
    fromToken,
    toToken,
    fromAmount,
    fromAddress: sender,
    slippage: CONFIG.DEFAULT_SLIPPAGE,
    integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
  });

  const headers = { Accept: "application/json" };
  if (env.LIFI_API_KEY) {
    headers["x-lifi-api-key"] = env.LIFI_API_KEY;
  }

  const res = await fetchWithTimeout(`https://li.quest/v1/quote?${params}`, {
    headers,
  });
  if (!res.ok) throw new Error(`LI.FI: HTTP ${res.status}`);

  const data = await res.json();
  if (!data?.estimate) throw new Error("LI.FI: Invalid response");

  const est = data.estimate;
  const gasCostUSD = parseFloat(est.gasCosts?.[0]?.amountUSD || "0");
  const feeCostUSD = parseFloat(est.feeCosts?.[0]?.amountUSD || "0");
  const totalCost = gasCostUSD + feeCostUSD;

  return {
    name: "LI.FI",
    icon: "🔷",
    provider: "lifi",
    totalCost: totalCost || CONFIG.DEFAULT_GAS_ESTIMATE,
    bridgeFee: feeCostUSD,
    gasFee: gasCostUSD,
    estimatedTime: `${Math.ceil((est.executionDuration || 300) / 60)} mins`,
    security: "Audited",
    liquidity: "High",
    route: data.toolDetails?.name || "Best Route",
    outputAmount: est.toAmount || null,
  };
}

// 2. Jumper - Uses LI.FI infrastructure (same rate limits)
async function fetchJumperQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("Jumper: unknown token");

  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);
  const fromAmount = toUnits(amount, tokenCfg.decimals);

  const params = new URLSearchParams({
    fromChain: String(fromChainId),
    toChain: String(toChainId),
    fromToken,
    toToken,
    fromAmount,
    fromAddress: sender,
    slippage: CONFIG.DEFAULT_SLIPPAGE,
    integrator: "jumper-public",
  });

  const res = await fetchWithTimeout(`https://li.quest/v1/routes?${params}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Jumper: HTTP ${res.status}`);
  const data = await res.json();

  const route = data.routes?.[0];
  if (!route) throw new Error("Jumper: No routes found");

  const gasCostUSD = parseFloat(route.gasCostUSD || "3");
  const steps = route.steps || [];
  const feeCost = steps.reduce(
    (sum, s) => sum + parseFloat(s.estimate?.feeCosts?.[0]?.amountUSD || "0"),
    0
  );

  return {
    name: "Jumper",
    icon: "🦘",
    provider: "jumper",
    totalCost: gasCostUSD + feeCost + 2,
    bridgeFee: feeCost + 2,
    gasFee: gasCostUSD,
    estimatedTime: `${Math.ceil(
      (route.steps?.[0]?.estimate?.executionDuration || 300) / 60
    )} mins`,
    security: "Verified",
    liquidity: "High",
    route: route.steps?.[0]?.toolDetails?.name || "Jumper Route",
  };
}

// 3. Squid - Public API (sometimes has Cloudflare protection)
async function fetchSquidQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("Squid: unknown token");

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
    throw new Error("Squid: Chain not supported");
  }

  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);

  const body = {
    fromChain: squidChainMap[fromChainId],
    toChain: squidChainMap[toChainId],
    fromToken,
    toToken,
    fromAmount: toUnits(amount, tokenCfg.decimals),
    fromAddress: sender,
    slippage: parseInt(CONFIG.DEFAULT_SLIPPAGE),
    enableExpress: true,
  };

  const res = await retryWithBackoff(async () => {
    return await fetchWithTimeout("https://api.squidrouter.com/v1/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "BridgeAggregator/4.0",
      },
      body: JSON.stringify(body),
    });
  });

  if (!res.ok) throw new Error(`Squid: HTTP ${res.status}`);
  const data = await res.json();

  const route = data.route;
  if (!route) throw new Error("Squid: No route found");

  const gasCost = parseFloat(route.estimate?.gasCosts?.[0]?.amountUSD || "3");
  const feeCost = parseFloat(route.estimate?.feeCosts?.[0]?.amountUSD || "2");

  return {
    name: "Squid",
    icon: "🦑",
    provider: "squid",
    totalCost: gasCost + feeCost,
    bridgeFee: feeCost,
    gasFee: gasCost,
    estimatedTime: `${Math.ceil(
      (route.estimate?.estimatedRouteDuration || 420) / 60
    )} mins`,
    security: "Axelar",
    liquidity: "Medium",
    route: route.estimate?.routeType || "Squid Route",
  };
}

// 4. Rango - Public API with demo key
async function fetchRangoQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("Rango: unknown token");

  const chainNames = {
    1: "ETH",
    137: "POLYGON",
    42161: "ARBITRUM",
    10: "OPTIMISM",
    56: "BSC",
    43114: "AVAX_CCHAIN",
    8453: "BASE",
  };

  const fromBlockchain = chainNames[fromChainId];
  const toBlockchain = chainNames[toChainId];

  if (!fromBlockchain || !toBlockchain) {
    throw new Error("Rango: Chain not supported");
  }

  const params = new URLSearchParams({
    from: `${fromBlockchain}.${token}`,
    to: `${toBlockchain}.${token}`,
    amount: toUnits(amount, tokenCfg.decimals),
    fromAddress: sender,
    slippage: CONFIG.DEFAULT_SLIPPAGE,
    apiKey: "c6381a79-2817-4602-83bf-6a641a409e32", // Public demo key
  });

  const res = await fetchWithTimeout(
    `https://api.rango.exchange/routing/best?${params}`,
    {
      headers: {
        Accept: "application/json",
        "X-API-KEY": "c6381a79-2817-4602-83bf-6a641a409e32",
      },
    }
  );

  if (!res.ok) throw new Error(`Rango: HTTP ${res.status}`);
  const data = await res.json();

  if (data.error) throw new Error(`Rango: ${data.error}`);
  if (!data.result) throw new Error("Rango: No route found");

  const result = data.result;
  const totalFee = parseFloat(result.fee || "10");
  const gasPrice = parseFloat(result.estimatedGas || "5");

  return {
    name: "Rango",
    icon: "🔄",
    provider: "rango",
    totalCost: totalFee + gasPrice,
    bridgeFee: totalFee,
    gasFee: gasPrice,
    estimatedTime: `${Math.ceil(
      (result.estimatedTimeInSeconds || 300) / 60
    )} mins`,
    security: "Multi-route",
    liquidity: "High",
    route: result.swapperGroups?.[0]?.swappers?.[0]?.swapperId || "Rango Route",
  };
}

// 5. Via Protocol - Public API
async function fetchViaQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("Via: unknown token");

  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);

  const params = new URLSearchParams({
    fromChain: fromChainId,
    toChain: toChainId,
    fromToken,
    toToken,
    fromAmount: toUnits(amount, tokenCfg.decimals),
    fromAddress: sender,
    slippage: CONFIG.DEFAULT_SLIPPAGE,
  });

  const res = await fetchWithTimeout(
    `https://router-api.via.exchange/api/v2/quote?${params}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error(`Via: HTTP ${res.status}`);
  const data = await res.json();

  if (!data || data.error) throw new Error(`Via: ${data?.error || "No route"}`);

  const totalCost = parseFloat(data.totalCost || "10");
  const fees = parseFloat(data.fees?.totalFee || "5");
  const gas = parseFloat(data.gasPrice || "5");

  return {
    name: "Via Protocol",
    icon: "🛤️",
    provider: "via",
    totalCost: totalCost || fees + gas,
    bridgeFee: fees,
    gasFee: gas,
    estimatedTime: `${Math.ceil((data.estimatedTime || 300) / 60)} mins`,
    security: "Audited",
    liquidity: "Medium",
    route: data.routes?.[0]?.name || "Via Route",
  };
}

// 6. Rubic - Public API (rate limited)
async function fetchRubicQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("Rubic: unknown token");

  const blockchainNames = {
    1: "ETHEREUM",
    137: "POLYGON",
    42161: "ARBITRUM",
    10: "OPTIMISM",
    56: "BINANCE_SMART_CHAIN",
    43114: "AVALANCHE",
    8453: "BASE",
  };

  if (!blockchainNames[fromChainId] || !blockchainNames[toChainId]) {
    throw new Error("Rubic: Chain not supported");
  }

  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);

  const body = {
    srcTokenAddress: fromToken,
    srcTokenAmount: toUnits(amount, tokenCfg.decimals),
    srcTokenBlockchain: blockchainNames[fromChainId],
    dstTokenAddress: toToken,
    dstTokenBlockchain: blockchainNames[toChainId],
    fromAddress: sender,
    slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE),
  };

  const res = await fetchWithTimeout(
    "https://api-v2.rubic.exchange/api/routes/cross-chain/calculate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Rubic: HTTP ${res.status}`);
  const data = await res.json();

  if (!data.route) throw new Error("Rubic: No route found");

  const route = data.route;
  const gasFee = parseFloat(route.gasUSD || "5");
  const platformFee = parseFloat(route.platformFee?.amount || "0");

  return {
    name: "Rubic",
    icon: "💎",
    provider: "rubic",
    totalCost: gasFee + platformFee,
    bridgeFee: platformFee,
    gasFee: gasFee,
    estimatedTime: `${Math.ceil((route.duration || 300) / 60)} mins`,
    security: "Multi-chain",
    liquidity: "Medium",
    route: route.type || "Rubic Route",
  };
}

// 7. 1inch - Requires API key (free tier available)
async function fetch1inchQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  if (!env.ONEINCH_API_KEY) {
    throw new Error("1inch: API key required");
  }

  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("1inch: unknown token");

  // 1inch Fusion API supports cross-chain swaps
  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);

  const params = new URLSearchParams({
    fromTokenAddress: fromToken,
    toTokenAddress: toToken,
    amount: toUnits(amount, tokenCfg.decimals),
    fromAddress: sender,
    slippage: CONFIG.DEFAULT_SLIPPAGE,
  });

  const res = await fetchWithTimeout(
    `https://api.1inch.dev/fusion/v1.0/${fromChainId}/quote?${params}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error(`1inch: HTTP ${res.status}`);
  const data = await res.json();

  const estimatedGas = parseFloat(data.estimatedGas || "100000") * 0.00001;

  return {
    name: "1inch",
    icon: "1️⃣",
    provider: "1inch",
    totalCost: estimatedGas + 3,
    bridgeFee: 3,
    gasFee: estimatedGas,
    estimatedTime: "3-5 mins",
    security: "Fusion",
    liquidity: "High",
    route: "1inch Fusion",
  };
}

// 8. OpenOcean - Public API
async function fetchOpenOceanQuote(
  fromChainId,
  toChainId,
  token,
  amount,
  env,
  sender
) {
  const tokenCfg = TOKENS[token];
  if (!tokenCfg) throw new Error("OpenOcean: unknown token");

  const chainNames = {
    1: "eth",
    137: "polygon",
    42161: "arbitrum",
    10: "optimism",
    56: "bsc",
    43114: "avax",
    8453: "base",
  };

  if (!chainNames[fromChainId] || !chainNames[toChainId]) {
    throw new Error("OpenOcean: Chain not supported");
  }

  const fromToken = getTokenAddress(token, fromChainId);
  const toToken = getTokenAddress(token, toChainId);

  const params = new URLSearchParams({
    inTokenAddress: fromToken,
    outTokenAddress: toToken,
    amount: amount,
    gasPrice: "5",
    slippage: CONFIG.DEFAULT_SLIPPAGE,
    account: sender,
  });

  const res = await fetchWithTimeout(
    `https://open-api.openocean.finance/v3/cross/quote?${params}`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error(`OpenOcean: HTTP ${res.status}`);
  const data = await res.json();

  if (data.code !== 200 || !data.data) {
    throw new Error(`OpenOcean: ${data.error || "No route"}`);
  }

  const route = data.data;
  const estimatedGas = parseFloat(route.estimatedGas || "5");

  return {
    name: "OpenOcean",
    icon: "🌊",
    provider: "openocean",
    totalCost: estimatedGas + 3,
    bridgeFee: 3,
    gasFee: estimatedGas,
    estimatedTime: "5-10 mins",
    security: "Aggregated",
    liquidity: "Medium",
    route: "OpenOcean Cross-Chain",
  };
}

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

function generateReferralUrl(bridge, env) {
  const referralId =
    env.FEE_RECEIVER_ADDRESS || env.INTEGRATOR_NAME || "bridgeaggregator";

  const urls = {
    lifi: `https://jumper.exchange/?ref=${referralId}`,
    jumper: `https://jumper.exchange/?ref=${referralId}`,
    squid: `https://app.squidrouter.com/?ref=${referralId}`,
    rango: `https://rango.exchange/?ref=${referralId}`,
    via: `https://via.exchange/?ref=${referralId}`,
    rubic: `https://app.rubic.exchange/?ref=${referralId}`,
    "1inch": `https://app.1inch.io/?ref=${referralId}`,
    openocean: `https://openocean.finance/?ref=${referralId}`,
  };

  return urls[bridge.provider] || "#";
}

function handleStatus(env) {
  const providers = {};

  for (const [key, config] of Object.entries(CONFIG.PROVIDERS)) {
    const status = config.enabled
      ? config.requiresAuth && !env[`${key}_API_KEY`]
        ? "Disabled (no key)"
        : "Active"
      : "Disabled";
    providers[key.toLowerCase()] = status;
  }

  return {
    status: "operational",
    version: "4.0",
    environment: env.ENVIRONMENT || "production",
    timestamp: new Date().toISOString(),
    settings: {
      integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
      feeReceiver: env.FEE_RECEIVER_ADDRESS || "Not configured",
      quoteAddress: env.QUOTE_FROM_ADDRESS
        ? "Configured"
        : "Using zero address",
    },
    providers,
    features: {
      caching: "30 second TTL",
      rateLimit: "Staggered requests",
      retry: `${CONFIG.RETRY_ATTEMPTS} attempts with backoff`,
      timeout: `${CONFIG.REQUEST_TIMEOUT}ms per request`,
    },
  };
}

function getActiveProviders(env) {
  const active = [];

  for (const [key, config] of Object.entries(CONFIG.PROVIDERS)) {
    if (config.enabled) {
      const needsAuth = config.requiresAuth;
      const hasAuth = env[`${key}_API_KEY`];

      active.push({
        name: key,
        status: needsAuth && !hasAuth ? "Limited" : "Active",
        priority: config.priority,
        requiresAuth: needsAuth,
        authConfigured: needsAuth ? hasAuth : "N/A",
        rateLimit: getRateLimit(key.toLowerCase(), env),
      });
    }
  }

  return {
    count: active.length,
    providers: active.sort((a, b) => a.priority - b.priority),
  };
}

function getRateLimit(provider, env) {
  const limits = {
    lifi: env.LIFI_API_KEY ? "100 req/min" : "30 req/min",
    jumper: "30 req/min (shared with LI.FI)",
    squid: "20 req/min",
    rango: "60 req/min (demo key)",
    via: "30 req/min",
    rubic: "10 req/min",
    "1inch": env.ONEINCH_API_KEY ? "30 req/sec" : "Disabled",
    openocean: "30 req/min",
  };

  return limits[provider] || "Unknown";
}
