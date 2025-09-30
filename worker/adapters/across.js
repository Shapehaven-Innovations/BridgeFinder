// worker/adapters/across.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class AcrossAdapter extends BridgeAdapter {
  constructor(config) {
    super("Across", config);
    this.icon = "⚡";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Across: unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`Across: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`Across: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      originChainId: String(fromChainId),
      destinationChainId: String(toChainId),
      token: fromToken,
      amount: fromAmount,
      depositor: sender,
      recipient: sender,
    });

    try {
      const res = await this.fetchWithTimeout(
        `https://app.across.to/api/suggested-fees?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Across: HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.totalRelayFee) {
        throw new Error("Across: No quote found");
      }

      const relayFeeUSD =
        (parseFloat(data.totalRelayFee.pct) / 100) * parseFloat(amount);
      const gasEstimate = 3;

      return this.formatResponse({
        totalCost: relayFeeUSD + gasEstimate,
        bridgeFee: relayFeeUSD,
        gasFee: gasEstimate,
        estimatedTime: "2-4 mins",
        security: "Optimistic Oracle",
        liquidity: "High",
        route: "Across Bridge",
        outputAmount: data.expectedFillTime
          ? String(BigInt(fromAmount) - BigInt(data.totalRelayFee.total || "0"))
          : null,
        protocol: "Across",
        meta: {
          fees: [
            { name: "Relay Fee", amount: relayFeeUSD },
            { name: "Gas (est)", amount: gasEstimate },
          ],
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 5,
        bridgeFee: 2,
        gasFee: 3,
        estimatedTime: "2-4 mins",
        security: "Optimistic Oracle",
        liquidity: "High",
        route: "Across Bridge",
        protocol: "Across",
        isEstimated: true,
      });
    }
  }
}
