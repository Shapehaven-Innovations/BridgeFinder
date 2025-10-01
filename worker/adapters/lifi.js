// worker/adapters/lifi.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class LiFiAdapter extends BridgeAdapter {
  constructor(config) {
    super("LI.FI", config);
    this.icon = "🔷";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    this.validateInputs(fromChainId, toChainId, token, amount, sender);

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("LI.FI: Unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`LI.FI: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`LI.FI: No ${token} address on chain ${toChainId}`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      slippage: CONFIG.DEFAULT_SLIPPAGE || "0.01",
      integrator: env?.INTEGRATOR_NAME || "BridgeAggregator",
      skipSimulation: "false",
    });

    const headers = { Accept: "application/json" };
    if (env?.LIFI_API_KEY) headers["x-lifi-api-key"] = env.LIFI_API_KEY;

    try {
      const res = await this.fetchWithTimeout(
        `https://li.quest/v1/quote?${queryParams}`,
        { headers }
      );

      if (!res.ok) {
        const errorText = await res.text().catch(() => "No error details");
        throw new Error(
          `LI.FI: HTTP ${res.status} - ${errorText.substring(0, 200)}`
        );
      }

      const data = await res.json();

      if (!data?.estimate) {
        throw new Error(`LI.FI: Invalid response structure - missing estimate`);
      }

      const costs = this.calculateCosts(data.estimate, env);

      const roundUSD = (val) => Math.round(val * 100) / 100;

      return this.formatResponse({
        totalCost: roundUSD(costs.totalCost),
        bridgeFee: roundUSD(costs.bridgeFees),
        gasFee: roundUSD(costs.gasFees),
        estimatedTime: `${Math.ceil(
          (data.estimate.executionDuration || 300) / 60
        )} mins`,
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
            { name: "Gas Costs", amount: roundUSD(costs.gasFees) },
          ],
          savings: {
            amount: roundUSD(costs.slippage),
            percentage: ((costs.slippage / costs.fromAmountUSD) * 100).toFixed(
              2
            ),
          },
          tool: data.toolDetails?.key || data.toolDetails?.name,
        },
      });
    } catch (error) {
      return this.formatResponse({
        totalCost: 6.0,
        bridgeFee: 2.0,
        gasFee: 4.0,
        estimatedTime: "5 mins",
        security: "Audited",
        liquidity: "High",
        route: "Best Route",
        protocol: "LI.FI",
        isEstimated: true,
      });
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(`LI.FI: Invalid chain pair ${fromChainId}->${toChainId}`);
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`LI.FI: Invalid amount ${amount}`);
    }

    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`LI.FI: Invalid sender address ${sender}`);
    }
  }

  calculateCosts(estimate, env) {
    const parseUSD = (value) => {
      const parsed = parseFloat(value || "0");
      return isNaN(parsed) ? 0 : parsed;
    };

    const sumUSD = (arr) =>
      (arr || []).reduce((sum, item) => {
        return sum + parseUSD(item?.amountUSD);
      }, 0);

    const gasCostUSD = sumUSD(estimate.gasCosts);
    const networkFeeUSD = sumUSD(estimate.networkFees);
    const gasFees = gasCostUSD + networkFeeUSD;

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

    const bridgeFees = lifiFee + crossChainFee + otherFees;
    const totalCost = gasFees + bridgeFees;
    const fromAmountUSD = parseUSD(estimate.fromAmountUSD);
    const toAmountUSD = parseUSD(estimate.toAmountUSD);
    const slippage = Math.max(0, fromAmountUSD - toAmountUSD);

    return {
      gasFees,
      lifiFee,
      crossChainFee,
      otherFees,
      bridgeFees,
      totalCost,
      fromAmountUSD,
      toAmountUSD,
      slippage,
    };
  }
}
