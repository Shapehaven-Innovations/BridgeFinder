// worker/adapters/rango.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class RangoAdapter extends BridgeAdapter {
  constructor(config) {
    super("Rango", config);
    this.icon = "🦘";
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
    const fromBlockchain = this.mapChainToRango(fromChainId);
    const toBlockchain = this.mapChainToRango(toChainId);

    const body = {
      from: {
        blockchain: fromBlockchain,
        symbol: token,
        address: fromToken,
      },
      to: {
        blockchain: toBlockchain,
        symbol: token,
        address: toToken,
      },
      amount: fromAmount,
      slippage: CONFIG.DEFAULT_SLIPPAGE,
      affiliateRef: env?.INTEGRATOR_NAME || "bridge-aggregator",
    };

    const url = "https://api.rango.exchange/routing/best";

    // [DEV-LOG] API URL and Body
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION
    console.log(`[${this.name}] Body:`, JSON.stringify(body, null, 2)); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": env?.RANGO_API_KEY || "c6381a79-2817-4602-83bf-6a641a409e32",
      },
      body: JSON.stringify(body),
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

    if (!data?.result) {
      throw new Error(`${this.name}: Invalid response - missing result`);
    }

    return this.mapToStandardFormat(data.result);
  }

  mapToStandardFormat(apiResponse) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const feeUSD = parseUSD(apiResponse.fee?.totalFee);
    const gasUSD = parseUSD(apiResponse.fee?.networkFee);

    return this.formatResponse({
      totalCost: feeUSD + gasUSD,
      bridgeFee: feeUSD,
      gasFee: gasUSD,
      estimatedTime: `${Math.ceil((apiResponse.estimatedTimeInSeconds || 300) / 60)} mins`,
      route: "Rango Route",
      protocol: "Rango",
      outputAmount: apiResponse.outputAmount,
      meta: {
        tool: "rango",
        swappers: apiResponse.swappers,
        estimatedTimeInSeconds: apiResponse.estimatedTimeInSeconds,
      },
    });
  }

  mapChainToRango(chainId) {
    const map = {
      1: "ETH",
      137: "POLYGON",
      42161: "ARBITRUM",
      10: "OPTIMISM",
      56: "BSC",
      43114: "AVAX_CCHAIN",
      8453: "BASE",
      250: "FANTOM",
    };
    const result = map[chainId];
    if (!result) {
      throw new Error(`Rango: Unsupported chain ${chainId}`);
    }
    return result;
  }
}
