// worker/adapters/xyfinance.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class XYFinanceAdapter extends BridgeAdapter {
  constructor(config) {
    super("XY Finance", config);
    this.icon = "⚡";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("XY Finance: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(
        `XY Finance: No ${token} address on chain ${fromChainId}`,
      );
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`XY Finance: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      srcChainId: String(fromChainId),
      srcQuoteTokenAddress: fromToken,
      srcQuoteTokenAmount: fromAmount,
      dstChainId: String(toChainId),
      dstQuoteTokenAddress: toToken,
      slippage: CONFIG.DEFAULT_SLIPPAGE,
      receiver: sender,
    });

    try {
      const res = await this.fetchWithTimeout(
        `https://open-api.xy.finance/v1/quote?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`XY Finance: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.success || !data.routes?.[0]) {
        throw new Error("XY Finance: No route found");
      }

      const route = data.routes[0];
      const feeUSD = parseFloat(route.bridgeFee?.amount || "0") / 1e6;
      const gasUSD = (parseFloat(route.gasFee?.amount || "0") / 1e18) * 2000;

      return this.formatResponse({
        totalCost: feeUSD + gasUSD,
        bridgeFee: feeUSD,
        gasFee: gasUSD,
        estimatedTime: `${Math.ceil((route.estimatedTime || 180) / 60)} mins`,
        security: "Y Pool",
        liquidity: "High",
        route: "XY Finance",
        outputAmount: route.dstQuoteTokenAmount,
        protocol: "Y Pool",
        meta: {
          fees: [
            { name: "Bridge Fee", amount: feeUSD },
            { name: "Gas", amount: gasUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 6.5,
        bridgeFee: 2,
        gasFee: 4.5,
        estimatedTime: "3-5 mins",
        security: "Y Pool",
        liquidity: "High",
        route: "XY Finance",
        protocol: "Y Pool",
        isEstimated: true,
      });
    }
  }
}
