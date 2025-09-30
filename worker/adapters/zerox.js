// worker/adapters/zerox.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class ZeroXAdapter extends BridgeAdapter {
  constructor(config) {
    super("0x", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    if (fromChainId !== toChainId) {
      return this.formatResponse({
        totalCost: 10,
        bridgeFee: 4,
        gasFee: 6,
        estimatedTime: "5-10 mins",
        security: "Audited",
        liquidity: "High",
        route: "0x Protocol",
        protocol: "0x",
        isEstimated: true,
      });
    }

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("0x: unknown token");

    const buyToken = this.getTokenAddress(token, toChainId);
    const sellToken = this.getTokenAddress(token, fromChainId);

    if (!buyToken || buyToken === "undefined") {
      throw new Error(`0x: No ${token} address on chain ${toChainId}`);
    }
    if (!sellToken || sellToken === "undefined") {
      throw new Error(`0x: No ${token} address on chain ${fromChainId}`);
    }

    const sellAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      buyToken,
      sellToken,
      sellAmount,
      takerAddress: sender,
      slippagePercentage: CONFIG.DEFAULT_SLIPPAGE,
    });

    try {
      const headers = {
        Accept: "application/json",
      };

      if (env?.ZEROX_API_KEY) {
        headers["0x-api-key"] = env.ZEROX_API_KEY;
      }

      const res = await this.fetchWithTimeout(
        `https://api.0x.org/swap/v1/quote?${queryParams}`,
        { headers },
      );

      if (!res.ok) {
        throw new Error(`0x: HTTP ${res.status}`);
      }

      const data = await res.json();

      const gasPrice = parseFloat(data.gasPrice || "0") / 1e9;
      const gas = parseFloat(data.gas || "0");
      const gasUSD = (gas * gasPrice * 2000) / 1e18;

      const protocolFee = (parseFloat(data.protocolFee || "0") / 1e18) * 2000;

      return this.formatResponse({
        totalCost: gasUSD + protocolFee,
        bridgeFee: protocolFee,
        gasFee: gasUSD,
        estimatedTime: "1-2 mins",
        security: "Audited",
        liquidity: "High",
        route: "0x Protocol",
        outputAmount: data.buyAmount,
        protocol: "0x",
        meta: {
          fees: [
            { name: "Protocol Fee", amount: protocolFee },
            { name: "Gas", amount: gasUSD },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 6,
        bridgeFee: 1,
        gasFee: 5,
        estimatedTime: "1-2 mins",
        security: "Audited",
        liquidity: "High",
        route: "0x Protocol",
        protocol: "0x",
        isEstimated: true,
      });
    }
  }
}
