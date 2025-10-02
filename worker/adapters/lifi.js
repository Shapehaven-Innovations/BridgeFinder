// worker/adapters/lifi.js - REFACTORED TO THIN ADAPTER PATTERN
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class LiFiAdapter extends BridgeAdapter {
  constructor(config) {
    super("LI.FI", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    // Rate limiting (infrastructure concern - OK in adapter)
    await this.checkRateLimit();

    // Extract parameters (validation already done in handler)
    const { fromChainId, toChainId, token, amount, sender, slippage } = params;

    // Get token configuration
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`);
    }

    // Resolve token addresses (utility - OK in adapter)
    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken) {
      throw new Error(`${this.name}: No ${token} on chain ${fromChainId}`);
    }
    if (!toToken) {
      throw new Error(`${this.name}: No ${token} on chain ${toChainId}`);
    }

    // Convert amount to blockchain units (utility - OK in adapter)
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

    // Map to standard format (THIN - no calculations)
    return this.mapToStandardFormat(data);
  }

  mapToStandardFormat(apiResponse) {
    const { estimate, toolDetails } = apiResponse;

    // Helper: safely parse and round USD values
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const roundUSD = (value) => Math.round(parseUSD(value) * 100) / 100;

    // Sum gas costs from API array (minimal aggregation - acceptable)
    const totalGasCostUSD = (estimate.gasCosts || []).reduce(
      (sum, gas) => sum + parseUSD(gas.amountUSD),
      0
    );

    // Sum fee costs from API array (minimal aggregation - acceptable)
    const totalFeeCostUSD = (estimate.feeCosts || []).reduce(
      (sum, fee) => sum + parseUSD(fee.amountUSD),
      0
    );

    // Total cost
    const totalCostUSD = totalGasCostUSD + totalFeeCostUSD;

    // Convert execution duration to minutes
    const executionMinutes = Math.ceil(
      (estimate.executionDuration || 300) / 60
    );

    // Return standard format
    return this.formatResponse({
      // Financial data (from API)
      totalCost: roundUSD(totalCostUSD),
      bridgeFee: roundUSD(totalFeeCostUSD),
      gasFee: roundUSD(totalGasCostUSD),
      outputAmount: estimate.toAmount,

      // Metadata (from API)
      estimatedTime: `${executionMinutes} mins`,
      security: "Audited",
      liquidity: "High",
      route: toolDetails?.name || "Best Route",
      protocol: "LI.FI",

      // Include full API response in meta for transparency/debugging
      meta: {
        tool: estimate.tool,
        approvalAddress: estimate.approvalAddress,
        toAmountMin: estimate.toAmountMin,
        toAmount: estimate.toAmount,
        fromAmount: estimate.fromAmount,
        executionDuration: estimate.executionDuration,
        fromAmountUSD: roundUSD(estimate.fromAmountUSD),
        toAmountUSD: roundUSD(estimate.toAmountUSD),
        toolDetails: {
          key: toolDetails?.key,
          name: toolDetails?.name,
          logoURI: toolDetails?.logoURI,
        },
        // Preserve breakdown for debugging
        gasCosts: estimate.gasCosts,
        feeCosts: estimate.feeCosts,
      },
    });
  }
}
