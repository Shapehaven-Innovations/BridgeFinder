// ===== worker/adapters/lifi.js =====

import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

class LiFiAdapter extends BridgeAdapter {
  constructor(config) {
    super("LI.FI", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("LI.FI: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);
    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    if (!fromToken || !toToken) {
      throw new Error(
        `LI.FI: token mapping missing for ${token} on chain ${fromChainId}->${toChainId}`
      );
    }

    const queryParams = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      slippage: CONFIG.DEFAULT_SLIPPAGE,
      integrator: env?.INTEGRATOR_NAME || "BridgeAggregator",
      // Optional knobs:
      // maxPriceImpact: "0.05",
      // allowBridges: "stargate,cctp",
    });

    const headers = { Accept: "application/json" };
    if (env?.LIFI_API_KEY) headers["x-lifi-api-key"] = env.LIFI_API_KEY;

    const res = await this.fetchWithTimeout(
      `https://li.quest/v1/quote?${queryParams}`,
      { headers }
    );
    if (!res.ok) throw new Error(`LI.FI: HTTP ${res.status}`);

    const data = await res.json();
    if (!data?.estimate) throw new Error("LI.FI: Invalid response");

    const est = data.estimate;

    // Helpers
    const sumUSD = (arr) =>
      (arr || []).reduce(
        (s, x) => s + (parseFloat(x?.amountUSD || "0") || 0),
        0
      );
    const gasCostUSD = sumUSD(est.gasCosts);
    const networkFeeUSD = sumUSD(est.networkFees); // may be present
    const feeCostUSD = (est.feeCosts || [])
      .filter((f) => !f?.included)
      .reduce((s, f) => s + (parseFloat(f?.amountUSD || "0") || 0), 0);

    const summedCostsUSD = gasCostUSD + networkFeeUSD + feeCostUSD;

    // Sanity check against LI.FI's own USD in/out
    const fromUsd = parseFloat(est.fromAmountUSD || "0") || 0;
    const toUsd = parseFloat(est.toAmountUSD || "0") || 0;
    const impliedCostUSD = Math.max(0, fromUsd - toUsd);

    const totalCostUSD = Math.max(summedCostsUSD, impliedCostUSD);

    return this.formatResponse({
      totalCost: totalCostUSD,
      bridgeFee: feeCostUSD,
      gasFee: gasCostUSD + networkFeeUSD,
      estimatedTime: `${Math.ceil((est.executionDuration || 300) / 60)} mins`,
      security: "Audited",
      liquidity: "High",
      route: data.toolDetails?.name || "Best Route",
      outputAmount: est.toAmount, // smallest units
      meta: {
        fromToken,
        toToken,
        fromUsd,
        toUsd,
        gasCostUSD,
        networkFeeUSD,
        feeCostUSD,
        summedCostsUSD,
        impliedCostUSD,
        tool: data.toolDetails?.key || data.toolDetails?.name,
      },
    });
  }
}

// ✅ Named export to satisfy: import { LiFiAdapter } from "./adapters/lifi.js";
export { LiFiAdapter };
