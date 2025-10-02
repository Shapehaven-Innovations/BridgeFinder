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
      this.validateInputs(fromChainId, toChainId, token, amount, sender);

      const tokenCfg = TOKENS[token];
      if (!tokenCfg) throw new Error("Across: Unknown token");

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

        // Check for route not enabled - RETURN immediately, don't throw
        if (res.status === 400 && errorBody.includes("ROUTE_NOT_ENABLED")) {
          console.log(
            "[Across] Route not supported for this chain pair/token combination"
          );
          return this.formatResponse({
            totalCost: null,
            bridgeFee: null,
            gasFee: null,
            estimatedTime: "N/A",
            security: "Optimistic Oracle",
            liquidity: "High",
            route: "Not Available",
            protocol: "Across",
            unavailable: true,
            unavailableReason: "Route not supported",
            unavailableDetails:
              "Across doesn't support this specific route. Try a different chain pair or token.",
          });
        }

        // For other errors, throw to be caught by outer catch
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

      // Return unavailable status for any uncaught errors
      console.log("[Across] Returning unavailable status");
      return this.formatResponse({
        totalCost: null,
        bridgeFee: null,
        gasFee: null,
        estimatedTime: "N/A",
        security: "Optimistic Oracle",
        liquidity: "High",
        route: "Temporarily Unavailable",
        protocol: "Across",
        unavailable: true,
        unavailableReason: "Service error",
        unavailableDetails:
          "Across bridge is experiencing issues. Please try again later or use an alternative bridge.",
      });
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(
        `Across: Invalid chain pair ${fromChainId}->${toChainId}`
      );
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`Across: Invalid amount ${amount}`);
    }

    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`Across: Invalid sender address ${sender}`);
    }
  }

  calculateCosts(data, amount) {
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    const relayFeePct = parseUSD(data.totalRelayFee?.pct);
    const relayFee = (relayFeePct / 100) * parseFloat(amount);

    const capitalFeePct = parseUSD(data.capitalFeePct);
    const capitalFee = (capitalFeePct / 100) * parseFloat(amount);

    const lpFeePct = parseUSD(data.lpFeePct);
    const lpFee = (lpFeePct / 100) * parseFloat(amount);

    const gasCost = parseUSD(data.estimatedGasCost?.usd);

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
