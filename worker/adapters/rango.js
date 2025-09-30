// worker/adapters/rango.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class RangoAdapter extends BridgeAdapter {
  constructor(config) {
    super("Rango", config);
    this.icon = "🦘";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Rango: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`Rango: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`Rango: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const body = {
      from: {
        blockchain: this.mapChainToRango(fromChainId),
        symbol: token,
        address: fromToken,
      },
      to: {
        blockchain: this.mapChainToRango(toChainId),
        symbol: token,
        address: toToken,
      },
      amount: fromAmount,
      fromAddress: sender,
      toAddress: sender,
      slippage: CONFIG.DEFAULT_SLIPPAGE,
      disableEstimate: false,
    };

    try {
      const res = await this.fetchWithTimeout(
        "https://api.rango.exchange/routing/best",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-KEY": "c6381a79-2817-4602-83bf-6a641a409e32", // Public demo key
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error(`Rango: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.route) {
        throw new Error("Rango: No route found");
      }

      const route = data.route;
      const feeUSD = parseFloat(route.fee?.totalFee?.usdValue || "0");
      const gasUSD =
        (parseFloat(route.estimatedTimeInSeconds || "300") / 60) * 0.5;

      return this.formatResponse({
        totalCost: feeUSD + gasUSD,
        bridgeFee: feeUSD,
        gasFee: gasUSD,
        estimatedTime: `${Math.ceil(
          (route.estimatedTimeInSeconds || 300) / 60
        )} mins`,
        security: "Multi-Protocol",
        liquidity: "Aggregated",
        route: route.swapper?.title || "Rango Route",
        outputAmount: route.outputAmount,
        protocol: "Rango",
        meta: {
          fees: [
            { name: "Protocol Fee", amount: feeUSD },
            { name: "Gas (est)", amount: gasUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 8,
        bridgeFee: 3,
        gasFee: 5,
        estimatedTime: "5-10 mins",
        security: "Multi-Protocol",
        liquidity: "Aggregated",
        route: "Rango Route",
        protocol: "Rango",
        isEstimated: true,
      });
    }
  }

  mapChainToRango(chainId) {
    const map = {
      1: "ETH",
      137: "POLYGON",
      42161: "ARBITRUM",
      10: "OPTIMISM",
      56: "BSC",
      43114: "AVAX_CCHAIN",
      8453: "BASE",
      250: "FANTOM",
    };
    return map[chainId] || "ETH";
  }
}
