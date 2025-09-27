// frontend/js/components/BridgeCard.js - Enhanced Bridge Card Component

export class BridgeCard {
  static render(bridge, isBest = false) {
    const protocolBadge = bridge.protocol
      ? `<span class="protocol-badge">${bridge.protocol}</span>`
      : "";

    const card = `
      <div class="bridge-card ${isBest ? "best" : ""}" data-bridge="${
      bridge.name
    }">
        ${isBest ? '<div class="best-badge">✨ Best Option</div>' : ""}
        ${
          bridge.position
            ? `<div class="position-badge">#${bridge.position}</div>`
            : ""
        }
        <div class="bridge-content">
          <div class="bridge-icon">${bridge.icon || "🌉"}</div>
          <div class="bridge-info">
            <h3>${bridge.name} ${protocolBadge}</h3>
            <div class="bridge-meta">
              <span class="meta-item">⏱️ ${bridge.estimatedTime}</span>
              <span class="meta-item security-${bridge.security
                ?.toLowerCase()
                .replace(/\s+/g, "-")}">🔒 ${bridge.security}</span>
              <span class="meta-item liquidity-${bridge.liquidity?.toLowerCase()}">💧 ${
      bridge.liquidity
    }</span>
              ${
                bridge.route
                  ? `<span class="meta-item">📍 ${bridge.route}</span>`
                  : ""
              }
            </div>
          </div>
          <div class="fee-display">
            <div class="total-fee">$${bridge.totalCost.toFixed(2)}</div>
            <div class="fee-breakdown">
              Bridge: $${bridge.bridgeFee.toFixed(
                2
              )} | Gas: $${bridge.gasFee.toFixed(2)}
            </div>
            ${
              bridge.savings > 0
                ? `<div class="savings">Save $${bridge.savings.toFixed(
                    2
                  )}</div>`
                : ""
            }
          </div>
          <div class="bridge-actions">
            <button class="bridge-action" data-bridge="${bridge.name}">
              Use Bridge →
            </button>
            <button class="bridge-details-btn">
              Show Details ▼
            </button>
          </div>
        </div>
        <div class="bridge-details hidden">
          <div class="details-grid">
            ${
              bridge.outputAmount
                ? `
              <div class="detail-item">
                <span class="detail-label">Output Amount:</span>
                <span class="detail-value">${bridge.outputAmount}</span>
              </div>
            `
                : ""
            }
            <div class="detail-item">
              <span class="detail-label">Provider:</span>
              <span class="detail-value">${bridge.provider}</span>
            </div>
            ${
              bridge.url
                ? `
              <div class="detail-item">
                <span class="detail-label">Direct Link:</span>
                <a href="${bridge.url}" target="_blank" class="detail-link">Open Bridge ↗</a>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
    return card;
  }
}

// frontend/js/components/ProtocolFilter.js - Protocol Filter Component

export class ProtocolFilter {
  static render(protocols) {
    return `
      <div class="filter-header">
        <h3>Filter by Protocol</h3>
        <div class="filter-actions">
          <button id="selectAllProtocols" class="btn-text">Select All</button>
          <button id="clearAllProtocols" class="btn-text">Clear All</button>
        </div>
      </div>
      <div class="protocol-chips">
        ${protocols
          .map(
            (protocol) => `
          <label class="protocol-chip">
            <input type="checkbox" value="${protocol}" checked>
            <span>${protocol}</span>
          </label>
        `
          )
          .join("")}
      </div>
    `;
  }
}

// frontend/js/components/ComparisonChart.js - Visual Comparison Chart

export class ComparisonChart {
  static render(bridges) {
    if (!bridges || bridges.length === 0) return "";

    const maxCost = Math.max(...bridges.map((b) => b.totalCost));
    const minTime = Math.min(
      ...bridges.map((b) => parseInt(b.estimatedTime) || 999)
    );
    const maxTime = Math.max(
      ...bridges.map((b) => parseInt(b.estimatedTime) || 0)
    );

    return `
      <div class="chart-wrapper">
        <h3>Cost Comparison</h3>
        <div class="bar-chart">
          ${bridges
            .slice(0, 10)
            .map((bridge, index) => {
              const barHeight = (bridge.totalCost / maxCost) * 100;
              const timeNormalized =
                ((parseInt(bridge.estimatedTime) || 0) - minTime) /
                (maxTime - minTime || 1);
              const timeColor = `hsl(${120 - timeNormalized * 120}, 70%, 50%)`;

              return `
              <div class="bar-item">
                <div class="bar-container">
                  <div class="bar" style="height: ${barHeight}%">
                    <span class="bar-value">$${bridge.totalCost.toFixed(
                      2
                    )}</span>
                  </div>
                  <div class="time-indicator" style="background: ${timeColor}">
                    ${bridge.estimatedTime}
                  </div>
                </div>
                <div class="bar-label" title="${bridge.name}">
                  <span class="bar-icon">${bridge.icon}</span>
                  <span class="bar-name">${bridge.name.substring(0, 8)}${
                bridge.name.length > 8 ? "..." : ""
              }</span>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
        <div class="chart-legend">
          <span>🟢 Fast</span>
          <span>🟡 Medium</span>
          <span>🔴 Slow</span>
        </div>
      </div>
    `;
  }
}

// frontend/js/config.js - Enhanced Configuration

export const Config = {
  // Use your Cloudflare Worker URL
  apiUrl: "https://bridge-aggregator-api.shapehaveninnovations.workers.dev",

  chains: {
    1: { name: "Ethereum", icon: "🔷", chainId: "0x1" },
    137: { name: "Polygon", icon: "🟣", chainId: "0x89" },
    42161: { name: "Arbitrum", icon: "🔵", chainId: "0xa4b1" },
    10: { name: "Optimism", icon: "🔴", chainId: "0xa" },
    56: { name: "BSC", icon: "🟡", chainId: "0x38" },
    43114: { name: "Avalanche", icon: "🔺", chainId: "0xa86a" },
    8453: { name: "Base", icon: "🟦", chainId: "0x2105" },
    250: { name: "Fantom", icon: "👻", chainId: "0xfa" },
    100: { name: "Gnosis", icon: "🦉", chainId: "0x64" },
  },

  tokens: ["ETH", "USDC", "USDT", "DAI", "WETH", "WBTC"],

  protocols: [
    "LI.FI",
    "Stargate",
    "Socket",
    "Squid",
    "Rango",
    "XY Finance",
    "Rubic",
    "OpenOcean",
    "0x",
    "1inch",
    "Via Protocol",
    "Jumper",
  ],

  features: {
    enableAnalytics: true,
    enablePriceAlerts: true,
    enableProtocolFilter: true,
    enableComparisonChart: true,
    cacheTimeout: 60000, // 1 minute
    maxResults: 20,
  },

  defaultSettings: {
    slippage: 1,
    priceAlertThreshold: 10,
    debugMode: false,
  },
};
