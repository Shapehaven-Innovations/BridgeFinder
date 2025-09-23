// src/index.js - Cloudflare Worker for Bridge Aggregator API

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route handling
      if (path === "/api/compare" && request.method === "POST") {
        return await handleCompare(request, corsHeaders);
      }

      if (path === "/api/status" && request.method === "GET") {
        return handleStatus(corsHeaders);
      }

      if (path === "/api/chains" && request.method === "GET") {
        return handleChains(corsHeaders);
      }

      if (path === "/api/tokens" && request.method === "GET") {
        return handleTokens(corsHeaders);
      }

      // Default 404
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

// Bridge providers configuration
const BRIDGE_PROVIDERS = {
  "LI.FI": { icon: "🔷", priority: 1 },
  Socket: { icon: "🔌", priority: 2 },
  "0x": { icon: "0️⃣", priority: 3 },
  ParaSwap: { icon: "🦜", priority: 4 },
  Hop: { icon: "🐰", priority: 5 },
  Stargate: { icon: "⭐", priority: 6 },
  Across: { icon: "➡️", priority: 7 },
  Synapse: { icon: "🧬", priority: 8 },
};

// Compare handler
async function handleCompare(request, headers) {
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

    // Generate mock bridge quotes (replace with real API calls in production)
    const bridges = generateMockBridges(amount);

    // Sort by cost
    bridges.sort((a, b) => a.totalCost - b.totalCost);

    return new Response(
      JSON.stringify({
        success: true,
        bridges,
        timestamp: new Date().toISOString(),
      }),
      { headers }
    );
  } catch (error) {
    console.error("Compare error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to compare bridges" }),
      { status: 500, headers }
    );
  }
}

// Generate mock bridge data
function generateMockBridges(amount) {
  return Object.entries(BRIDGE_PROVIDERS).map(([name, config]) => {
    const baseFee = 1.5 + Math.random() * 3;
    const gasFee = 0.5 + Math.random() * 2;

    return {
      name,
      icon: config.icon,
      totalCost: baseFee + gasFee,
      bridgeFee: baseFee,
      gasFee: gasFee,
      estimatedTime: `${5 + Math.floor(Math.random() * 10)} mins`,
      security: ["Audited", "Multi-sig", "Trusted"][
        Math.floor(Math.random() * 3)
      ],
      liquidity: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
      url: `https://bridge.example.com/${name.toLowerCase()}`,
    };
  });
}

// Status handler
function handleStatus(headers) {
  return new Response(
    JSON.stringify({
      status: "operational",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      providers: Object.keys(BRIDGE_PROVIDERS).map((name) => ({
        name,
        status: "active",
      })),
    }),
    { headers }
  );
}

// Chains handler
function handleChains(headers) {
  const chains = {
    1: { name: "Ethereum", icon: "🔷", native: "ETH" },
    137: { name: "Polygon", icon: "🟣", native: "MATIC" },
    42161: { name: "Arbitrum", icon: "🔵", native: "ETH" },
    10: { name: "Optimism", icon: "🔴", native: "ETH" },
    56: { name: "BSC", icon: "🟡", native: "BNB" },
    43114: { name: "Avalanche", icon: "🔺", native: "AVAX" },
    8453: { name: "Base", icon: "🟦", native: "ETH" },
  };

  return new Response(JSON.stringify({ chains }), { headers });
}

// Tokens handler
function handleTokens(headers) {
  const tokens = [
    "USDC",
    "USDT",
    "ETH",
    "WETH",
    "DAI",
    "WBTC",
    "MATIC",
    "LINK",
    "UNI",
    "AAVE",
  ];

  return new Response(JSON.stringify({ tokens }), { headers });
}
