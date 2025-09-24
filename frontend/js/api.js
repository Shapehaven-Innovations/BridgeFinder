// frontend/js/api.js - API Client for Bridge Aggregator

export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  async compare(params) {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromChainId: params.fromChain,
          toChainId: params.toChain,
          token: params.token,
          amount: parseFloat(params.amount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}
