// worker/adapters/stargate.js
export class StargateAdapter extends BridgeAdapter {
  constructor(config) {
    super("Stargate", config);
    this.icon = "⭐";
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

    // Map chain IDs to LayerZero chain IDs
    const layerZeroChainMap = {
      1: 101, // Ethereum
      137: 109, // Polygon
      42161: 110, // Arbitrum
      10: 111, // Optimism
      56: 102, // BSC
      43114: 106, // Avalanche
      8453: 184, // Base
      250: 112, // Fantom
    };

    const srcChainId = layerZeroChainMap[fromChainId];
    const dstChainId = layerZeroChainMap[toChainId];

    if (!srcChainId || !dstChainId) {
      throw new Error(
        `${this.name}: Chain not supported (${fromChainId} or ${toChainId})`
      );
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      srcChainId: String(srcChainId),
      dstChainId: String(dstChainId),
      amount: fromAmount,
      srcPoolId: "1", // USDC pool
      dstPoolId: "1", // USDC pool
    });

    const url = `https://api.stargate.finance/v1/quote?${queryParams}`;

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

    if (!data || !data.fee) {
      throw new Error(`${this.name}: Invalid response - missing fee data`);
    }

    return this.mapToStandardFormat(data, tokenCfg);
  }

  mapToStandardFormat(apiResponse, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const feeInTokens =
      parseUSD(apiResponse.fee) / Math.pow(10, tokenCfg.decimals);
    const estimatedTimeMinutes = 5; // Stargate typically takes ~5 minutes

    return this.formatResponse({
      totalCost: feeInTokens,
      bridgeFee: feeInTokens,
      gasFee: 0,
      estimatedTime: `${estimatedTimeMinutes} mins`,
      route: "Stargate Bridge",
      protocol: "LayerZero",
      outputAmount: apiResponse.amountOut,
      meta: {
        tool: "stargate",
        fee: apiResponse.fee,
        amountOut: apiResponse.amountOut,
      },
    });
  }
}
