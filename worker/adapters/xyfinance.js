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

    // XY Finance uses isSuccess field, not success
    if (!data.isSuccess) {
      // Handle timeout or failure with descriptive message
      const errorMsg = data.msg || "No routes found";
      throw new Error(`${this.name}: ${errorMsg}`);
    }

    // Check if we have a valid quote
    if (!data.quote || data.toTokenAmount === "0") {
      throw new Error(
        `${this.name}: No viable route available for this bridge path`
      );
    }

    return this.mapToStandardFormat(data, tokenCfg);
  }

  mapToStandardFormat(data, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    // XY Finance returns values in token units, need to convert to human-readable
    const toTokenAmount =
      parseUSD(data.toTokenAmount) / Math.pow(10, tokenCfg.decimals);

    // Parse fees - XY Finance uses different fee structure
    const xyFeeUSD = parseUSD(data.xyFee || 0);
    const crossChainFeeUSD = parseUSD(data.crossChainFee || 0);
    const gasFeeUSD = parseUSD(data.estimatedGas || 0) / 1e9; // Gas in gwei

    const totalCostUSD = xyFeeUSD + crossChainFeeUSD + gasFeeUSD;

    // Convert transfer time from seconds to minutes
    const estimatedMinutes = Math.ceil(
      (data.estimatedTransferTime || 180) / 60
    );

    return this.formatResponse({
      totalCost: totalCostUSD,
      bridgeFee: xyFeeUSD + crossChainFeeUSD,
      gasFee: gasFeeUSD,
      estimatedTime: `${estimatedMinutes} mins`,
      route: "XY Finance Bridge",
      protocol: "Y Pool",
      outputAmount: data.toTokenAmount,
      meta: {
        tool: "xyfinance",
        isSuccess: data.isSuccess,
        statusCode: data.statusCode,
        estimatedTransferTime: data.estimatedTransferTime,
        transactionCounts: data.transactionCounts,
        minimumReceived: data.minimumReceived,
        fromTokenValue: data.fromTokenValue,
        toTokenValue: data.toTokenValue,
        xyFee: data.xyFee,
        crossChainFee: data.crossChainFee,
        contractAddress: data.contractAddress,
      },
    });
  }
}
