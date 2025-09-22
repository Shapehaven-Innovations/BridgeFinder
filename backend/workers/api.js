// backend/workers/api.js
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Bridge configurations with API endpoints
const BRIDGE_APIS = {
  LIFI: {
    name: "LI.FI",
    endpoint: "https://li.quest/v1/quote",
    icon: "🔷",
    url: "https://li.fi",
    affiliateParam: "integrator=bridgeagg",
  },
  SOCKET: {
    name: "Socket",
    endpoint: "https://api.socket.tech/v2/quote",
    icon: "🔌",
    url: "https://socket.tech",
    affiliateParam: "partner=aggregator",
  },
  ZEROX: {
    name: "0x",
    endpoint: "https://api.0x.org/swap/v1/quote",
    icon: "0️⃣",
    url: "https://0x.org",
    affiliateParam:
      "affiliateAddress=0xD4d9218C4ab4B97E409b74aaA48536221eCc5405",
  },
  PARASWAP: {
    name: "ParaSwap",
    endpoint: "https://apiv5.paraswap.io/prices",
    icon: "🦜",
    url: "https://paraswap.io",
    affiliateParam: "partner=bridgeagg",
  },
};

// Chain ID to name mapping
const CHAIN_NAMES = {
  1: "ethereum",
  137: "polygon",
  42161: "arbitrum",
  10: "optimism",
  56: "bsc",
  43114: "avalanche",
};

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  if (url.pathname === "/api/quotes" && request.method === "POST") {
    return handleQuoteRequest(request);
  }

  return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
}

async function handleQuoteRequest(request) {
  try {
    const body = await request.json();
    const { fromChain, toChain, token, amount, tokenAddress } = body;

    // Validate input
    if (!fromChain || !toChain || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    // Fetch quotes from multiple bridges in parallel
    const quotePromises = [
      fetchLiFiQuote(fromChain, toChain, token, amount, tokenAddress),
      fetchSocketQuote(fromChain, toChain, token, amount, tokenAddress),
      fetch0xQuote(fromChain, toChain, token, amount, tokenAddress),
      fetchParaSwapQuote(fromChain, toChain, token, amount, tokenAddress),
    ];

    const quotes = await Promise.allSettled(quotePromises);

    // Filter out failed requests and format successful ones
    const validQuotes = quotes
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value)
      .filter((quote) => quote !== null);

    return new Response(
      JSON.stringify({
        success: true,
        quotes: validQuotes,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("Error handling quote request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

async function fetchLiFiQuote(fromChain, toChain, token, amount, tokenAddress) {
  try {
    const params = new URLSearchParams({
      fromChain: CHAIN_NAMES[fromChain] || fromChain,
      toChain: CHAIN_NAMES[toChain] || toChain,
      fromToken: tokenAddress || token,
      toToken: tokenAddress || token,
      fromAmount: (amount * 1e6).toString(), // Assuming USDC with 6 decimals
      integrator: "bridgeaggregator",
    });

    const response = await fetch(`${BRIDGE_APIS.LIFI.endpoint}?${params}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      bridge: BRIDGE_APIS.LIFI.name,
      icon: BRIDGE_APIS.LIFI.icon,
      url: `${BRIDGE_APIS.LIFI.url}?${BRIDGE_APIS.LIFI.affiliateParam}`,
      totalCost:
        parseFloat(data.estimate?.gasCosts?.usd || 0) +
        parseFloat(data.estimate?.feeCosts?.usd || 0),
      bridgeFee: parseFloat(data.estimate?.feeCosts?.usd || 0),
      gasFee: parseFloat(data.estimate?.gasCosts?.usd || 0),
      estimatedTime: `${Math.round(
        (data.estimate?.executionDuration || 600) / 60
      )} mins`,
      security: "Audited",
      liquidity: "High",
    };
  } catch (error) {
    console.error("LiFi quote error:", error);
    return null;
  }
}

async function fetchSocketQuote(
  fromChain,
  toChain,
  token,
  amount,
  tokenAddress
) {
  try {
    // Socket API implementation
    // Note: You'll need to register for an API key at socket.tech
    const params = {
      fromChainId: fromChain,
      toChainId: toChain,
      fromTokenAddress: tokenAddress,
      toTokenAddress: tokenAddress,
      fromAmount: (amount * 1e6).toString(),
      userAddress: "0xD4d9218C4ab4B97E409b74aaA48536221eCc5405",
      uniqueRoutesPerBridge: true,
      sort: "cheapest",
    };

    // Simulated response for demo
    return {
      bridge: BRIDGE_APIS.SOCKET.name,
      icon: BRIDGE_APIS.SOCKET.icon,
      url: `${BRIDGE_APIS.SOCKET.url}?${BRIDGE_APIS.SOCKET.affiliateParam}`,
      totalCost: 3.5 + Math.random() * 2, // Simulated cost
      bridgeFee: 2.0,
      gasFee: 1.5,
      estimatedTime: "10-15 mins",
      security: "Multi-sig",
      liquidity: "Medium",
    };
  } catch (error) {
    console.error("Socket quote error:", error);
    return null;
  }
}

async function fetch0xQuote(fromChain, toChain, token, amount, tokenAddress) {
  try {
    // 0x API primarily for same-chain swaps
    // For cross-chain, you might need to use their cross-chain API

    // Simulated response for demo
    return {
      bridge: BRIDGE_APIS.ZEROX.name,
      icon: BRIDGE_APIS.ZEROX.icon,
      url: `${BRIDGE_APIS.ZEROX.url}?${BRIDGE_APIS.ZEROX.affiliateParam}`,
      totalCost: 4.2 + Math.random() * 2,
      bridgeFee: 2.5,
      gasFee: 1.7,
      estimatedTime: "5-10 mins",
      security: "Decentralized",
      liquidity: "High",
    };
  } catch (error) {
    console.error("0x quote error:", error);
    return null;
  }
}

async function fetchParaSwapQuote(
  fromChain,
  toChain,
  token,
  amount,
  tokenAddress
) {
  try {
    // ParaSwap API implementation
    // Note: ParaSwap requires API key for production use

    // Simulated response for demo
    return {
      bridge: BRIDGE_APIS.PARASWAP.name,
      icon: BRIDGE_APIS.PARASWAP.icon,
      url: `${BRIDGE_APIS.PARASWAP.url}?${BRIDGE_APIS.PARASWAP.affiliateParam}`,
      totalCost: 3.8 + Math.random() * 2,
      bridgeFee: 2.2,
      gasFee: 1.6,
      estimatedTime: "8-12 mins",
      security: "Audited",
      liquidity: "High",
    };
  } catch (error) {
    console.error("ParaSwap quote error:", error);
    return null;
  }
}

// Export for Cloudflare Workers
export default {
  async fetch(request) {
    return handleRequest(request);
  },
};
