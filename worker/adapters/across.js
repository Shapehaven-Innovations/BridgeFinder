// worker/adapters/across.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class AcrossAdapter extends BridgeAdapter {
  constructor(config) {
    super("Across", config);
    this.icon = "⚡";
  }

  async getQuote(params, env) {
    console.log(
      "[Across] Starting getQuote with params:",
      JSON.stringify(params)
    );

    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    try {
      console.log("[Across] Validating inputs...");
      this.validateInputs(fromChainId, toChainId, token, amount, sender);

      const tokenCfg = TOKENS[token];
      if (!tokenCfg) {
        console.error("[Across] Unknown token:", token);
        throw new Error("Across: Unknown token");
      }
      console.log("[Across] Token config:", tokenCfg);

      const fromToken = this.getTokenAddress(token, fromChainId);
      const toToken = this.getTokenAddress(token, toChainId);
      console.log(
        "[Across] Token addresses - from:",
        fromToken,
        "to:",
        toToken
      );

      // Validate token addresses exist for chains
      if (!fromToken || fromToken === "undefined") {
        throw new Error(`Across: No ${token} address on chain ${fromChainId}`);
      }
      if (!toToken || toToken === "undefined") {
        throw new Error(`Across: No ${token} address on chain ${toChainId}`);
      }

      const fromAmount = this.toUnits(amount, tokenCfg.decimals);
      console.log("[Across] From amount in units:", fromAmount);

      const queryParams = new URLSearchParams({
        originChainId: String(fromChainId),
        destinationChainId: String(toChainId),
        token: fromToken,
        amount: fromAmount,
        depositor: sender,
        recipient: sender,
      });

      const url = `https://app.across.to/api/suggested-fees?${queryParams}`;
      console.log("[Across] Fetching URL:", url);

      const res = await this.fetchWithTimeout(url, {
        headers: {
          Accept: "application/json",
        },
      });

      console.log("[Across] Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "No error details");
        console.error("[Across] HTTP Error:", res.status, errorBody);
        throw new Error(
          `Across: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
        );
      }

      const data = await res.json();
      console.log("[Across] API Response:", JSON.stringify(data, null, 2));

      if (!data?.totalRelayFee) {
        console.error("[Across] Invalid response structure:", data);
        throw new Error(
          `Across: Invalid response structure - missing totalRelayFee`
        );
      }

      const costs = this.calculateCosts(data, amount);
      console.log("[Across] Calculated costs:", costs);

      const roundUSD = (val) => Math.round(val * 100) / 100;

      // Calculate output amount
      const outputAmount = data.totalRelayFee?.total
        ? String(BigInt(fromAmount) - BigInt(data.totalRelayFee.total))
        : null;

      const response = this.formatResponse({
        totalCost: roundUSD(costs.totalCost),
        bridgeFee: roundUSD(costs.bridgeFee),
        gasFee: roundUSD(costs.gasCost),
        estimatedTime: data.estimatedFillTimeSec
          ? `${Math.ceil(data.estimatedFillTimeSec / 60)} mins`
          : "2-4 mins",
        security: "Optimistic Oracle",
        liquidity: "High",
        route: "Across Bridge",
        outputAmount,
        protocol: "Across",
        meta: {
          fromToken,
          toToken,
          fromAmountUSD: roundUSD(parseFloat(amount)),
          toAmountUSD: roundUSD(parseFloat(amount) - costs.bridgeFee),
          fees: [
            { name: "Relay Fee", amount: roundUSD(costs.relayFee) },
            { name: "Capital Fee", amount: roundUSD(costs.capitalFee) },
            { name: "LP Fee", amount: roundUSD(costs.lpFee) },
            { name: "Gas Costs", amount: roundUSD(costs.gasCost) },
          ],
          slippage: roundUSD(costs.bridgeFee),
          relayFeePct: roundUSD(costs.relayFeePct),
          capitalFeePct: roundUSD(costs.capitalFeePct),
          lpFeePct: roundUSD(costs.lpFeePct),
        },
      });

      console.log(
        "[Across] Success! Returning response:",
        JSON.stringify(response, null, 2)
      );
      return response;
    } catch (error) {
      console.error("[Across] ERROR:", error.message);
      console.error("[Across] Full error:", error);
      console.error("[Across] Stack trace:", error.stack);

      // Fallback response on any error
      const fallbackResponse = this.formatResponse({
        totalCost: 6.0,
        bridgeFee: 2.0,
        gasFee: 4.0,
        estimatedTime: "2-4 mins",
        security: "Optimistic Oracle",
        liquidity: "High",
        route: "Across Bridge",
        protocol: "Across",
        isEstimated: true,
      });

      console.log(
        "[Across] Returning fallback response:",
        JSON.stringify(fallbackResponse, null, 2)
      );
      return fallbackResponse;
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    // Validate chain IDs
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(
        `Across: Invalid chain pair ${fromChainId}->${toChainId}`
      );
    }

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`Across: Invalid amount ${amount}`);
    }

    // Validate sender address
    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`Across: Invalid sender address ${sender}`);
    }
  }

  calculateCosts(data, amount) {
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate fees based on actual API response
    const relayFeePct = parseUSD(data.totalRelayFee?.pct);
    const relayFee = (relayFeePct / 100) * parseFloat(amount);

    // Extract capital fee if present
    const capitalFeePct = parseUSD(data.capitalFeePct);
    const capitalFee = (capitalFeePct / 100) * parseFloat(amount);

    // Extract LP fee if present
    const lpFeePct = parseUSD(data.lpFeePct);
    const lpFee = (lpFeePct / 100) * parseFloat(amount);

    // Calculate gas costs from response if available
    const gasCost = parseUSD(data.estimatedGasCost?.usd);

    // Total bridge fees (relay + capital + LP)
    const bridgeFee = relayFee + capitalFee + lpFee;
    const totalCost = bridgeFee + gasCost;

    return {
      relayFee,
      relayFeePct,
      capitalFee,
      capitalFeePct,
      lpFee,
      lpFeePct,
      gasCost,
      bridgeFee,
      totalCost,
    };
  }
}
