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

    let res;
    try {
      res = await this.fetchWithTimeout(
        `https://app.across.to/api/suggested-fees?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
    } catch (error) {
      throw new Error(`Across: Network error - ${error.message}`);
    }

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

    // Calculate fees based on actual API response
    const relayFeePct = parseFloat(data.totalRelayFee.pct || "0");
    const relayFeeUSD = (relayFeePct / 100) * parseFloat(amount);

    // Extract capital fee if present
    const capitalFeePct = parseFloat(data.capitalFeePct || "0");
    const capitalFeeUSD = (capitalFeePct / 100) * parseFloat(amount);

    // Extract LP fee if present
    const lpFeePct = parseFloat(data.lpFeePct || "0");
    const lpFeeUSD = (lpFeePct / 100) * parseFloat(amount);

    // Calculate gas costs from response if available
    const gasCostUSD = parseFloat(data.estimatedGasCost?.usd || "0");

    // Total bridge fees (relay + capital + LP)
    const bridgeFeeUSD = relayFeeUSD + capitalFeeUSD + lpFeeUSD;
    const totalCostUSD = bridgeFeeUSD + gasCostUSD;

    // Round for display
    const roundUSD = (val) => Math.round(val * 100) / 100;

    // Calculate output amount
    const outputAmount = data.totalRelayFee?.total
      ? String(BigInt(fromAmount) - BigInt(data.totalRelayFee.total))
      : null;

    return this.formatResponse({
      totalCost: roundUSD(totalCostUSD),
      bridgeFee: roundUSD(bridgeFeeUSD),
      gasFee: roundUSD(gasCostUSD),
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
        toAmountUSD: roundUSD(parseFloat(amount) - bridgeFeeUSD),
        fees: [
          { name: "Relay Fee", amount: roundUSD(relayFeeUSD) },
          { name: "Capital Fee", amount: roundUSD(capitalFeeUSD) },
          { name: "LP Fee", amount: roundUSD(lpFeeUSD) },
          { name: "Gas Costs", amount: roundUSD(gasCostUSD) },
        ],
        slippage: roundUSD(bridgeFeeUSD),
        relayFeePct: roundUSD(relayFeePct),
        capitalFeePct: roundUSD(capitalFeePct),
        lpFeePct: roundUSD(lpFeePct),
      },
    });
  }
}
