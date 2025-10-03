// worker/adapters/rubic.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class RubicAdapter extends BridgeAdapter {
  constructor(config) {
    super("Rubic", config);
    this.icon = "💎";
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
    const fromBlockchain = this.mapChainToRubic(fromChainId);
    const toBlockchain = this.mapChainToRubic(toChainId);

    const body = {
      srcChainId: fromBlockchain,
      dstChainId: toBlockchain,
      srcTokenAddress: fromToken,
      dstTokenAddress: toToken,
      srcTokenAmount: fromAmount,
      walletAddress: sender,
    };

    const url = "https://api-v2.rubic.exchange/api/routes";

    // [DEV-LOG] API URL and Body
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION
    console.log(`[${this.name}] Body:`, JSON.stringify(body, null, 2)); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    if (!data?.routes || !data.routes.length) {
      throw new Error(`${this.name}: No routes found`);
    }

    return this.mapToStandardFormat(data.routes[0], amount);
  }

  mapToStandardFormat(route, amount) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const priceImpactPct = parseUSD(route.priceImpact);
    const priceImpact = (priceImpactPct / 100) * parseFloat(amount);
    const gasFee = parseUSD(route.gasPrice || route.gasCost?.usd) || 5.0;

    return this.formatResponse({
      totalCost: priceImpact + gasFee,
      bridgeFee: priceImpact,
      gasFee: gasFee,
      estimatedTime: `${Math.ceil((route.estimatedTime || 300) / 60)} mins`,
      route: "Rubic Route",
      protocol: "Rubic",
      outputAmount: route.dstTokenAmount,
      meta: {
        tool: "rubic",
        priceImpact: route.priceImpact,
        type: route.type,
      },
    });
  }

  mapChainToRubic(chainId) {
    const map = {
      1: "ETH",
      10: "OPTIMISM",
      56: "BSC",
      137: "POLYGON",
      250: "FANTOM",
      8453: "BASE",
      42161: "ARBITRUM",
      43114: "AVALANCHE",
    };
    const result = map[chainId];
    if (!result) {
      throw new Error(`Rubic: Unsupported chain ${chainId}`);
    }
    return result;
  }
}
