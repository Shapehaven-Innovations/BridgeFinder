// worker/adapters/jumper.js
export class JumperAdapter extends BridgeAdapter {
  constructor(config) {
    super("Jumper", config);
    this.icon = "🦘";
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

    const queryParams = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      slippage: slippage || CONFIG.DEFAULT_SLIPPAGE || "0.01",
      integrator: env?.INTEGRATOR_NAME || "BridgeAggregator",
      skipSimulation: "false",
    });

    const headers = { Accept: "application/json" };
    if (env?.LIFI_API_KEY) {
      headers["x-lifi-api-key"] = env.LIFI_API_KEY;
    }

    const url = `https://li.quest/v1/quote?${queryParams}`;

    // [DEV-LOG] API URL
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, { headers });

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

    if (!data?.estimate) {
      throw new Error(`${this.name}: Invalid response - missing estimate`);
    }

    return this.mapToStandardFormat(data);
  }

  mapToStandardFormat(apiResponse) {
    const { estimate, toolDetails } = apiResponse;

    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const roundUSD = (value) => Math.round(parseUSD(value) * 100) / 100;

    const totalFeeCostUSD = (estimate.feeCosts || []).reduce(
      (sum, fee) => sum + parseUSD(fee.amountUSD),
      0
    );

    const totalGasCostUSD = (estimate.gasCosts || []).reduce(
      (sum, gas) => sum + parseUSD(gas.amountUSD),
      0
    );

    const totalCostUSD = totalFeeCostUSD + totalGasCostUSD;
    const executionMinutes = Math.ceil(
      (estimate.executionDuration || 300) / 60
    );

    return this.formatResponse({
      totalCost: roundUSD(totalCostUSD),
      bridgeFee: roundUSD(totalFeeCostUSD),
      gasFee: roundUSD(totalGasCostUSD),
      outputAmount: estimate.toAmount,
      estimatedTime: `${executionMinutes} mins`,
      route: toolDetails?.name || "Best Route",
      protocol: "LI.FI",
      meta: {
        tool: estimate.tool,
        toolKey: toolDetails?.key,
        toolName: toolDetails?.name,
        toolLogoURI: toolDetails?.logoURI,
        approvalAddress: estimate.approvalAddress,
        toAmountMin: estimate.toAmountMin,
        fromAmount: estimate.fromAmount,
        executionDuration: estimate.executionDuration,
        fromAmountUSD: estimate.fromAmountUSD,
        toAmountUSD: estimate.toAmountUSD,
        feeCosts: estimate.feeCosts,
        gasCosts: estimate.gasCosts,
      },
    });
  }
}
