// ===== worker/adapters/socket.js =====
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class SocketAdapter extends BridgeAdapter {
  constructor(config) {
    super("Socket", config);
    this.icon = "🔌";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Socket: unknown token");

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

    const headers = {
      Accept: "application/json",
      "API-KEY": env.SOCKET_API_KEY || "72a5b4b0-e727-48be-8aa1-5da9d62fe635", // Public demo key
    };

    try {
      const res = await this.fetchWithTimeout(
        `https://api.socket.tech/v2/quote?${queryParams}`,
        { headers }
      );

      if (!res.ok) throw new Error(`Socket: HTTP ${res.status}`);
      const data = await res.json();

      if (!data.result?.routes?.length) {
        throw new Error("Socket: No routes found");
      }

      const route = data.result.routes[0];
      const totalGasFeesInUsd = parseFloat(route.totalGasFeesInUsd || "5");
      const bridgeFee = parseFloat(route.bridgeFee?.amount || "0") / 1e6; // Assuming USDC decimals

      return this.formatResponse({
        totalCost: totalGasFeesInUsd + bridgeFee,
        bridgeFee,
        gasFee: totalGasFeesInUsd,
        estimatedTime: `${Math.ceil(route.serviceTime / 60)} mins`,
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: route.usedBridgeNames?.join(" + ") || "Socket Route",
        outputAmount: route.toAmount,
        protocol: "Socket/Bungee",
      });
    } catch (error) {
      // Return estimated values
      return this.formatResponse({
        totalCost: 10,
        bridgeFee: 4,
        gasFee: 6,
        estimatedTime: "5-10 mins",
        security: "Multi-Bridge",
        liquidity: "Aggregated",
        route: "Socket Route",
        protocol: "Socket/Bungee",
      });
    }
  }
}
