// worker/adapters/lifi.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class LiFiAdapter extends BridgeAdapter {
  constructor(config) {
    super("LI.FI", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    // Validate chain IDs
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(`LI.FI: Invalid chain pair ${fromChainId}->${toChainId}`);
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`LI.FI: Invalid amount ${amount}`);
    }

    // Validate sender address
    if (!sender || !/^0x[a-fA-F0-9]{40}$/.test(sender)) {
      throw new Error(`LI.FI: Invalid sender address ${sender}`);
    }

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("LI.FI: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    // Validate token addresses exist for chains
    if (!fromToken || fromToken === "undefined") {
      throw new Error(`LI.FI: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`LI.FI: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      slippage: CONFIG.DEFAULT_SLIPPAGE || "0.01",
      integrator: env?.INTEGRATOR_NAME || "BridgeAggregator",
      skipSimulation: "false",
    });

    const headers = { Accept: "application/json" };
    if (env?.LIFI_API_KEY) headers["x-lifi-api-key"] = env.LIFI_API_KEY;

    let res;
    try {
      res = await this.fetchWithTimeout(
        `https://li.quest/v1/quote?${queryParams}`,
        { headers },
      );
    } catch (error) {
      throw new Error(`LI.FI: Network error - ${error.message}`);
    }

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "No error details");
      throw new Error(
        `LI.FI: HTTP ${res.status} - ${errorBody.substring(0, 200)}`,
      );
    }

    const data = await res.json();

    if (!data?.estimate) {
      throw new Error(`LI.FI: Invalid response structure - missing estimate`);
    }

    const est = data.estimate;

    // Helper to sum USD values from array
    const sumUSD = (arr) =>
      (arr || []).reduce((s, x) => {
        const val = parseFloat(x?.amountUSD || "0");
        return s + (isNaN(val) ? 0 : val);
      }, 0);

    // Calculate gas and network fees
    const gasCostUSD = sumUSD(est.gasCosts);
    const networkFeeUSD = sumUSD(est.networkFees);

    // Extract protocol/bridge fees (only non-included fees)
    const feeCostUSD = (est.feeCosts || [])
      .filter((f) => !f?.included)
      .reduce((s, f) => {
        const val = parseFloat(f?.amountUSD || "0");
        return s + (isNaN(val) ? 0 : val);
      }, 0);

    const totalCostUSD = gasCostUSD + networkFeeUSD + feeCostUSD;

    // Round to 2 decimal places
    const roundUSD = (val) => Math.round(val * 100) / 100;

    return this.formatResponse({
      totalCost: roundUSD(totalCostUSD),
      bridgeFee: roundUSD(feeCostUSD),
      gasFee: roundUSD(gasCostUSD + networkFeeUSD),
      estimatedTime: `${Math.ceil((est.executionDuration || 300) / 60)} mins`,
      security: "Audited",
      liquidity: "High",
      route: data.toolDetails?.name || "Best Route",
      outputAmount: est.toAmount || null,
      protocol: "LI.FI",
      meta: {
        fromToken,
        toToken,
        fromAmountUSD: parseFloat(est.fromAmountUSD || "0"),
        toAmountUSD: parseFloat(est.toAmountUSD || "0"),
        fees: [
          { name: "Gas", amount: roundUSD(gasCostUSD) },
          { name: "Network", amount: roundUSD(networkFeeUSD) },
          { name: "Protocol", amount: roundUSD(feeCostUSD) },
        ],
        tool: data.toolDetails?.key || data.toolDetails?.name,
      },
    });
  }
}
