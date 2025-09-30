// worker/adapters/squid.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class SquidAdapter extends BridgeAdapter {
  constructor(config) {
    super("Squid", config);
    this.icon = "🦑";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Squid: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`Squid: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`Squid: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const body = {
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      toAddress: sender,
      slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE),
      enableBoost: true,
    };

    try {
      const res = await this.fetchWithTimeout(
        "https://api.0xsquid.com/v1/route",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-integrator-id": env?.INTEGRATOR_NAME || "bridge-aggregator",
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        throw new Error(`Squid: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.route) {
        throw new Error("Squid: No route found");
      }

      const route = data.route;
      const gasCostUSD =
        parseFloat(route.estimate.gasCosts?.amount || "0") / 1e6;
      const feeCostUSD = parseFloat(
        route.estimate.feeCosts?.[0]?.amountUSD || "0",
      );

      return this.formatResponse({
        totalCost: gasCostUSD + feeCostUSD,
        bridgeFee: feeCostUSD,
        gasFee: gasCostUSD,
        estimatedTime: `${Math.ceil(
          route.estimate.estimatedRouteDuration / 60,
        )} mins`,
        security: "Axelar GMP",
        liquidity: "High",
        route: "Squid Router",
        outputAmount: route.estimate.toAmount,
        protocol: "Axelar",
        meta: {
          fees: [
            { name: "Gas", amount: gasCostUSD },
            { name: "Bridge Fee", amount: feeCostUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 7,
        bridgeFee: 2.5,
        gasFee: 4.5,
        estimatedTime: "2-5 mins",
        security: "Axelar GMP",
        liquidity: "High",
        route: "Squid Router",
        protocol: "Axelar",
        isEstimated: true,
      });
    }
  }
}
