// worker/adapters/oneinch.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class OneInchAdapter extends BridgeAdapter {
  constructor(config) {
    super("1inch", config);
    this.icon = "🦄";
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

    if (!fromToken || !toToken) {
      throw new Error(`${this.name}: Missing token addresses`);
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    if (!env?.ONEINCH_API_KEY) {
      throw new Error(`${this.name}: API key required (set ONEINCH_API_KEY)`);
    }

    const isCrossChain = fromChainId !== toChainId;
    const endpoint = isCrossChain ? "fusion/quoter/v1.0" : "swap/v5.2";
    const chainParam = isCrossChain ? "" : `/${fromChainId}`;

    const queryParams = new URLSearchParams({
      src: fromToken,
      dst: toToken,
      amount: fromAmount,
      from: sender,
      slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE) * 100,
    });

    const url = `https://api.1inch.dev/${endpoint}${chainParam}/quote?${queryParams}`;

    // [DEV-LOG] API URL
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      headers: {
        Authorization: `Bearer ${env.ONEINCH_API_KEY}`,
        Accept: "application/json",
      },
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

    if (!data || (!data.toAmount && !data.dstAmount)) {
      throw new Error(`${this.name}: Invalid response - missing amount data`);
    }

    return this.mapToStandardFormat(data, isCrossChain);
  }

  mapToStandardFormat(apiResponse, isCrossChain) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const gasUSD =
      (parseUSD(apiResponse.estimatedGas) *
        parseUSD(apiResponse.gasPrice) *
        2000) /
      1e18;
    const protocolFee = parseUSD(apiResponse.protocolFee) / 1e6 || 0;

    return this.formatResponse({
      totalCost: gasUSD + protocolFee,
      bridgeFee: protocolFee,
      gasFee: gasUSD,
      estimatedTime: isCrossChain ? "3-5 mins" : "1-2 mins",
      route: isCrossChain ? "1inch Fusion+" : "1inch Aggregator",
      protocol: "1inch",
      outputAmount: apiResponse.toAmount || apiResponse.dstAmount,
      meta: {
        tool: "1inch",
        protocols: apiResponse.protocols,
        estimatedGas: apiResponse.estimatedGas,
      },
    });
  }
}
