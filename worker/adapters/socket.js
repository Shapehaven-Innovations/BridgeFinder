// worker/adapters/socket.js
export class SocketAdapter extends BridgeAdapter {
  constructor(config) {
    super("Socket", config);
    this.icon = "🔌";
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
    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    const queryParams = new URLSearchParams({
      fromChainId: String(fromChainId),
      toChainId: String(toChainId),
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount,
      userAddress: sender,
      uniqueRoutesPerBridge: "true",
      sort: "output",
      singleTxOnly: "true",
    });

    const url = `https://api.socket.tech/v2/quote?${queryParams}`;

    // [DEV-LOG] API URL
    console.log(`[${this.name}] Fetching:`, url); // REMOVE-FOR-PRODUCTION

    const res = await this.fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        "API-KEY": env.SOCKET_API_KEY || "72a5b4b0-e727-48be-8aa1-5da9d62fe635",
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

    if (!data.result?.routes?.length) {
      throw new Error(`${this.name}: No routes found`);
    }

    return this.mapToStandardFormat(data.result.routes[0]);
  }

  mapToStandardFormat(route) {
    const parseUSD = (value) => {
      const num = parseFloat(value || "0");
      return isNaN(num) ? 0 : num;
    };

    const totalGasFeesInUsd = parseUSD(route.totalGasFeesInUsd);
    const bridgeFee = parseUSD(route.bridgeFee?.amount) / 1e6;

    return this.formatResponse({
      totalCost: totalGasFeesInUsd + bridgeFee,
      bridgeFee,
      gasFee: totalGasFeesInUsd,
      estimatedTime: `${Math.ceil(route.serviceTime / 60)} mins`,
      route: route.usedBridgeNames?.join(" + ") || "Socket Route",
      protocol: "Socket/Bungee",
      outputAmount: route.toAmount,
      meta: {
        tool: "socket",
        usedBridgeNames: route.usedBridgeNames,
        serviceTime: route.serviceTime,
      },
    });
  }
}
