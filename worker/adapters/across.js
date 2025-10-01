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

    try {
      this.validateInputs(fromChainId, toChainId, token, amount, sender);

      const tokenCfg = TOKENS[token];
      if (!tokenCfg) throw new Error("Across: Unknown token");

      const fromToken = this.getTokenAddress(token, fromChainId);
      const toToken = this.getTokenAddress(token, toChainId);

      // Validate token addresses exist for chains
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

      const res = await this.fetchWithTimeout(
        `https://app.across.to/api/suggested-fees?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "No error details");
        throw new Error(
          `Across: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
        );
      }

      const data = await res.json();

      if (!data?.totalRelayFee) {
        throw new Error(
          `Across: Invalid response structure - missing totalRelayFee`
        );
      }

      const costs = this.calculateCosts(data, amount);
      const roundUSD = (val) => Math.round(val * 100) / 100;

      // Calculate output amount
      const outputAmount = data.totalRelayFee?.total
        ? String(BigInt(fromAmount) - BigInt(data.totalRelayFee.total))
        : null;

      return this.formatResponse({
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
    } catch (error) {
      // Fallback response on any error
      return this.formatResponse({
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
