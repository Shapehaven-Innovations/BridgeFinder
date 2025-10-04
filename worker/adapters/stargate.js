// worker/adapters/stargate.js - THIN ADAPTER (No hardcoded business data)
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class StargateAdapter extends BridgeAdapter {
  constructor(config) {
    super("Stargate", config);
    this.icon = "⭐";
  }

  /**
   * Get Stargate pool ID for a token on a specific chain
   * Pool IDs are consistent across Stargate V1 deployments
   * @param {string} token - Token symbol (USDT, USDC, etc.)
   * @param {number} chainId - EVM chain ID
   * @returns {number|null} Pool ID or null if not available
   */
  getPoolId(token, chainId) {
    // Stargate pool ID mapping
    // Reference: https://stargateprotocol.gitbook.io/stargate/developers/pool-ids
    const poolMap = {
      // USDC pools (Pool ID: 1)
      USDC: {
        1: 1, // Ethereum
        137: 1, // Polygon
        42161: 1, // Arbitrum
        10: 1, // Optimism
        56: 1, // BSC
        43114: 1, // Avalanche
        8453: 1, // Base
      },
      // USDT pools (Pool ID: 2)
      USDT: {
        1: 2, // Ethereum
        137: 2, // Polygon
        42161: 2, // Arbitrum
        10: 2, // Optimism
        56: 2, // BSC
        43114: 2, // Avalanche
      },
      // ETH pools (Pool ID: 13)
      ETH: {
        1: 13, // Ethereum
        42161: 13, // Arbitrum
        10: 13, // Optimism
        8453: 13, // Base
      },
      // WETH is typically mapped to ETH pool
      WETH: {
        1: 13,
        42161: 13,
        10: 13,
        8453: 13,
      },
    };

    return poolMap[token]?.[chainId] || null;
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    // [DEV-LOG] Request parameters
    console.log(`[${this.name}] API Request:`, {
      fromChainId,
      toChainId,
      token,
      amount,
      sender,
    }); // REMOVE-FOR-PRODUCTION

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`);
    }

    // Map EVM chain IDs to LayerZero chain IDs
    const layerZeroChainMap = {
      1: 101, // Ethereum
      137: 109, // Polygon
      42161: 110, // Arbitrum
      10: 111, // Optimism
      56: 102, // BSC
      43114: 106, // Avalanche
      8453: 184, // Base
      250: 112, // Fantom
    };

    const srcChainId = layerZeroChainMap[fromChainId];
    const dstChainId = layerZeroChainMap[toChainId];

    if (!srcChainId || !dstChainId) {
      throw new Error(
        `${this.name}: Chain not supported (${fromChainId} -> ${toChainId})`
      );
    }

    // Convert amount to smallest unit (e.g., 100 USDT = 100000000)
    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    // Get pool IDs for the token on both chains
    const srcPoolId = this.getPoolId(token, fromChainId);
    const dstPoolId = this.getPoolId(token, toChainId);

    if (!srcPoolId || !dstPoolId) {
      throw new Error(
        `${this.name}: No pool available for ${token} on chain ${fromChainId} -> ${toChainId}`
      );
    }

    const queryParams = new URLSearchParams({
      srcChainId: String(srcChainId),
      dstChainId: String(dstChainId),
      amount: fromAmount,
      srcPoolId: String(srcPoolId),
      dstPoolId: String(dstPoolId),
    });

    const url = `https://api.stargate.finance/v1/quote?${queryParams}`;

    // [DEV-LOG] API URL
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; BridgeAggregator/5.0)",
      },
    });

    // [DEV-LOG] HTTP Response Status
    console.log(`[${this.name}] HTTP Status:`, res.status); // REMOVE-FOR-PRODUCTION

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "No details");
      // [DEV-LOG] Error Response
      console.error(`[${this.name}] API Error:`, errorBody); // REMOVE-FOR-PRODUCTION
      throw new Error(
        `${this.name}: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
      );
    }

    const data = await res.json();

    // [DEV-LOG] Full API Response
    console.log(`[${this.name}] API Response:`, JSON.stringify(data, null, 2)); // REMOVE-FOR-PRODUCTION

    // Validate response structure
    if (!data || typeof data.fee === "undefined") {
      throw new Error(`${this.name}: Invalid response - missing fee data`);
    }

    return this.mapToStandardFormat(data, tokenCfg);
  }

  mapToStandardFormat(apiResponse, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    // Stargate fee is typically in token units (same decimals as the token)
    // Convert from smallest unit to human-readable
    const feeInTokens =
      parseUSD(apiResponse.fee) / Math.pow(10, tokenCfg.decimals);

    // Stargate's API response structure:
    // - fee: total protocol fee in token's smallest unit
    // - amountOut: expected output amount in token's smallest unit
    // - eqFee: equilibrium fee (optional)
    // - eqReward: equilibrium reward (optional)
    // - lpFee: liquidity provider fee (optional)
    // - protocolFee: protocol fee (optional)

    // Parse additional fees if available
    const lpFeeInTokens = apiResponse.lpFee
      ? parseUSD(apiResponse.lpFee) / Math.pow(10, tokenCfg.decimals)
      : 0;

    const protocolFeeInTokens = apiResponse.protocolFee
      ? parseUSD(apiResponse.protocolFee) / Math.pow(10, tokenCfg.decimals)
      : 0;

    // Total bridge fee (in USD equivalent, assuming stablecoin ~= $1)
    const totalBridgeFeeUSD = feeInTokens;

    // IMPORTANT: Stargate's quote API does not include gas cost estimates
    // Gas is paid separately during transaction execution on-chain
    // Users need to check their wallet for current gas prices
    const gasFeeUSD = null; // Not provided by API

    // Stargate typically takes 1-5 minutes depending on network congestion
    const estimatedTimeMinutes = 5;

    return this.formatResponse({
      totalCost: totalBridgeFeeUSD, // Only bridge fee, gas not included
      bridgeFee: totalBridgeFeeUSD,
      gasFee: gasFeeUSD, // null indicates not available
      estimatedTime: `${estimatedTimeMinutes} mins`,
      route: "Stargate Bridge",
      protocol: "LayerZero",
      outputAmount: apiResponse.amountOut,
      isEstimated: false, // Bridge fee is real data
      meta: {
        tool: "stargate",
        fee: apiResponse.fee,
        amountOut: apiResponse.amountOut,
        lpFee: apiResponse.lpFee,
        protocolFee: apiResponse.protocolFee,
        eqFee: apiResponse.eqFee,
        eqReward: apiResponse.eqReward,
        gasNotIncluded: true,
        gasEstimateNote:
          "Gas costs are not included in this quote. Actual gas fees will be shown in your wallet before transaction confirmation. Check current gas prices at: https://polygonscan.com/gastracker (for Polygon) or your wallet's gas estimator.",
      },
    });
  }
}
