// frontend/js/app.js - Main Application Entry Point

import { Config } from "./config.js";
import { ApiClient } from "./api.js";
import { StateManager } from "./utils/StateManager.js";
import { BridgeCard } from "./components/BridgeCard.js";
import { Toast } from "./components/Toast.js"; // Make sure this import exists
import { AnalyticsPlugin } from "./plugins/AnalyticsPlugin.js";
import { PriceAlertPlugin } from "./plugins/PriceAlertPlugin.js";

class BridgeApp {
  constructor() {
    this.state = new StateManager();
    this.api = new ApiClient(Config.apiUrl);
    this.plugins = new Map();
    this.init();
  }

  async init() {
    this.render();
    this.bindEvents();
    this.loadPlugins();
    this.initTheme();

    Toast.init({
      container: document.getElementById("toasts"),
    });
  }
  render() {
    document.getElementById("app").innerHTML = `
            <div class="container">
                <header class="header">
                    <div class="logo">
                        🌉 <span>Bridge Aggregator</span>
                    </div>
                    <button class="theme-toggle" id="themeToggle">🌙</button>
                </header>
                
                <form class="bridge-form" id="bridgeForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>From Chain</label>
                            <select class="form-control" id="fromChain">
                                ${Object.entries(Config.chains)
                                  .map(
                                    ([id, chain]) =>
                                      `<option value="${id}">${chain.icon} ${chain.name}</option>`
                                  )
                                  .join("")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>To Chain</label>
                            <select class="form-control" id="toChain">
                                ${Object.entries(Config.chains)
                                  .map(
                                    ([id, chain]) =>
                                      `<option value="${id}">${chain.icon} ${chain.name}</option>`
                                  )
                                  .join("")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Token</label>
                            <select class="form-control" id="token">
                                ${Config.tokens
                                  .map(
                                    (token) =>
                                      `<option value="${token}">${token}</option>`
                                  )
                                  .join("")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount</label>
                            <input type="number" class="form-control" id="amount" 
                                   value="100" min="0" step="0.01">
                        </div>
                    </div>
                    <button type="submit" class="btn-primary" id="submitBtn">
                        <span id="btnText">Compare Bridges</span>
                        <span class="spinner hidden" id="spinner"></span>
                    </button>
                </form>
                
                <div id="results" class="results-section hidden"></div>
            </div>
            <div class="toast-container" id="toasts"></div>
        `;

    // Set default "To Chain" to different value
    document.getElementById("toChain").value = "137";
  }

  bindEvents() {
    document.getElementById("bridgeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSearch();
    });

    document.getElementById("themeToggle").addEventListener("click", () => {
      this.toggleTheme();
    });
  }

  loadPlugins() {
    if (Config.features.enableAnalytics) {
      this.plugins.set("analytics", new AnalyticsPlugin());
    }
    if (Config.features.enablePriceAlerts) {
      this.plugins.set("priceAlerts", new PriceAlertPlugin());
    }
  }

  async handleSearch() {
    const formData = {
      fromChain: document.getElementById("fromChain").value,
      toChain: document.getElementById("toChain").value,
      token: document.getElementById("token").value,
      amount: document.getElementById("amount").value,
    };

    if (formData.fromChain === formData.toChain) {
      Toast.show("Please select different chains", "error");
      return;
    }

    this.setLoading(true);

    try {
      const results = await this.api.compare(formData);

      // Run plugins
      this.plugins.forEach((plugin) => {
        if (plugin.onResults) plugin.onResults(results);
      });

      this.renderResults(results);
    } catch (error) {
      Toast.show("Failed to fetch bridges", "error");
      console.error(error);
    } finally {
      this.setLoading(false);
    }
  }

  renderResults(data) {
    const container = document.getElementById("results");

    if (!data.bridges || data.bridges.length === 0) {
      container.innerHTML = "<p>No bridges available for this route</p>";
      container.classList.remove("hidden");
      return;
    }

    container.innerHTML = `
            <h2>Available Routes (${data.bridges.length})</h2>
            ${data.bridges
              .map((bridge, index) => BridgeCard.render(bridge, index === 0))
              .join("")}
        `;

    container.classList.remove("hidden");
  }

  setLoading(loading) {
    const btn = document.getElementById("submitBtn");
    const text = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");

    btn.disabled = loading;
    text.textContent = loading ? "Searching..." : "Compare Bridges";
    spinner.classList.toggle("hidden", !loading);
  }

  initTheme() {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    document.getElementById("themeToggle").textContent =
      saved === "dark" ? "☀️" : "🌙";
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.getElementById("themeToggle").textContent =
      next === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", next);
  }
}

// Initialize app
window.addEventListener("DOMContentLoaded", () => new BridgeApp());
