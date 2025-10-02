// worker/adapters/lifi.js - THIN ADAPTER (No hardcoded business data)
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

//LiFi Adapter - Thin Implementation

export class LiFiAdapter extends BridgeAdapter {
  constructor(config) {
    super("LI.FI", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender, slippage } = params;

    // Get token configuration
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`);
    }

    // Resolve token addresses
    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken) {
      throw new Error(`${this.name}: No ${token} on chain ${fromChainId}`);
    }
    if (!toToken) {
      throw new Error(`${this.name}: No ${token} on chain ${toChainId}`);
    }

    // Convert amount to blockchain units
    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    // Build API request
    const queryParams = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      slippage: slippage || CONFIG.DEFAULT_SLIPPAGE || "0.01",
      integrator: env?.INTEGRATOR_NAME || "BridgeAggregator",
      skipSimulation: "false",
    });

    const headers = { Accept: "application/json" };
    if (env?.LIFI_API_KEY) {
      headers["x-lifi-api-key"] = env.LIFI_API_KEY;
    }

    const url = `https://li.quest/v1/quote?${queryParams}`;

    // Make API call
    const res = await this.fetchWithTimeout(url, { headers });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "No details");
      throw new Error(
        `${this.name}: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
      );
    }

    const data = await res.json();

    // Validate API response structure
    if (!data?.estimate) {
      throw new Error(`${this.name}: Invalid response - missing estimate`);
    }

    // Map to standard format
    return this.mapToStandardFormat(data);
  }

  /**
   * Map LiFi API response to standard format
   *
   * THIN ADAPTER: Only returns data from API
   */
  mapToStandardFormat(apiResponse) {
    const { estimate, toolDetails } = apiResponse;

    // Helper to safely parse USD strings
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    // Helper to round to 2 decimals
    const roundUSD = (value) => Math.round(parseUSD(value) * 100) / 100;

    // Sum fee costs from API (minimal aggregation - acceptable)
    const totalFeeCostUSD = (estimate.feeCosts || []).reduce(
      (sum, fee) => sum + parseUSD(fee.amountUSD),
      0
    );

    // Sum gas costs from API (minimal aggregation - acceptable)
    const totalGasCostUSD = (estimate.gasCosts || []).reduce(
      (sum, gas) => sum + parseUSD(gas.amountUSD),
      0
    );

    // Total cost
    const totalCostUSD = totalFeeCostUSD + totalGasCostUSD;

    // Convert execution duration from seconds to minutes
    const executionMinutes = Math.ceil(
      (estimate.executionDuration || 300) / 60
    );

    // Return standard format - ONLY data from API
    return this.formatResponse({
      // Financial data (from API)
      totalCost: roundUSD(totalCostUSD),
      bridgeFee: roundUSD(totalFeeCostUSD),
      gasFee: roundUSD(totalGasCostUSD),
      outputAmount: estimate.toAmount,

      // Timing (from API)
      estimatedTime: `${executionMinutes} mins`,

      // Route info (from API)
      route: toolDetails?.name || "Best Route",
      protocol: "LI.FI",

      // API data for handler enrichment and debugging
      meta: {
        // Tool information for protocol lookup
        tool: estimate.tool, // e.g., "across"
        toolKey: toolDetails?.key, // e.g., "across"
        toolName: toolDetails?.name, // e.g., "AcrossV4"
        toolLogoURI: toolDetails?.logoURI,

        // Amounts and timing
        approvalAddress: estimate.approvalAddress,
        toAmountMin: estimate.toAmountMin,
        fromAmount: estimate.fromAmount,
        executionDuration: estimate.executionDuration,
        fromAmountUSD: estimate.fromAmountUSD,
        toAmountUSD: estimate.toAmountUSD,

        // Raw cost arrays for debugging
        feeCosts: estimate.feeCosts,
        gasCosts: estimate.gasCosts,
      },
    });
  }
}
