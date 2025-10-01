// worker/adapters/rubic.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class RubicAdapter extends BridgeAdapter {
  constructor(config) {
    super("Rubic", config);
    this.icon = "💎";
  }

  async getQuote(params, env) {
    console.log(
      "[Rubic] Starting getQuote with params:",
      JSON.stringify(params)
    );

    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    try {
      console.log("[Rubic] Validating inputs...");
      this.validateInputs(fromChainId, toChainId, token, amount, sender);

      const tokenCfg = TOKENS[token];
      if (!tokenCfg) {
        console.error("[Rubic] Unknown token:", token);
        throw new Error("Rubic: Unknown token");
      }
      console.log("[Rubic] Token config:", tokenCfg);

      const fromToken = this.getTokenAddress(token, fromChainId);
      const toToken = this.getTokenAddress(token, toChainId);
      console.log("[Rubic] Token addresses - from:", fromToken, "to:", toToken);

      // Validate token addresses exist for chains
      if (!fromToken || fromToken === "undefined") {
        throw new Error(`Rubic: No ${token} address on chain ${fromChainId}`);
      }
      if (!toToken || toToken === "undefined") {
        throw new Error(`Rubic: No ${token} address on chain ${toChainId}`);
      }

      const fromAmount = this.toUnits(amount, tokenCfg.decimals);
      console.log("[Rubic] From amount in units:", fromAmount);

      const fromBlockchain = this.mapChainToRubic(fromChainId);
      const toBlockchain = this.mapChainToRubic(toChainId);
      console.log(
        "[Rubic] Chain mapping - from:",
        fromBlockchain,
        "to:",
        toBlockchain
      );

      const body = {
        srcTokenAddress: fromToken,
        srcTokenAmount: fromAmount,
        srcTokenBlockchain: fromBlockchain,
        dstTokenAddress: toToken,
        dstTokenBlockchain: toBlockchain,
        fromAddress: sender,
      };

      console.log("[Rubic] Request body:", JSON.stringify(body, null, 2));

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

      console.log("[Rubic] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "No error details");
        console.error("[Rubic] HTTP Error:", res.status, errorBody);
        throw new Error(
          `Rubic: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
        );
      }

      const data = await res.json();
      console.log("[Rubic] API Response:", JSON.stringify(data, null, 2));

      if (!data.bestTrade) {
        console.error("[Rubic] No route found in response:", data);
        throw new Error("Rubic: No route found");
      }

      const costs = this.calculateCosts(data.bestTrade, amount);
      console.log("[Rubic] Calculated costs:", costs);

      const roundUSD = (val) => Math.round(val * 100) / 100;

      const response = this.formatResponse({
        totalCost: roundUSD(costs.totalCost),
        bridgeFee: roundUSD(costs.bridgeFee),
        gasFee: roundUSD(costs.gasFee),
        estimatedTime: `${Math.ceil((data.bestTrade.estimatedTime || 600) / 60)} mins`,
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: data.bestTrade.type || "Rubic Route",
        outputAmount: data.bestTrade.to?.tokenAmount || null,
        protocol: "Rubic",
        meta: {
          fromToken,
          toToken,
          fromAmountUSD: roundUSD(parseFloat(amount)),
          toAmountUSD: roundUSD(parseFloat(amount) - costs.bridgeFee),
          fees: [
            { name: "Price Impact", amount: roundUSD(costs.priceImpact) },
            { name: "Gas", amount: roundUSD(costs.gasFee) },
          ],
          tradeType: data.bestTrade.type,
          priceImpactPct: roundUSD(costs.priceImpactPct),
        },
      });

      console.log(
        "[Rubic] Success! Returning response:",
        JSON.stringify(response, null, 2)
      );
      return response;
    } catch (error) {
      console.error("[Rubic] ERROR:", error.message);
      console.error("[Rubic] Full error:", error);
      console.error("[Rubic] Stack trace:", error.stack);

      // Fallback response on any error
      const fallbackResponse = this.formatResponse({
        totalCost: 9.0,
        bridgeFee: 3.5,
        gasFee: 5.5,
        estimatedTime: "5-10 mins",
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: "Rubic Route",
        protocol: "Rubic",
        isEstimated: true,
      });

      console.log(
        "[Rubic] Returning fallback response:",
        JSON.stringify(fallbackResponse, null, 2)
      );
      return fallbackResponse;
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    // Validate chain IDs
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(`Rubic: Invalid chain pair ${fromChainId}->${toChainId}`);
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`Rubic: Invalid amount ${amount}`);
    }

    // Validate sender address
    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`Rubic: Invalid sender address ${sender}`);
    }
  }

  calculateCosts(trade, amount) {
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate price impact fee
    const priceImpactPct = parseUSD(trade.priceImpact);
    const priceImpact = (priceImpactPct / 100) * parseFloat(amount);

    // Calculate gas costs
    const gasFee = parseUSD(trade.gasPrice || trade.gasCost?.usd);

    // If no gas fee is provided, estimate based on chain
    const estimatedGas = gasFee > 0 ? gasFee : 5.0;

    const bridgeFee = priceImpact;
    const totalCost = bridgeFee + estimatedGas;

    return {
      priceImpact,
      priceImpactPct,
      gasFee: estimatedGas,
      bridgeFee,
      totalCost,
    };
  }

  mapChainToRubic(chainId) {
    const map = {
      1: "ETH",
      10: "OPTIMISM",
      56: "BSC",
      137: "POLYGON",
      250: "FANTOM",
      8453: "BASE",
      42161: "ARBITRUM",
      43114: "AVALANCHE",
    };

    const mapped = map[chainId];
    if (!mapped) {
      console.warn(`[Rubic] Unknown chain ID ${chainId}, defaulting to ETH`);
      return "ETH";
    }

    return mapped;
  }
}
