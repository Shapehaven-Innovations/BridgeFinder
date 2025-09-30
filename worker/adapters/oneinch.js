// worker/adapters/oneinch.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class OneInchAdapter extends BridgeAdapter {
  constructor(config) {
    super("1inch", config);
    this.icon = "🦄";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("1inch: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`1inch: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`1inch: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const isCrossChain = fromChainId !== toChainId;

    const queryParams = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: fromAmount,
      from: sender,
      slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE) * 100,
      disableEstimate: "false",
      allowPartialFill: "false",
    });

    try {
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${env?.ONEINCH_API_KEY || ""}`,
      };

      const endpoint = isCrossChain
        ? `https://api.1inch.dev/fusion/quoter/v1.0/${fromChainId}/quote/receive`
        : `https://api.1inch.dev/swap/v5.2/${fromChainId}/quote`;

      const res = await this.fetchWithTimeout(`${endpoint}?${queryParams}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`1inch: HTTP ${res.status}`);
      }

      const data = await res.json();

      const estimatedGas = parseFloat(data.estimatedGas || "0");
      const gasPrice = parseFloat(data.gasPrice || "5") / 1e9;
      const gasUSD = (estimatedGas * gasPrice * 2000) / 1e18;

      const protocolFee = isCrossChain ? 2 : 0;

      return this.formatResponse({
        totalCost: gasUSD + protocolFee,
        bridgeFee: protocolFee,
        gasFee: gasUSD,
        estimatedTime: isCrossChain ? "3-5 mins" : "1-2 mins",
        security: "Audited",
        liquidity: "High",
        route: isCrossChain ? "1inch Fusion+" : "1inch Aggregator",
        outputAmount: data.toAmount || data.dstAmount,
        protocol: "1inch",
        meta: {
          fees: [
            { name: "Protocol Fee", amount: protocolFee },
            { name: "Gas", amount: gasUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 7,
        bridgeFee: 2,
        gasFee: 5,
        estimatedTime: fromChainId !== toChainId ? "3-5 mins" : "1-2 mins",
        security: "Audited",
        liquidity: "High",
        route: fromChainId !== toChainId ? "1inch Fusion+" : "1inch Aggregator",
        protocol: "1inch",
        isEstimated: true,
      });
    }
  }
}
