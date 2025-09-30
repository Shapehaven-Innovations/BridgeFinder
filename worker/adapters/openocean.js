// worker/adapters/openocean.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class OpenOceanAdapter extends BridgeAdapter {
  constructor(config) {
    super("OpenOcean", config);
    this.icon = "🌊";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("OpenOcean: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`OpenOcean: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`OpenOcean: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      inTokenAddress: fromToken,
      outTokenAddress: toToken,
      amount: fromAmount,
      slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE) * 100,
      account: sender,
      gasPrice: "5",
    });

    try {
      const chain = this.mapChainToOpenOcean(fromChainId);
      const res = await this.fetchWithTimeout(
        `https://open-api.openocean.finance/v3/${chain}/quote?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`OpenOcean: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.data) {
        throw new Error("OpenOcean: No quote found");
      }

      const quote = data.data;
      const estimatedGas = parseFloat(quote.estimatedGas || "0");
      const gasPrice = parseFloat(quote.gasPrice || "5") / 1e9;
      const gasUSD = (estimatedGas * gasPrice * 2000) / 1e18;

      const priceImpact = parseFloat(quote.priceImpact || "0");
      const feeUSD = Math.abs(priceImpact) * parseFloat(amount);

      return this.formatResponse({
        totalCost: gasUSD + feeUSD,
        bridgeFee: feeUSD,
        gasFee: gasUSD,
        estimatedTime: "1-2 mins",
        security: "DEX Aggregator",
        liquidity: "High",
        route: "OpenOcean",
        outputAmount: quote.outAmount,
        protocol: "OpenOcean",
        meta: {
          fees: [
            { name: "Price Impact", amount: feeUSD },
            { name: "Gas", amount: gasUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 7,
        bridgeFee: 2,
        gasFee: 5,
        estimatedTime: "1-2 mins",
        security: "DEX Aggregator",
        liquidity: "High",
        route: "OpenOcean",
        protocol: "OpenOcean",
        isEstimated: true,
      });
    }
  }

  mapChainToOpenOcean(chainId) {
    const map = {
      1: "eth",
      137: "polygon",
      42161: "arbitrum",
      10: "optimism",
      56: "bsc",
      43114: "avax",
      8453: "base",
      250: "fantom",
    };
    return map[chainId] || "eth";
  }
}
