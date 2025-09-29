// frontend/js/api.js - API Client for Bridge Aggregator

export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl =
      baseUrl ||
      "https://bridge-aggregator-api.shapehaveninnovations.workers.dev";
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute
  }

  async compare(params) {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log("Using cached data");
      return cached.data;
    }

    try {
      console.log("Making API call to:", `${this.baseUrl}/api/compare`);
      console.log("Request params:", {
        fromChainId: parseInt(params.fromChain),
        toChainId: parseInt(params.toChain),
        token: params.token,
        amount: parseFloat(params.amount),
      });

      const response = await fetch(`${this.baseUrl}/api/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromChainId: parseInt(params.fromChain),
          toChainId: parseInt(params.toChain),
          token: params.token,
          amount: parseFloat(params.amount),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.details || errorJson.error || errorText;
        } catch (e) {
          // Keep as text if not JSON
        }
        console.error("API Error Response:", response.status, errorDetail);
        throw new Error(`Bridge comparison failed: ${errorDetail}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error("API Error:", error);
      // Don't fall back to demo data - throw the error
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}
