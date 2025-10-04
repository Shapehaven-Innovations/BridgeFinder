// worker/adapters/xyfinance.js - REFACTORED with correct API parameters
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class XYFinanceAdapter extends BridgeAdapter {
  constructor(config) {
    super("XY Finance", config);
    this.icon = "⚡";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender, slippage } = params;

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

    // FIXED: Use correct parameter names as per XY Finance API spec
    const queryParams = new URLSearchParams({
      // Source chain parameters
      srcChainId: String(fromChainId), // Chain ID remains srcChainId
      fromTokenAddress: fromToken, // FIXED: was srcQuoteTokenAddress
      amount: fromAmount, // FIXED: was srcQuoteTokenAmount

      // Destination chain parameters
      destChainId: String(toChainId), // FIXED: was dstChainId
      toTokenAddress: toToken, // FIXED: was dstQuoteTokenAddress

      // Optional parameters
      slippage: slippage || CONFIG.DEFAULT_SLIPPAGE,
      receiver: sender,
    });

    const url = `https://open-api.xy.finance/v1/quote?${queryParams}`;

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

    if (!data.success || !data.routes || !data.routes[0]) {
      throw new Error(`${this.name}: No routes found`);
    }

    return this.mapToStandardFormat(data.routes[0], tokenCfg);
  }

  mapToStandardFormat(route, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    // Calculate fees based on route data
    const bridgeFeeUSD =
      parseUSD(route.bridgeFee?.amount) / Math.pow(10, tokenCfg.decimals);
    const gasFeeUSD =
      parseUSD(route.gasFee?.amount) / Math.pow(10, tokenCfg.decimals);

    // If fees are in tokens, multiply by approximate token price
    // XY Finance typically returns fees in the source token
    const totalCostUSD = bridgeFeeUSD + gasFeeUSD;

    return this.formatResponse({
      totalCost: totalCostUSD,
      bridgeFee: bridgeFeeUSD,
      gasFee: gasFeeUSD,
      estimatedTime: `${Math.ceil((route.estimatedTime || 180) / 60)} mins`,
      route: "XY Finance Bridge",
      protocol: "Y Pool",
      outputAmount: route.dstQuoteTokenAmount,
      meta: {
        tool: "xyfinance",
        estimatedTime: route.estimatedTime,
        srcChainId: route.srcChainId,
        destChainId: route.destChainId,
        bridgeFee: route.bridgeFee,
        gasFee: route.gasFee,
      },
    });
  }
}
