// frontend/js/components/BridgeCard.js - Enhanced Bridge Card Component

// Add formatNumber function
function formatNumber(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const formatted = num.toFixed(decimals);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export class BridgeCard {
  static render(bridge, isBest = false) {
    // Handle unavailable bridges differently
    if (bridge.unavailable) {
      return `
        <div class="bridge-card unavailable" data-bridge="${bridge.name}">
          <div class="bridge-content">
            <div class="bridge-icon">${bridge.icon || "🌉"}</div>
            <div class="bridge-info">
              <h3>${bridge.name} <span class="protocol-badge">${bridge.protocol}</span></h3>
              <div class="unavailable-status">
                <span class="status-indicator">⚠️</span>
                <span class="status-text">${bridge.unavailableReason}</span>
              </div>
              <div class="bridge-meta">
                <span class="meta-item security-${bridge.security?.toLowerCase().replace(/\s+/g, "-")}">🔒 ${bridge.security}</span>
                <span class="meta-item liquidity-${bridge.liquidity?.toLowerCase()}">💧 ${bridge.liquidity}</span>
              </div>
            </div>
            <div class="fee-display unavailable-display">
              <div class="unavailable-label">Not Available</div>
            </div>
          </div>
          <div class="unavailable-details">
            <p class="unavailable-description">${bridge.unavailableDetails}</p>
          </div>
        </div>
      `;
    }

    // Normal available bridge display
    const protocolBadge = bridge.protocol
      ? `<span class="protocol-badge">${bridge.protocol}</span>`
      : "";

    const card = `
      <div class="bridge-card ${isBest ? "best" : ""}" data-bridge="${bridge.name}">
        ${isBest ? '<div class="best-badge">✨ Best Option</div>' : ""}
        ${bridge.position ? `<div class="position-badge">#${bridge.position}</div>` : ""}
        
        <div class="bridge-content">
          <div class="bridge-icon">${bridge.icon || "🌉"}</div>
          <div class="bridge-info">
            <h3>${bridge.name} ${protocolBadge}</h3>
            <div class="bridge-meta">
              <span class="meta-item">⏱️ ${bridge.estimatedTime}</span>
              <span class="meta-item security-${bridge.security?.toLowerCase().replace(/\s+/g, "-")}">🔒 ${bridge.security}</span>
              <span class="meta-item liquidity-${bridge.liquidity?.toLowerCase()}">💧 ${bridge.liquidity}</span>
              ${bridge.route ? `<span class="meta-item">📍 ${bridge.route}</span>` : ""}
            </div>
          </div>
          <div class="fee-display">
            <div class="total-fee">${formatNumber(bridge.totalCost)}</div>
            <div class="fee-breakdown">
              Bridge: ${formatNumber(bridge.bridgeFee)} | Gas: ${formatNumber(bridge.gasFee)}
            </div>
            ${bridge.savings > 0 ? `<div class="savings">Save ${formatNumber(bridge.savings)}</div>` : ""}
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
            ${
              bridge.meta?.fees
                ? `
              <div class="detail-item full-width">
                <span class="detail-label">Fee Breakdown:</span>
                <div class="fee-list">
                  ${bridge.meta.fees
                    .map(
                      (fee) => `
                    <div class="fee-item">
                      <span>${fee.name}</span>
                      <span>${formatNumber(fee.amount)}</span>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
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
