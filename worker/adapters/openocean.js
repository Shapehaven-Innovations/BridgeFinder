// worker/adapters/openocean.js
export class OpenOceanAdapter extends BridgeAdapter {
  constructor(config) {
    super("OpenOcean", config);
    this.icon = "🌊";
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
    const chain = this.mapChainToOpenOcean(fromChainId);

    const queryParams = new URLSearchParams({
      inTokenAddress: fromToken,
      outTokenAddress: toToken,
      amount: fromAmount,
      slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE) * 100,
      account: sender,
      gasPrice: "5",
    });

    const url = `https://open-api.openocean.finance/v3/${chain}/quote?${queryParams}`;

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

    if (!data?.data) {
      throw new Error(`${this.name}: Invalid response - missing data`);
    }

    return this.mapToStandardFormat(data.data);
  }

  mapToStandardFormat(apiResponse) {
    const parseFloat2 = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const estimatedGas = parseFloat2(apiResponse.estimatedGas);
    const gasPrice = parseFloat2(apiResponse.gasPrice) / 1e9;
    const gasUSD = (estimatedGas * gasPrice * 2000) / 1e18;
    const priceImpact = parseFloat2(apiResponse.priceImpact);
    const feeUSD =
      (Math.abs(priceImpact) * parseFloat2(apiResponse.inAmount)) /
      Math.pow(10, 6);

    return this.formatResponse({
      totalCost: gasUSD + feeUSD,
      bridgeFee: feeUSD,
      gasFee: gasUSD,
      estimatedTime: "1-2 mins",
      route: "OpenOcean",
      protocol: "OpenOcean",
      outputAmount: apiResponse.outAmount,
      meta: {
        tool: "openocean",
        priceImpact: apiResponse.priceImpact,
        estimatedGas: apiResponse.estimatedGas,
      },
    });
  }

  mapChainToOpenOcean(chainId) {
    const map = {
      1: "eth",
      137: "polygon",
      42161: "arbitrum",
      10: "optimism",
      56: "bsc",
      43114: "avax",
      8453: "base",
      250: "fantom",
    };
    const result = map[chainId];
    if (!result) {
      throw new Error(`OpenOcean: Unsupported chain ${chainId}`);
    }
    return result;
  }
}
