// frontend/js/app.js - Enhanced Main Application Entry Point

import { Config } from "./config.js";
import { ApiClient } from "./api.js";
import { StateManager } from "./utils/StateManager.js";
import { BridgeCard } from "./components/BridgeCard.js";
import { Toast } from "./components/Toast.js";
import { AnalyticsPlugin } from "./plugins/AnalyticsPlugin.js";
import { PriceAlertPlugin } from "./plugins/PriceAlertPlugin.js";
import { ProtocolFilter } from "./components/ProtocolFilter.js";
import { ComparisonChart } from "./components/ComparisonChart.js";

/**
 * Format number with thousand separators
 * @param {number|string} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number with commas
 */
function formatNumber(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Format with decimals first
  const formatted = num.toFixed(decimals);

  // Add thousand separators
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
}

class BridgeApp {
  constructor() {
    this.state = new StateManager({
      selectedProtocols: [],
      sortBy: "cost",
      filterBy: "all",
    });
    this.api = new ApiClient(Config.apiUrl);
    this.plugins = new Map();
    this.allResults = [];
    this.filteredResults = [];
    this.init();
  }

  async init() {
    this.render();
    this.bindEvents();
    this.loadPlugins();
    this.initTheme();
    this.loadProviders();

    Toast.init({
      container: document.getElementById("toasts"),
    });
  }

  render() {
    document.getElementById("app").innerHTML = `
      <div class="container">
        <header class="header">

          <div class="logo">
            <span>Bridge Aggregator</span>
            <span class="version">v5.0</span>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" id="settingsBtn" title="Settings">⚙️</button>
            <button class="theme-toggle" id="themeToggle">🌙</button>
          </div>
        </header>
        
        <form class="bridge-form" id="bridgeForm">
          <div class="form-grid">
            <div class="form-group">
              <label>From Chain</label>
              <select class="form-control" id="fromChain">
                ${Object.entries(Config.chains)
                  .map(
                    ([id, chain]) =>
                      `<option value="${id}">${chain.icon} ${chain.name}</option>`,
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
                      `<option value="${id}">${chain.icon} ${chain.name}</option>`,
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Token</label>
              <select class="form-control" id="token">
                ${Config.tokens
                  .map((token) => `<option value="${token}">${token}</option>`)
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

        <!-- Protocol Filter Section -->
        <div id="protocolFilter" class="protocol-filter hidden"></div>

        <!-- Stats Section -->
        <div id="stats" class="stats-section hidden">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Best Price</div>
              <div class="stat-value" id="bestPrice">-</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg Price</div>
              <div class="stat-value" id="avgPrice">-</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Routes Found</div>
              <div class="stat-value" id="routeCount">-</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Max Savings</div>
              <div class="stat-value" id="maxSavings">-</div>
            </div>
          </div>
        </div>

        <!-- Comparison Chart -->
        <div id="chartContainer" class="chart-container hidden"></div>
        
        <!-- Results Section -->
        <div id="results" class="results-section hidden">
          <div class="results-header">
            <h2>Available Routes (<span id="resultCount">0</span>)</h2>
            <div class="sort-controls">
              <select id="sortBy" class="form-control-sm">
                <option value="cost">Sort by Cost</option>
                <option value="time">Sort by Time</option>
                <option value="security">Sort by Security</option>
                <option value="liquidity">Sort by Liquidity</option>
              </select>
            </div>
          </div>
          <div id="bridgeCards"></div>
        </div>

        <!-- Settings Modal -->
        <div id="settingsModal" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Settings</h3>
              <button class="modal-close" id="closeSettings">&times;</button>
            </div>
            <div class="modal-body">
              <div class="setting-group">
                <label>Slippage Tolerance (%)</label>
                <input type="number" id="slippage" value="1" min="0.1" max="5" step="0.1">
              </div>
              <div class="setting-group">
                <label>Price Alert Threshold ($)</label>
                <input type="number" id="priceThreshold" value="10" min="1" max="100" step="1">
              </div>
              <div class="setting-group">
                <label>Show Debug Info</label>
                <input type="checkbox" id="debugMode">
              </div>
              <div class="setting-group">
                <label>Enabled Providers</label>
                <div id="providerList" class="provider-list">
                  <!-- Dynamically populated -->
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" id="resetSettings">Reset to Default</button>
              <button class="btn-primary" id="saveSettings">Save Settings</button>
            </div>
          </div>
        </div>
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

    document.getElementById("sortBy")?.addEventListener("change", (e) => {
      this.sortResults(e.target.value);
    });

    // Settings modal
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.openSettings();
    });

    document.getElementById("closeSettings")?.addEventListener("click", () => {
      this.closeSettings();
    });

    document.getElementById("saveSettings")?.addEventListener("click", () => {
      this.saveSettings();
    });

    document.getElementById("resetSettings")?.addEventListener("click", () => {
      this.resetSettings();
    });

    // Protocol filter events will be bound by ProtocolFilter component
  }

  loadPlugins() {
    if (Config.features.enableAnalytics) {
      this.plugins.set("analytics", new AnalyticsPlugin());
    }
    if (Config.features.enablePriceAlerts) {
      this.plugins.set("priceAlerts", new PriceAlertPlugin());
    }
  }

  async loadProviders() {
    try {
      const response = await fetch(`${Config.apiUrl}/api/providers`);
      const data = await response.json();
      this.renderProviderList(data.providers);
    } catch (error) {
      console.error("Failed to load providers:", error);
    }
  }

  renderProviderList(providers) {
    const providerList = document.getElementById("providerList");
    if (!providerList) return;

    providerList.innerHTML = providers
      .map(
        (provider) => `
      <label class="provider-item">
        <input type="checkbox" 
               id="provider-${provider.name}" 
               value="${provider.name}"
               ${provider.status === "Active" ? "checked" : ""}>
        <span class="provider-name">${provider.name}</span>
        <span class="provider-status ${provider.status.toLowerCase()}">${
          provider.status
        }</span>
      </label>
    `,
      )
      .join("");
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
      this.allResults = results.bridges || [];
      this.filteredResults = [...this.allResults];

      // Run plugins
      this.plugins.forEach((plugin) => {
        if (plugin.onResults) plugin.onResults(results);
      });

      // Show protocol filter
      this.renderProtocolFilter();

      // Show stats
      this.renderStats(results);

      // Show comparison chart
      this.renderChart(this.filteredResults);

      // Show results
      this.renderResults(this.filteredResults);
    } catch (error) {
      Toast.show("Failed to fetch bridges", "error");
      console.error(error);
    } finally {
      this.setLoading(false);
    }
  }

  renderProtocolFilter() {
    const container = document.getElementById("protocolFilter");
    if (!this.allResults.length) return;

    const protocols = [
      ...new Set(this.allResults.map((b) => b.protocol || b.name)),
    ];

    container.innerHTML = ProtocolFilter.render(protocols);
    container.classList.remove("hidden");

    // Bind filter events
    container.querySelectorAll(".protocol-chip input").forEach((checkbox) => {
      checkbox.addEventListener("change", () => this.filterResults());
    });

    document
      .getElementById("selectAllProtocols")
      ?.addEventListener("click", () => {
        container
          .querySelectorAll(".protocol-chip input")
          .forEach((cb) => (cb.checked = true));
        this.filterResults();
      });

    document
      .getElementById("clearAllProtocols")
      ?.addEventListener("click", () => {
        container
          .querySelectorAll(".protocol-chip input")
          .forEach((cb) => (cb.checked = false));
        this.filterResults();
      });
  }

  filterResults() {
    const selectedProtocols = Array.from(
      document.querySelectorAll(".protocol-chip input:checked"),
    ).map((cb) => cb.value);

    if (selectedProtocols.length === 0) {
      this.filteredResults = [...this.allResults];
    } else {
      this.filteredResults = this.allResults.filter((b) =>
        selectedProtocols.includes(b.protocol || b.name),
      );
    }

    this.sortResults(document.getElementById("sortBy").value);
  }

  sortResults(sortBy) {
    switch (sortBy) {
      case "time":
        this.filteredResults.sort((a, b) => {
          const timeA = parseInt(a.estimatedTime) || 999;
          const timeB = parseInt(b.estimatedTime) || 999;
          return timeA - timeB;
        });
        break;
      case "security":
        const securityOrder = {
          LayerZero: 1,
          Axelar: 2,
          Audited: 3,
          Verified: 4,
          "Multi-chain": 5,
        };
        this.filteredResults.sort((a, b) => {
          const orderA = securityOrder[a.security] || 99;
          const orderB = securityOrder[b.security] || 99;
          return orderA - orderB;
        });
        break;
      case "liquidity":
        const liquidityOrder = { High: 1, Aggregated: 2, Medium: 3, Low: 4 };
        this.filteredResults.sort((a, b) => {
          const orderA = liquidityOrder[a.liquidity] || 99;
          const orderB = liquidityOrder[b.liquidity] || 99;
          return orderA - orderB;
        });
        break;
      case "cost":
      default:
        this.filteredResults.sort((a, b) => a.totalCost - b.totalCost);
    }

    this.renderResults(this.filteredResults);
    this.renderChart(this.filteredResults);
  }

  renderStats(data) {
    const statsSection = document.getElementById("stats");
    if (!data.bridges || data.bridges.length === 0) {
      statsSection.classList.add("hidden");
      return;
    }

    document.getElementById("bestPrice").textContent = `$${formatNumber(
      data.summary.bestPrice,
    )}`;
    document.getElementById("avgPrice").textContent = `$${formatNumber(
      data.summary.averagePrice,
    )}`;
    document.getElementById("routeCount").textContent = data.bridges.length;
    document.getElementById("maxSavings").textContent = `$${formatNumber(
      data.summary.worstPrice - data.summary.bestPrice,
    )}`;

    statsSection.classList.remove("hidden");
  }

  renderChart(bridges) {
    const container = document.getElementById("chartContainer");
    if (!bridges || bridges.length === 0) {
      container.classList.add("hidden");
      return;
    }

    container.innerHTML = ComparisonChart.render(bridges);
    container.classList.remove("hidden");
  }

  renderResults(bridges) {
    const container = document.getElementById("results");
    const cardsContainer = document.getElementById("bridgeCards");

    if (!bridges || bridges.length === 0) {
      cardsContainer.innerHTML = "<p>No bridges match your filters</p>";
      container.classList.remove("hidden");
      document.getElementById("resultCount").textContent = "0";
      return;
    }

    cardsContainer.innerHTML = bridges
      .map((bridge, index) =>
        BridgeCard.render({
          ...bridge,
          isBest: index === 0,
          position: index + 1,
        }),
      )
      .join("");

    document.getElementById("resultCount").textContent = bridges.length;
    container.classList.remove("hidden");

    // Bind bridge action buttons
    cardsContainer.querySelectorAll(".bridge-action").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const bridgeName = e.target.dataset.bridge;
        const bridge = bridges.find((b) => b.name === bridgeName);
        if (bridge) {
          this.useBridge(bridge);
        }
      });
    });

    cardsContainer.querySelectorAll(".bridge-details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".bridge-card");
        const details = card.querySelector(".bridge-details");
        details.classList.toggle("hidden");
        e.target.textContent = details.classList.contains("hidden")
          ? "Show Details ▼"
          : "Hide Details ▲";
      });
    });
  }

  useBridge(bridge) {
    Toast.show(`Opening ${bridge.name}...`, "info");
    if (bridge.url && bridge.url !== "#") {
      window.open(bridge.url, "_blank");
    }

    // Track usage
    this.plugins.forEach((plugin) => {
      if (plugin.track) {
        plugin.track("bridge_selected", {
          bridge: bridge.name,
          cost: bridge.totalCost,
          protocol: bridge.protocol,
        });
      }
    });
  }

  setLoading(loading) {
    const btn = document.getElementById("submitBtn");
    const text = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");

    btn.disabled = loading;
    text.textContent = loading ? "Searching..." : "Compare Bridges";
    spinner.classList.toggle("hidden", !loading);
  }

  openSettings() {
    document.getElementById("settingsModal").classList.remove("hidden");
  }

  closeSettings() {
    document.getElementById("settingsModal").classList.add("hidden");
  }

  saveSettings() {
    const settings = {
      slippage: document.getElementById("slippage").value,
      priceThreshold: document.getElementById("priceThreshold").value,
      debugMode: document.getElementById("debugMode").checked,
      enabledProviders: Array.from(
        document.querySelectorAll("#providerList input:checked"),
      ).map((cb) => cb.value),
    };

    localStorage.setItem("bridgeSettings", JSON.stringify(settings));
    Toast.show("Settings saved", "success");
    this.closeSettings();
  }

  resetSettings() {
    localStorage.removeItem("bridgeSettings");
    document.getElementById("slippage").value = "1";
    document.getElementById("priceThreshold").value = "10";
    document.getElementById("debugMode").checked = false;
    this.loadProviders();
    Toast.show("Settings reset to default", "info");
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
