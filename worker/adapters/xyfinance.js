// worker/adapters/xyfinance.js
export class XYFinanceAdapter extends BridgeAdapter {
  constructor(config) {
    super("XY Finance", config);
    this.icon = "⚡";
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

    const queryParams = new URLSearchParams({
      srcChainId: String(fromChainId),
      srcQuoteTokenAddress: fromToken,
      srcQuoteTokenAmount: fromAmount,
      dstChainId: String(toChainId),
      dstQuoteTokenAddress: toToken,
      slippage: CONFIG.DEFAULT_SLIPPAGE,
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

    return this.mapToStandardFormat(data.routes[0]);
  }

  mapToStandardFormat(route) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const feeUSD = parseUSD(route.bridgeFee?.amount) / 1e6;
    const gasUSD = (parseUSD(route.gasFee?.amount) / 1e18) * 2000;

    return this.formatResponse({
      totalCost: feeUSD + gasUSD,
      bridgeFee: feeUSD,
      gasFee: gasUSD,
      estimatedTime: `${Math.ceil((route.estimatedTime || 180) / 60)} mins`,
      route: "XY Finance",
      protocol: "Y Pool",
      outputAmount: route.dstQuoteTokenAmount,
      meta: {
        tool: "xyfinance",
        estimatedTime: route.estimatedTime,
      },
    });
  }
}
