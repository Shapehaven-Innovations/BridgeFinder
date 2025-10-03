// worker/adapters/zerox.js
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class ZeroXAdapter extends BridgeAdapter {
  constructor(config) {
    super("0x", config);
    this.icon = "🔷";
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

    // 0x only works for same-chain swaps
    if (fromChainId !== toChainId) {
      throw new Error(
        `${this.name}: Cross-chain not supported (chain ${fromChainId} -> ${toChainId})`
      );
    }

    const tokenCfg = TOKENS[token];
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`);
    }

    const buyToken = this.getTokenAddress(token, toChainId);
    const sellToken = this.getTokenAddress(token, fromChainId);

    if (!buyToken || !sellToken) {
      throw new Error(`${this.name}: Missing token addresses`);
    }

    const sellAmount = this.toUnits(amount, tokenCfg.decimals);

    if (!env?.ZEROX_API_KEY) {
      throw new Error(`${this.name}: API key required (set ZEROX_API_KEY)`);
    }

    const queryParams = new URLSearchParams({
      sellToken,
      buyToken,
      sellAmount,
      takerAddress: sender,
    });

    const url = `https://api.0x.org/swap/v1/quote?${queryParams}`;

    // [DEV-LOG] API URL
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      headers: {
        "0x-api-key": env.ZEROX_API_KEY,
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

    if (!data || !data.price) {
      throw new Error(`${this.name}: Invalid response - missing price data`);
    }

    return this.mapToStandardFormat(data);
  }

  mapToStandardFormat(apiResponse) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const gasUSD =
      (parseUSD(apiResponse.estimatedGas) *
        parseUSD(apiResponse.gasPrice) *
        2000) /
      1e18;
    const protocolFee = parseUSD(apiResponse.protocolFee) / 1e6;

    return this.formatResponse({
      totalCost: gasUSD + protocolFee,
      bridgeFee: protocolFee,
      gasFee: gasUSD,
      estimatedTime: "1-2 mins",
      route: "0x Protocol",
      protocol: "0x",
      outputAmount: apiResponse.buyAmount,
      meta: {
        tool: "0x",
        price: apiResponse.price,
        estimatedGas: apiResponse.estimatedGas,
        sources: apiResponse.sources,
      },
    });
  }
}
