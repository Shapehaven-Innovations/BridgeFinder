// worker/adapters/base.js
import { CONFIG, TOKENS } from "../config.js";

export class BridgeAdapter {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.icon = "🌉";
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.windowStart = Date.now();
  }

  // Rate limiting check
  async checkRateLimit() {
    const now = Date.now();
    const windowElapsed = now - this.windowStart;

    if (windowElapsed > this.config.rateLimit.window) {
      // Reset window
      this.windowStart = now;
      this.requestCount = 0;
    }

    if (this.requestCount >= this.config.rateLimit.requests) {
      const waitTime = this.config.rateLimit.window - windowElapsed;
      throw new Error(
        `Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`,
      );
    }

    this.requestCount++;
  }

  // Base method to be overridden by specific adapters
  async getQuote(params) {
    throw new Error("getQuote must be implemented by adapter");
  }

  // Common utility methods
  toUnits(amountStr, decimals) {
    const [i = "0", f = ""] = String(amountStr).split(".");
    const frac = (f + "0".repeat(decimals)).slice(0, decimals);
    return (
      BigInt(i) * 10n ** BigInt(decimals) +
      BigInt(frac || "0")
    ).toString();
  }

  getTokenAddress(token, chainId) {
    const tokenCfg = TOKENS[token];
    if (!tokenCfg) return null;
    if (typeof tokenCfg.address === "object") {
      return tokenCfg.address[chainId] || tokenCfg.address[1];
    }
    return tokenCfg.address;
  }

  async fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  // Standard response format
  formatResponse(data) {
    return {
      name: this.name,
      icon: this.icon,
      provider: this.name.toLowerCase().replace(/\s+/g, ""),
      totalCost: data.totalCost || CONFIG.DEFAULT_GAS_ESTIMATE,
      bridgeFee: data.bridgeFee || 0,
      gasFee: data.gasFee || CONFIG.DEFAULT_GAS_ESTIMATE,
      estimatedTime: data.estimatedTime || "5-10 mins",
      security: data.security || "Verified",
      liquidity: data.liquidity || "Medium",
      route: data.route || `${this.name} Route`,
      outputAmount: data.outputAmount || null,
      protocol: data.protocol || this.name,
      isEstimated: data.isEstimated || false, // Add flag for fallback responses
      meta: data.meta || undefined, // Include meta if provided
    };
  }
}
