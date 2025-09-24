// frontend/js/plugins/PriceAlertPlugin.js

export class PriceAlertPlugin {
  constructor() {
    this.name = "PriceAlert";
    this.version = "1.0.0";
    this.thresholds = {
      excellent: 2.5,
      good: 4.0,
      warning: 6.0,
    };
    this.notifications = [];
  }

  init({ events, state }) {
    this.events = events;
    this.state = state;

    // Load user preferences
    this.loadPreferences();
  }

  async postSearch(results) {
    if (!results.bridges || results.bridges.length === 0) {
      return results;
    }

    const cheapest = results.bridges[0];
    const alerts = [];

    // Check for excellent deals
    if (cheapest.totalCost < this.thresholds.excellent) {
      alerts.push({
        type: "success",
        message: `🎉 Excellent deal! Fee is under $${this.thresholds.excellent}`,
        priority: "high",
      });
    } else if (cheapest.totalCost < this.thresholds.good) {
      alerts.push({
        type: "info",
        message: `👍 Good price! Fee is under $${this.thresholds.good}`,
        priority: "medium",
      });
    } else if (cheapest.totalCost > this.thresholds.warning) {
      alerts.push({
        type: "warning",
        message: `⚠️ High fees detected! Consider waiting for better rates`,
        priority: "medium",
      });
    }

    // Check for significant price differences
    if (results.bridges.length > 1) {
      const expensive = results.bridges[results.bridges.length - 1];
      const savings = expensive.totalCost - cheapest.totalCost;

      if (savings > 5) {
        alerts.push({
          type: "success",
          message: `💰 Huge savings potential: $${savings.toFixed(
            2
          )} difference between bridges!`,
          priority: "high",
        });
      }
    }

    // Show alerts
    this.showAlerts(alerts);

    // Store for history
    this.storeAlertHistory(alerts, cheapest);

    return results;
  }

  showAlerts(alerts) {
    alerts.forEach((alert) => {
      if (typeof Toast !== "undefined") {
        Toast.show(
          alert.message,
          alert.type,
          alert.priority === "high" ? 5000 : 3000
        );
      }
    });

    this.notifications.push(...alerts);
  }

  storeAlertHistory(alerts, bridge) {
    const history = JSON.parse(localStorage.getItem("price_alerts") || "[]");

    history.push({
      timestamp: Date.now(),
      alerts,
      bridge: {
        name: bridge.name,
        cost: bridge.totalCost,
      },
    });

    // Keep only last 50 entries
    if (history.length > 50) {
      history.shift();
    }

    localStorage.setItem("price_alerts", JSON.stringify(history));
  }

  setThreshold(type, value) {
    if (this.thresholds[type] !== undefined) {
      this.thresholds[type] = value;
      this.savePreferences();
    }
  }

  loadPreferences() {
    const saved = localStorage.getItem("price_alert_prefs");
    if (saved) {
      const prefs = JSON.parse(saved);
      this.thresholds = { ...this.thresholds, ...prefs.thresholds };
    }
  }

  savePreferences() {
    localStorage.setItem(
      "price_alert_prefs",
      JSON.stringify({
        thresholds: this.thresholds,
      })
    );
  }

  getAlertHistory() {
    return JSON.parse(localStorage.getItem("price_alerts") || "[]");
  }

  clearHistory() {
    localStorage.removeItem("price_alerts");
    this.notifications = [];
  }

  destroy() {
    // Clean up if needed
  }
}
