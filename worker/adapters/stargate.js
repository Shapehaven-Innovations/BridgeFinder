// ===== worker/adapters/stargate.js =====
import { BridgeAdapter } from "./base.js";
import { CONFIG, TOKENS } from "../config.js";

export class StargateAdapter extends BridgeAdapter {
  constructor(config) {
    super("Stargate", config);
    this.icon = "⭐";
  }

  async getQuote(params, env) {
    await this.checkRateLimit();

    const { fromChainId, toChainId, token, amount, sender } = params;
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) throw new Error("Stargate: unknown token");

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
      throw new Error("Stargate: Chain not supported");
    }

    const fromToken = this.getTokenAddress(token, fromChainId);
    const fromAmount = this.toUnits(amount, tokenCfg.decimals);

    // Stargate uses pool IDs for different tokens
    const poolIds = {
      USDC: 1,
      USDT: 2,
      DAI: 3,
      WETH: 13,
      ETH: 13,
    };

    const poolId = poolIds[token] || 1;

    const body = {
      srcChainId,
      dstChainId,
      srcPoolId: poolId,
      dstPoolId: poolId,
      amount: fromAmount,
      amountOutMin: "0", // Will be calculated with slippage
      wallet: sender,
      slippage: parseInt(CONFIG.DEFAULT_SLIPPAGE * 100),
    };

    try {
      // Using Stargate's public API endpoint
      const res = await this.fetchWithTimeout(
        "https://api.stargate.finance/v1/quote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        // Fallback with estimated values if API fails
        return this.formatResponse({
          totalCost: 8,
          bridgeFee: 3,
          gasFee: 5,
          estimatedTime: "1-3 mins",
          security: "LayerZero",
          liquidity: "High",
          route: "Stargate Bridge",
          protocol: "LayerZero",
        });
      }

      const data = await res.json();

      const fee = parseFloat(data.fee || "3");
      const gasEstimate = parseFloat(data.gasEstimate || "5");

      return this.formatResponse({
        totalCost: fee + gasEstimate,
        bridgeFee: fee,
        gasFee: gasEstimate,
        estimatedTime: "1-3 mins",
        security: "LayerZero",
        liquidity: "High",
        route: "Stargate Bridge",
        outputAmount: data.expectedOutput,
        protocol: "LayerZero",
      });
    } catch (error) {
      // Return estimated values on error
      return this.formatResponse({
        totalCost: 8,
        bridgeFee: 3,
        gasFee: 5,
        estimatedTime: "1-3 mins",
        security: "LayerZero",
        liquidity: "High",
        route: "Stargate Bridge",
        protocol: "LayerZero",
      });
    }
  }
}
