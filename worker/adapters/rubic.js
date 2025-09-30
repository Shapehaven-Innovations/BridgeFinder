// worker/adapters/rubic.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class RubicAdapter extends BridgeAdapter {
  constructor(config) {
    super("Rubic", config);
    this.icon = "💎";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Rubic: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`Rubic: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`Rubic: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const body = {
      srcTokenAddress: fromToken,
      srcTokenAmount: fromAmount,
      srcTokenBlockchain: this.mapChainToRubic(fromChainId),
      dstTokenAddress: toToken,
      dstTokenBlockchain: this.mapChainToRubic(toChainId),
      fromAddress: sender,
    };

    try {
      const res = await this.fetchWithTimeout(
        "https://api-v2.rubic.exchange/api/routes/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        throw new Error(`Rubic: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.bestTrade) {
        throw new Error("Rubic: No route found");
      }

      const trade = data.bestTrade;
      const feeUSD = parseFloat(trade.priceImpact || "0") * parseFloat(amount);
      const gasUSD = parseFloat(trade.gasPrice || "5");

      return this.formatResponse({
        totalCost: feeUSD + gasUSD,
        bridgeFee: feeUSD,
        gasFee: gasUSD,
        estimatedTime: `${Math.ceil((trade.estimatedTime || 600) / 60)} mins`,
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: trade.type || "Rubic Route",
        outputAmount: trade.to.tokenAmount,
        protocol: "Rubic",
        meta: {
          fees: [
            { name: "Price Impact", amount: feeUSD },
            { name: "Gas", amount: gasUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 9,
        bridgeFee: 3.5,
        gasFee: 5.5,
        estimatedTime: "5-10 mins",
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: "Rubic Route",
        protocol: "Rubic",
        isEstimated: true,
      });
    }
  }

  mapChainToRubic(chainId) {
    const map = {
      1: "ETH",
      137: "POLYGON",
      42161: "ARBITRUM",
      10: "OPTIMISM",
      56: "BSC",
      43114: "AVALANCHE",
      8453: "BASE",
      250: "FANTOM",
    };
    return map[chainId] || "ETH";
  }
}
