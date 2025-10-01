// worker/adapters/lifi.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class LiFiAdapter extends BridgeAdapter {
  constructor(config) {
    super("LI.FI", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    console.log(
      "[LiFi] Starting getQuote with params:",
      JSON.stringify(params)
    );

    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender, slippage } = params;

    try {
      console.log("[LiFi] Validating inputs...");
      this.validateInputs(fromChainId, toChainId, token, amount, sender);

      const tokenCfg = TOKENS[token];
      if (!tokenCfg) {
        console.error("[LiFi] Unknown token:", token);
        throw new Error("LI.FI: Unknown token");
      }
      console.log("[LiFi] Token config:", tokenCfg);

      const fromToken = this.getTokenAddress(token, fromChainId);
      const toToken = this.getTokenAddress(token, toChainId);
      console.log("[LiFi] Token addresses - from:", fromToken, "to:", toToken);

      // Validate token addresses exist for chains
      if (!fromToken || fromToken === "undefined") {
        throw new Error(`LI.FI: No ${token} address on chain ${fromChainId}`);
      }
      if (!toToken || toToken === "undefined") {
        throw new Error(`LI.FI: No ${token} address on chain ${toChainId}`);
      }

      const fromAmount = this.toUnits(amount, tokenCfg.decimals);
      console.log("[LiFi] From amount in units:", fromAmount);

      // Use slippage from params, fallback to 0.01 (1%)
      const slippageValue = slippage || CONFIG.DEFAULT_SLIPPAGE || "0.01";
      console.log("[LiFi] Using slippage:", slippageValue);

      const queryParams = new URLSearchParams({
        fromChain: String(fromChainId),
        toChain: String(toChainId),
        fromToken,
        toToken,
        fromAmount,
        fromAddress: sender,
        slippage: slippageValue,
        integrator: env?.INTEGRATOR_NAME || "BridgeAggregator",
        skipSimulation: "false",
      });

      const headers = { Accept: "application/json" };
      if (env?.LIFI_API_KEY) headers["x-lifi-api-key"] = env.LIFI_API_KEY;

      const url = `https://li.quest/v1/quote?${queryParams}`;
      console.log("[LiFi] Fetching URL:", url);
      console.log("[LiFi] Headers:", headers);

      const res = await this.fetchWithTimeout(url, { headers });

      console.log("[LiFi] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "No error details");
        console.error("[LiFi] HTTP Error:", res.status, errorBody);
        throw new Error(
          `LI.FI: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
        );
      }

      const data = await res.json();
      console.log("[LiFi] API Response:", JSON.stringify(data, null, 2));

      if (!data?.estimate) {
        console.error("[LiFi] Invalid response structure:", data);
        throw new Error(`LI.FI: Invalid response structure - missing estimate`);
      }

      const costs = this.calculateCosts(data.estimate);
      console.log("[LiFi] Calculated costs:", costs);

      const roundUSD = (val) => Math.round(val * 100) / 100;

      const response = this.formatResponse({
        totalCost: roundUSD(costs.totalCost),
        bridgeFee: roundUSD(costs.feeCost),
        gasFee: roundUSD(costs.gasCost + costs.networkFee),
        estimatedTime: `${Math.ceil((data.estimate.executionDuration || 300) / 60)} mins`,
        security: "Audited",
        liquidity: "High",
        route: data.toolDetails?.name || "Best Route",
        outputAmount: data.estimate.toAmount || null,
        protocol: "LI.FI",
        meta: {
          fromToken,
          toToken,
          fromAmountUSD: roundUSD(costs.fromAmountUSD),
          toAmountUSD: roundUSD(costs.toAmountUSD),
          fees: [
            { name: "LiFi Fee", amount: roundUSD(costs.lifiFee) },
            { name: "Cross-Chain Fee", amount: roundUSD(costs.crossChainFee) },
            { name: "Other Protocol Fees", amount: roundUSD(costs.otherFees) },
            { name: "Gas Costs", amount: roundUSD(costs.gasCost) },
            { name: "Network Fees", amount: roundUSD(costs.networkFee) },
          ],
          slippage: roundUSD(costs.slippage),
          tool: data.toolDetails?.key || data.toolDetails?.name,
        },
      });

      console.log(
        "[LiFi] Success! Returning response:",
        JSON.stringify(response, null, 2)
      );
      return response;
    } catch (error) {
      console.error("[LiFi] ERROR:", error.message);
      console.error("[LiFi] Full error:", error);
      console.error("[LiFi] Stack trace:", error.stack);

      // Fallback response on any error
      const fallbackResponse = this.formatResponse({
        totalCost: 8.0,
        bridgeFee: 3.0,
        gasFee: 5.0,
        estimatedTime: "5-10 mins",
        security: "Audited",
        liquidity: "High",
        route: "LI.FI Route",
        protocol: "LI.FI",
        isEstimated: true,
      });

      console.log(
        "[LiFi] Returning fallback response:",
        JSON.stringify(fallbackResponse, null, 2)
      );
      return fallbackResponse;
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    // Validate chain IDs
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(`LI.FI: Invalid chain pair ${fromChainId}->${toChainId}`);
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`LI.FI: Invalid amount ${amount}`);
    }

    // Validate sender address
    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`LI.FI: Invalid sender address ${sender}`);
    }
  }

  calculateCosts(estimate) {
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    // Helper to sum USD values from array
    const sumUSD = (arr) =>
      (arr || []).reduce((s, x) => {
        const val = parseUSD(x?.amountUSD);
        return s + val;
      }, 0);

    // Calculate gas and network fees
    const gasCost = sumUSD(estimate.gasCosts);
    const networkFee = sumUSD(estimate.networkFees);

    // Extract ALL protocol/bridge fees (included and non-included)
    let lifiFee = 0;
    let crossChainFee = 0;
    let otherFees = 0;

    (estimate.feeCosts || []).forEach((fee) => {
      const amount = parseUSD(fee.amountUSD);

      if (fee.name === "LIFI Fixed Fee" || fee.name === "LiFi Fee") {
        lifiFee += amount;
      } else if (
        fee.name === "CrossChain Fee" ||
        fee.name === "Cross-Chain Fee"
      ) {
        crossChainFee += amount;
      } else {
        otherFees += amount;
      }
    });

    const feeCost = lifiFee + crossChainFee + otherFees;
    const totalCost = gasCost + networkFee + feeCost;

    const fromAmountUSD = parseUSD(estimate.fromAmountUSD);
    const toAmountUSD = parseUSD(estimate.toAmountUSD);
    const slippage = Math.max(0, fromAmountUSD - toAmountUSD);

    return {
      gasCost,
      networkFee,
      lifiFee,
      crossChainFee,
      otherFees,
      feeCost,
      totalCost,
      fromAmountUSD,
      toAmountUSD,
      slippage,
    };
  }
}
