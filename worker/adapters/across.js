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
        const errorText = await res.text().catch(() => "No error details");
        throw new Error(
          `Across: HTTP ${res.status} - ${errorText.substring(0, 200)}`
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

      return this.formatResponse({
        totalCost: roundUSD(costs.totalCost),
        bridgeFee: roundUSD(costs.bridgeFees),
        gasFee: roundUSD(costs.gasFees),
        estimatedTime: data.estimatedFillTimeSec
          ? `${Math.ceil(data.estimatedFillTimeSec / 60)} mins`
          : "2-4 mins",
        security: "Optimistic Oracle",
        liquidity: "High",
        route: "Across Bridge",
        outputAmount: costs.outputAmount,
        protocol: "Across",
        meta: {
          fromToken,
          toToken,
          fromAmountUSD: roundUSD(costs.fromAmountUSD),
          toAmountUSD: roundUSD(costs.toAmountUSD),
          fees: [
            { name: "Relay Fee", amount: roundUSD(costs.relayFee) },
            { name: "Capital Fee", amount: roundUSD(costs.capitalFee) },
            { name: "LP Fee", amount: roundUSD(costs.lpFee) },
            { name: "Gas Costs", amount: roundUSD(costs.gasFees) },
          ],
          savings: {
            amount: roundUSD(costs.slippage),
            percentage: ((costs.slippage / costs.fromAmountUSD) * 100).toFixed(
              2
            ),
          },
          relayFeePct: roundUSD(costs.relayFeePct),
          capitalFeePct: roundUSD(costs.capitalFeePct),
          lpFeePct: roundUSD(costs.lpFeePct),
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 5.0,
        bridgeFee: 1.5,
        gasFee: 3.5,
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

    const fromAmountUSD = parseUSD(amount);

    // Calculate fees based on actual API response
    const relayFeePct = parseUSD(data.totalRelayFee?.pct);
    const relayFee = (relayFeePct / 100) * fromAmountUSD;

    const capitalFeePct = parseUSD(data.capitalFeePct);
    const capitalFee = (capitalFeePct / 100) * fromAmountUSD;

    const lpFeePct = parseUSD(data.lpFeePct);
    const lpFee = (lpFeePct / 100) * fromAmountUSD;

    const gasFees = parseUSD(data.estimatedGasCost?.usd);

    const bridgeFees = relayFee + capitalFee + lpFee;
    const totalCost = bridgeFees + gasFees;
    const toAmountUSD = Math.max(0, fromAmountUSD - bridgeFees);
    const slippage = Math.max(0, fromAmountUSD - toAmountUSD);

    // Calculate output amount
    const tokenCfg = TOKENS[Object.keys(TOKENS).find((t) => TOKENS[t])];
    const fromAmount = this.toUnits(amount, tokenCfg?.decimals || 18);
    const outputAmount = data.totalRelayFee?.total
      ? String(BigInt(fromAmount) - BigInt(data.totalRelayFee.total))
      : null;

    return {
      gasFees,
      relayFee,
      capitalFee,
      lpFee,
      bridgeFees,
      totalCost,
      fromAmountUSD,
      toAmountUSD,
      slippage,
      relayFeePct,
      capitalFeePct,
      lpFeePct,
      outputAmount,
    };
  }
}
