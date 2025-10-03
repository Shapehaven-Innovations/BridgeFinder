// worker/adapters/squid.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class SquidAdapter extends BridgeAdapter {
  constructor(config) {
    super("Squid", config);
    this.icon = "🦑";
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

    const body = {
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken,
      toToken,
      fromAmount,
      fromAddress: sender,
      toAddress: sender,
      slippage: parseFloat(CONFIG.DEFAULT_SLIPPAGE),
      enableBoost: true,
    };

    const url = "https://api.0xsquid.com/v1/route";

    // [DEV-LOG] API URL and Body
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION
    console.log(`[${this.name}] Body:`, JSON.stringify(body, null, 2)); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integrator-id": env?.INTEGRATOR_NAME || "bridge-aggregator",
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

    if (!data.route) {
      throw new Error(`${this.name}: No route found`);
    }

    return this.mapToStandardFormat(data.route);
  }

  mapToStandardFormat(route) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const gasCostUSD = parseUSD(route.estimate.gasCosts?.amount) / 1e6;
    const feeCostUSD = parseUSD(route.estimate.feeCosts?.[0]?.amountUSD);

    return this.formatResponse({
      totalCost: gasCostUSD + feeCostUSD,
      bridgeFee: feeCostUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil(route.estimate.estimatedRouteDuration / 60)} mins`,
      route: "Squid Router",
      protocol: "Axelar",
      outputAmount: route.estimate.toAmount,
      meta: {
        tool: "squid",
        estimatedRouteDuration: route.estimate.estimatedRouteDuration,
      },
    });
  }
}
