// frontend/js/plugins/AnalyticsPlugin.js

export class AnalyticsPlugin {
  constructor() {
    this.name = "Analytics";
    this.version = "1.0.0";
    this.events = [];
    this.sessionId = this.generateSessionId();
  }

  init({ events, config }) {
    this.events = events;
    this.config = config;

    // Track page load
    this.track("page_load", {
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });

    // Listen to app events
    events.on("app:ready", () => this.track("app_ready"));
    events.on("search:start", (data) => this.track("search_start", data));
    events.on("search:complete", (data) =>
      this.track("search_complete", {
        resultCount: data.bridges?.length,
      }),
    );
    events.on("bridge:selected", (bridge) =>
      this.track("bridge_selected", {
        bridge: bridge.name,
        cost: bridge.totalCost,
      }),
    );
    events.on("theme:changed", (theme) =>
      this.track("theme_changed", { theme }),
    );
  }

  async preSearch(params) {
    this.track("search_params", params);
    return params;
  }

  async postSearch(results) {
    if (results.bridges && results.bridges.length > 0) {
      const cheapest = results.bridges[0];
      const mostExpensive = results.bridges[results.bridges.length - 1];

      this.track("search_results", {
        count: results.bridges.length,
        cheapestBridge: cheapest.name,
        cheapestCost: cheapest.totalCost,
        mostExpensiveBridge: mostExpensive.name,
        mostExpensiveCost: mostExpensive.totalCost,
        potentialSavings: mostExpensive.totalCost - cheapest.totalCost,
      });
    }
    return results;
  }

  track(event, data = {}) {
    const eventData = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...data,
    };

    // Send to analytics service
    if (this.config?.features?.enableAnalytics) {
      this.sendToAnalytics(eventData);
    }

    // Log in development
    if (this.config?.features?.enableDevMode) {
      console.log("[Analytics]", event, data);
    }
  }

  async sendToAnalytics(data) {
    try {
      // In production, send to your analytics service
      // await fetch('/api/analytics', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(data)
      // });

      // For now, just store in localStorage
      const stored = JSON.parse(
        localStorage.getItem("bridge_analytics") || "[]",
      );
      stored.push(data);

      // Keep only last 100 events
      if (stored.length > 100) {
        stored.shift();
      }

      localStorage.setItem("bridge_analytics", JSON.stringify(stored));
    } catch (error) {
      console.error("Analytics error:", error);
    }
  }

  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAnalytics() {
    return JSON.parse(localStorage.getItem("bridge_analytics") || "[]");
  }

  clearAnalytics() {
    localStorage.removeItem("bridge_analytics");
  }

  destroy() {
    this.track("session_end");
  }
}
