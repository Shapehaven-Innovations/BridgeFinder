// worker/adapters/rubic.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class RubicAdapter extends BridgeAdapter {
  constructor(config) {
    super("Rubic", config);
    this.icon = "💎";
    console.log("[Rubic] Adapter initialized");
  }

  async getQuote(params, env) {
    console.log(
      "[Rubic] Starting getQuote with params:",
      JSON.stringify(params),
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
        toBlockchain,
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
        },
      );

      console.log("[Rubic] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "No error details");
        console.error("[Rubic] HTTP Error:", res.status, errorBody);

        // Check for API downtime - RETURN immediately, don't throw
        if (res.status >= 500) {
          console.log(
            "[Rubic] API is experiencing issues - returning unavailable status",
          );
          return this.formatResponse({
            totalCost: null,
            bridgeFee: null,
            gasFee: null,
            estimatedTime: "N/A",
            security: "Multi-Bridge",
            liquidity: "Aggregated",
            route: "API Unavailable",
            protocol: "Rubic",
            unavailable: true,
            unavailableReason: "API experiencing issues",
            unavailableDetails:
              "Rubic's API is currently experiencing internal errors. Please try again in a few minutes.",
          });
        }

        // Check for no routes found
        if (res.status === 404 || errorBody.includes("No route")) {
          console.log("[Rubic] No routes found for this pair");
          return this.formatResponse({
            totalCost: null,
            bridgeFee: null,
            gasFee: null,
            estimatedTime: "N/A",
            security: "Multi-Bridge",
            liquidity: "Aggregated",
            route: "No Route Found",
            protocol: "Rubic",
            unavailable: true,
            unavailableReason: "No route available",
            unavailableDetails:
              "Rubic couldn't find a route for this token pair. Try different tokens or chains.",
          });
        }

        // For other errors, throw to be caught by outer catch
        throw new Error(
          `Rubic: HTTP ${res.status} - ${errorBody.substring(0, 200)}`,
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
        JSON.stringify(response, null, 2),
      );
      return response;
    } catch (error) {
      console.error("[Rubic] ERROR:", error.message);
      console.error("[Rubic] Full error:", error);
      console.error("[Rubic] Stack trace:", error.stack);

      // Return unavailable status for any uncaught errors
      console.log("[Rubic] Returning unavailable status");
      return this.formatResponse({
        totalCost: null,
        bridgeFee: null,
        gasFee: null,
        estimatedTime: "N/A",
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: "Temporarily Unavailable",
        protocol: "Rubic",
        unavailable: true,
        unavailableReason: "Service error",
        unavailableDetails:
          "Rubic encountered an unexpected error. Please try again later.",
      });
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(`Rubic: Invalid chain pair ${fromChainId}->${toChainId}`);
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`Rubic: Invalid amount ${amount}`);
    }

    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`Rubic: Invalid sender address ${sender}`);
    }
  }

  calculateCosts(trade, amount) {
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    const priceImpactPct = parseUSD(trade.priceImpact);
    const priceImpact = (priceImpactPct / 100) * parseFloat(amount);

    const gasFee = parseUSD(trade.gasPrice || trade.gasCost?.usd);
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
