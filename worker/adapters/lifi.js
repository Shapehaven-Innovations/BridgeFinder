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
      // ✅ OBJECTIVE 1: Remove API key from logs - only log header keys, not values
      console.log("[LiFi] Request headers:", Object.keys(headers).join(", "));

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

      // ✅ OBJECTIVE 2: Use API response structure directly
      const response = this.buildResponseFromAPI(data);

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

  /**
   * ✅ OBJECTIVE 2: Build response using API's native structure
   * Uses exact labels and calculations from LiFi API response
   */
  buildResponseFromAPI(data) {
    const { estimate, toolDetails, action } = data;

    // Parse values safely
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    const roundUSD = (val) => Math.round(val * 100) / 100;

    // Use API's USD values directly
    const fromAmountUSD = parseUSD(estimate.fromAmountUSD);
    const toAmountUSD = parseUSD(estimate.toAmountUSD);

    // Calculate total costs using API's structure
    const gasCosts = (estimate.gasCosts || []).map((gas) => ({
      type: gas.type,
      amount: gas.amount,
      amountUSD: parseUSD(gas.amountUSD),
      token: gas.token?.symbol || "ETH",
    }));

    const feeCosts = (estimate.feeCosts || []).map((fee) => ({
      name: fee.name,
      description: fee.description,
      amount: fee.amount,
      amountUSD: parseUSD(fee.amountUSD),
      percentage: fee.percentage,
      included: fee.included,
      token: fee.token?.symbol || "ETH",
    }));

    // Sum totals from API data
    const totalGasCost = gasCosts.reduce((sum, gas) => sum + gas.amountUSD, 0);
    const totalFeeCost = feeCosts.reduce((sum, fee) => sum + fee.amountUSD, 0);
    const totalCost = totalGasCost + totalFeeCost;

    // Calculate slippage from API amounts
    const slippage = Math.max(0, fromAmountUSD - toAmountUSD - totalCost);

    // Convert execution duration to readable format
    const executionMinutes = Math.ceil(
      (estimate.executionDuration || 300) / 60
    );

    return this.formatResponse({
      totalCost: roundUSD(totalCost),
      bridgeFee: roundUSD(totalFeeCost),
      gasFee: roundUSD(totalGasCost),
      estimatedTime: `${executionMinutes} mins`,
      security: "Audited",
      liquidity: "High",
      route: toolDetails?.name || "Best Route",
      outputAmount: estimate.toAmount || null,
      protocol: "LI.FI",
      meta: {
        // Token information from API
        fromToken: action?.fromToken?.address,
        toToken: action?.toToken?.address,
        fromTokenSymbol: action?.fromToken?.symbol,
        toTokenSymbol: action?.toToken?.symbol,

        // USD amounts from API
        fromAmountUSD: roundUSD(fromAmountUSD),
        toAmountUSD: roundUSD(toAmountUSD),

        // Slippage info
        slippage: roundUSD(slippage),
        slippagePercentage: estimate.slippage || action?.slippage,

        // Tool/bridge information
        tool: toolDetails?.key,
        toolName: toolDetails?.name,

        // Detailed fee breakdown using API labels
        gasCosts: gasCosts.map((gas) => ({
          type: gas.type,
          amountUSD: roundUSD(gas.amountUSD),
          token: gas.token,
        })),

        feeCosts: feeCosts.map((fee) => ({
          name: fee.name,
          description: fee.description,
          amountUSD: roundUSD(fee.amountUSD),
          percentage: fee.percentage,
          included: fee.included,
          token: fee.token,
        })),

        // Min/max amounts from API
        toAmountMin: estimate.toAmountMin,
        toAmount: estimate.toAmount,
        fromAmount: estimate.fromAmount,

        // Execution info
        executionDuration: estimate.executionDuration,
        approvalAddress: estimate.approvalAddress,
      },
    });
  }
}
