// ===== worker/adapters/lifi.js =====
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
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("LI.FI: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);
    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
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

    const res = await this.fetchWithTimeout(
      `https://li.quest/v1/quote?${queryParams}`,
      { headers }
    );

    if (!res.ok) throw new Error(`LI.FI: HTTP ${res.status}`);

    const data = await res.json();
    if (!data?.estimate) throw new Error("LI.FI: Invalid response");

    const est = data.estimate;
    const gasCostUSD = parseFloat(est.gasCosts?.[0]?.amountUSD || "0");
    const feeCostUSD = parseFloat(est.feeCosts?.[0]?.amountUSD || "0");

    return this.formatResponse({
      totalCost: gasCostUSD + feeCostUSD,
      bridgeFee: feeCostUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil((est.executionDuration || 300) / 60)} mins`,
      security: "Audited",
      liquidity: "High",
      route: data.toolDetails?.name || "Best Route",
      outputAmount: est.toAmount,
    });
  }
}
