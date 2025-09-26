// worker/index.js - Production Bridge Aggregator API (Cloudflare Worker)

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

// ============================================
// CORS & helpers
// ============================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  Vary: "Origin",
};

// lossless decimal → units using BigInt
function toUnits(amountStr, decimals) {
  const [i = "0", f = ""] = String(amountStr).split(".");
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return (BigInt(i) * 10n ** BigInt(decimals) + BigInt(frac || "0")).toString();
}

// ============================================
// MAIN WORKER HANDLER
// ============================================

export default {
  async fetch(request, env) {
    // Preflight
    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const debug = url.searchParams.get("debug") === "1";

    try {
      switch (path) {
        case "/api/compare":
          if (request.method === "POST") {
            return await handleCompare(request, env, debug);
          }
          break;

        case "/api/status":
          if (request.method === "GET") return json(handleStatus(env));
          break;

        case "/api/chains":
          if (request.method === "GET")
            return json({ chains: CHAINS, count: Object.keys(CHAINS).length });
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

        // tiny echo to debug what callers send
        case "/api/echo":
          if (request.method === "POST") {
            const ct = request.headers.get("content-type") || "";
            const txt = await request.text();
            return json({
              success: true,
              contentType: ct,
              raw: txt,
              parsed: ct.includes("application/json")
                ? JSON.parse(txt || "{}")
                : null,
            });
          }
          break;
      }

      return json({ success: false, error: "Not found" }, 404);
    } catch (error) {
      console.error("Worker error:", error);
      return json(
        {
          success: false,
          error: "Internal server error",
          message: error.message,
        },
        500
      );
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================
// MAIN COMPARE HANDLER
// ============================================

async function handleCompare(request, env, debug) {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  try {
    const body = await request.json();
    const { fromChainId, toChainId, token, amount } = body;

    // Validation
    if (!fromChainId || !toChainId || !token || !amount) {
      return json(
        { success: false, error: "Missing required parameters" },
        400
      );
    }
    if (fromChainId === toChainId) {
      return json(
        { success: false, error: "Source and destination must be different" },
        400
      );
    }

    // Fetch all providers in parallel
    const quotePromises = [
      fetchLiFiQuote(fromChainId, toChainId, token, amount, env),
      fetchJumperQuote(fromChainId, toChainId, token, amount, env),
      fetchSocketQuote(fromChainId, toChainId, token, amount, env),
      fetchSquidQuote(fromChainId, toChainId, token, amount, env),
    ];

    const results = await Promise.allSettled(quotePromises);
    const outcomes = results.map((r) =>
      r.status === "fulfilled"
        ? { status: "fulfilled", value: r.value }
        : { status: "rejected", reason: String(r.reason?.message || r.reason) }
    );

    const bridges = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value)
      .filter((b) => b !== null && b.totalCost > 0)
      .sort((a, b) => a.totalCost - b.totalCost);

    if (bridges.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No routes available for this pair",
          debug: {
            fromChainId,
            toChainId,
            token,
            amount,
            tokenConfig: TOKENS[token],
            quotesAttempted: results.length,
            failures: results
              .filter((r) => r.status === "rejected")
              .map((r) => String(r.reason?.message || r.reason)),
            outcomes: debug ? outcomes : undefined,
          },
          bridges: [],
        }),
        { headers }
      );
    }

    const withReferral = bridges.map((b, i) => ({
      ...b,
      url: generateReferralUrl(b, env),
      isBest: i === 0,
      saveAmount:
        i > 0 ? bridges[bridges.length - 1].totalCost - b.totalCost : 0,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        bridges: withReferral,
        timestamp: new Date().toISOString(),
        totalProviders: results.length,
        successfulQuotes: bridges.length,
        debug: debug ? { outcomes } : undefined,
      }),
      { headers }
    );
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

// ============================================
// PROVIDERS
// ============================================

// 1) LI.FI (uses LIFI_API_KEY if present)
async function fetchLiFiQuote(fromChainId, toChainId, token, amount, env) {
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error("LI.FI: unknown token");

  const fromToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const toToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[toChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const amountInWei = toUnits(amount, tokenConfig.decimals);

  const params = new URLSearchParams({
    fromChain: String(fromChainId),
    toChain: String(toChainId),
    fromToken,
    toToken,
    fromAmount: amountInWei,
    slippage: "0.005",
    integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
    allowDestinationCall: "false",
  });
  if (env.FEE_RECEIVER_ADDRESS) {
    params.append("fee", env.FEE_PERCENTAGE || "0.003");
    params.append("referrer", env.FEE_RECEIVER_ADDRESS);
  }

  const headers = { Accept: "application/json" };
  if (env.LIFI_API_KEY) headers["x-lifi-api-key"] = env.LIFI_API_KEY;

  const res = await fetch(`https://li.quest/v1/quote?${params}`, { headers });
  if (!res.ok) throw new Error(`LI.FI HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (!data?.estimate) throw new Error("LI.FI: no estimate in response");

  const est = data.estimate;
  const gasCostUSD = parseFloat(est.gasCosts?.[0]?.amountUSD || "0");
  const feeCostUSD = parseFloat(est.feeCosts?.[0]?.amountUSD || "0");
  const fromUSD = parseFloat(est.fromAmountUSD || "0");
  const toUSD = parseFloat(est.toAmountUSD || "0");
  const slippageUSD = Math.abs(toUSD - fromUSD);
  const totalCost =
    gasCostUSD + feeCostUSD + (slippageUSD > 0 ? slippageUSD : 0);

  return {
    name: "LI.FI",
    icon: "🔷",
    provider: "lifi",
    totalCost: totalCost || 5,
    bridgeFee: feeCostUSD,
    gasFee: gasCostUSD,
    estimatedTime: `${Math.ceil((est.executionDuration || 300) / 60)} mins`,
    security: "Audited",
    liquidity: "High",
    route: data.toolDetails?.name || "Best Route",
    outputAmount: est.toAmount || null,
  };
}

// 2) Jumper (free; LI.FI infra)
async function fetchJumperQuote(fromChainId, toChainId, token, amount, env) {
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error("Jumper: unknown token");

  const fromToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const toToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[toChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const amountInWei = toUnits(amount, tokenConfig.decimals);

  const params = new URLSearchParams({
    fromChain: String(fromChainId),
    toChain: String(toChainId),
    fromToken,
    toToken,
    fromAmount: amountInWei,
    slippage: "0.5",
    integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
  });

  const res = await fetch(`https://li.quest/v1/advanced/routes?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Jumper HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Jumper: routes[] empty");

  const gasCostUSD = parseFloat(route.gasCostUSD || "3");
  const steps = route.steps || [];
  const totalFeeCost = steps.reduce(
    (sum, s) => sum + parseFloat(s.estimate?.feeCosts?.[0]?.amountUSD || "0"),
    0
  );

  return {
    name: "Jumper",
    icon: "🦘",
    provider: "jumper",
    totalCost: gasCostUSD + totalFeeCost + 2, // slight buffer
    bridgeFee: totalFeeCost + 2,
    gasFee: gasCostUSD,
    estimatedTime: `${Math.ceil(
      (route.steps?.[0]?.estimate?.executionDuration || 300) / 60
    )} mins`,
    security: "Verified",
    liquidity: "High",
    route: route.steps?.[0]?.toolDetails?.name || "Jumper Route",
  };
}

// 3) Socket (free public)
async function fetchSocketQuote(fromChainId, toChainId, token, amount, env) {
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error("Socket: unknown token");

  const fromToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const toToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[toChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const amountInWei = toUnits(amount, tokenConfig.decimals);

  const params = new URLSearchParams({
    fromChainId: String(fromChainId),
    fromTokenAddress: fromToken,
    toChainId: String(toChainId),
    toTokenAddress: toToken,
    fromAmount: amountInWei,
    userAddress:
      env.FEE_RECEIVER_ADDRESS || "0x0000000000000000000000000000000000000000",
    uniqueRoutesPerBridge: "true",
    sort: "output",
    singleTxOnly: "false",
  });

  const res = await fetch(`https://api.socket.tech/v2/quote?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Socket HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const route = data.result?.routes?.[0];
  if (!route) throw new Error("Socket: result.routes[] empty");

  const totalGas = parseFloat(route.totalGasFeesInUsd || "0");
  const bridgeFee = parseFloat(
    route.userTxs?.[0]?.protocolFees?.feesInUsd || "0"
  );

  return {
    name: "Socket",
    icon: "🔌",
    provider: "socket",
    totalCost: totalGas + bridgeFee || 5,
    bridgeFee,
    gasFee: totalGas,
    estimatedTime: `${Math.ceil((route.serviceTime || 360) / 60)} mins`,
    security: "Multi-sig",
    liquidity: "High",
    route: route.usedBridgeNames?.join(" → ") || "Socket Bridge",
  };
}

// 4) Squid Router (free public)
async function fetchSquidQuote(fromChainId, toChainId, token, amount, env) {
  const tokenConfig = TOKENS[token];
  if (!tokenConfig) throw new Error("Squid: unknown token");

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
    throw new Error("Squid: unsupported chain id");
  }

  const fromToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[fromChainId] || tokenConfig.address[1]
      : tokenConfig.address;
  const toToken =
    typeof tokenConfig.address === "object"
      ? tokenConfig.address[toChainId] || tokenConfig.address[1]
      : tokenConfig.address;

  const requestBody = {
    fromChain: squidChainMap[fromChainId],
    toChain: squidChainMap[toChainId],
    fromToken: fromToken,
    toToken: toToken,
    fromAmount: toUnits(amount, tokenConfig.decimals),
    slippage: 1,
    enableExpress: true,
    prefer: ["FASTEST"],
  };

  const res = await fetch("https://api.squidrouter.com/v1/route", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(requestBody),
  });
  if (!res.ok) throw new Error(`Squid HTTP ${res.status} ${await res.text()}`);

  const data = await res.json();
  const route = data.route;
  if (!route) throw new Error("Squid: route missing");

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
}

// ============================================
// UTILS
// ============================================

function generateReferralUrl(bridge, env) {
  const referralId =
    env.FEE_RECEIVER_ADDRESS || env.INTEGRATOR_NAME || "bridgeaggregator";
  const base = {
    lifi: `https://jumper.exchange/?fromChain=1&toChain=137&integrator=${referralId}`,
    jumper: `https://jumper.exchange/?ref=${referralId}`,
    socket: `https://socketbridge.com/?ref=${referralId}`,
    squid: `https://app.squidrouter.com/?ref=${referralId}`,
    default: "#",
  };
  return base[bridge.provider] || base.default;
}

function handleStatus(env) {
  return {
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
  };
}
