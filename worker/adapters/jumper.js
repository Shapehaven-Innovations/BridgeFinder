// worker/adapters/jumper.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class JumperAdapter extends BridgeAdapter {
  constructor(config) {
    super("Jumper", config);
    this.icon = "🐸";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    this.validateInputs(fromChainId, toChainId, token, amount, sender);

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Jumper: Unknown token");

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(`Jumper: No ${token} address on chain ${fromChainId}`);
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(`Jumper: No ${token} address on chain ${toChainId}`);
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
      integrator: "jumper",
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
          `Jumper: HTTP ${res.status} - ${errorText.substring(0, 200)}`
        );
      }

      const data = await res.json();

      if (!data?.estimate) {
        throw new Error(
          `Jumper: Invalid response structure - missing estimate`
        );
      }

      const costs = this.calculateCosts(data.estimate, env);

      const roundUSD = (val) => Math.round(val * 100) / 100;

      return this.formatResponse({
        totalCost: roundUSD(costs.totalCost),
        bridgeFee: roundUSD(costs.bridgeFees),
        gasFee: roundUSD(costs.gasFees),
        estimatedTime: `${Math.ceil(
          (data.estimate.executionDuration || 60) / 60
        )} mins`,
        security: "Audited",
        liquidity: "High",
        route: data.toolDetails?.name || "Best Route",
        outputAmount: data.estimate.toAmount || null,
        protocol: "LI.FI/Jumper",
        meta: {
          fromToken,
          toToken,
          fromAmountUSD: roundUSD(costs.fromAmountUSD),
          toAmountUSD: roundUSD(costs.toAmountUSD),
          fees: [
            { name: "Protocol Fee", amount: roundUSD(costs.lifiFee) },
            { name: "CrossChain Fee", amount: roundUSD(costs.crossChainFee) },
            { name: "Gas", amount: roundUSD(costs.gasFees) },
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
        totalCost: 7.5,
        bridgeFee: 2.5,
        gasFee: 5,
        estimatedTime: "3-5 mins",
        security: "Audited",
        liquidity: "High",
        route: "Jumper Route",
        protocol: "LI.FI/Jumper",
        isEstimated: true,
      });
    }
  }

  validateInputs(fromChainId, toChainId, token, amount, sender) {
    if (!fromChainId || !toChainId || fromChainId === toChainId) {
      throw new Error(
        `Jumper: Invalid chain pair ${fromChainId}->${toChainId}`
      );
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error(`Jumper: Invalid amount ${amount}`);
    }

    if (!sender || !/^0x[a-fA-F0-9]{40}$/i.test(sender)) {
      throw new Error(`Jumper: Invalid sender address ${sender}`);
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

    const gasFees =
      sumUSD(estimate.gasCosts) + sumUSD(estimate.networkFees || []);

    let lifiFee = 0;
    let crossChainFee = 0;
    let otherFees = 0;

    (estimate.feeCosts || []).forEach((fee) => {
      const amount = parseUSD(fee.amountUSD);

      if (fee.name === "LIFI Fixed Fee") {
        lifiFee += amount;
      } else if (fee.name === "CrossChain Fee") {
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
