// worker/adapters/across.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class AcrossAdapter extends BridgeAdapter {
  constructor(config) {
    super("Across", config);
    this.icon = "🌉";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;

    // [DEV-LOG] Request parameters
    console.log(`[${this.name}] API Request:`, {
      fromChainId,
      toChainId,
      token,
      amount,
      sender,
    }); // REMOVE-FOR-PRODUCTION

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`);
    }

    const fromToken = this.getTokenAddress(token, fromChainId);
    const toToken = this.getTokenAddress(token, toChainId);

    if (!fromToken || fromToken === "undefined") {
      throw new Error(
        `${this.name}: No ${token} address on chain ${fromChainId}`
      );
    }
    if (!toToken || toToken === "undefined") {
      throw new Error(
        `${this.name}: No ${token} address on chain ${toChainId}`
      );
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

    // [DEV-LOG] API URL
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      headers: { Accept: "application/json" },
    });

    // [DEV-LOG] HTTP Response Status
    console.log(`[${this.name}] HTTP Status:`, res.status); // REMOVE-FOR-PRODUCTION

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "No details");
      // [DEV-LOG] Error Response
      console.error(`[${this.name}] API Error:`, errorBody); // REMOVE-FOR-PRODUCTION
      throw new Error(
        `${this.name}: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
      );
    }

    const data = await res.json();

    // [DEV-LOG] Full API Response
    console.log(`[${this.name}] API Response:`, JSON.stringify(data, null, 2)); // REMOVE-FOR-PRODUCTION

    if (!data || !data.totalRelayFee) {
      throw new Error(`${this.name}: Invalid response - missing fee data`);
    }

    return this.mapToStandardFormat(data, tokenCfg);
  }

  mapToStandardFormat(apiResponse, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const relayFeeUSD =
      parseUSD(apiResponse.totalRelayFee?.total) /
      Math.pow(10, tokenCfg.decimals);
    const estimatedFillTime = Math.ceil(
      (apiResponse.estimatedFillTimeSec || 60) / 60
    );

    return this.formatResponse({
      totalCost: relayFeeUSD,
      bridgeFee: relayFeeUSD,
      gasFee: 0,
      estimatedTime: `${estimatedFillTime} mins`,
      route: "Across Bridge",
      protocol: "Across",
      outputAmount: apiResponse.expectedOutputAmount,
      meta: {
        tool: "across",
        relayFeePercent: apiResponse.relayFeePct,
        capitalFeePercent: apiResponse.capitalFeePct,
        estimatedFillTimeSec: apiResponse.estimatedFillTimeSec,
      },
    });
  }
}
