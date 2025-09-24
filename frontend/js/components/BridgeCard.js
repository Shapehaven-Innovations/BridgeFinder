// frontend/js/components/BridgeCard.js

// frontend/js/components/BridgeCard.js

export class BridgeCard {
  static render(bridge, isBest = false) {
    const card = `
      <div class="bridge-card ${isBest ? "best" : ""}">
        ${isBest ? '<div class="best-badge">✨ Best Option</div>' : ""}
        <div class="bridge-content">
          <div class="bridge-icon">${bridge.icon || "🌉"}</div>
          <div class="bridge-info">
            <h3>${bridge.name}</h3>
            <div class="bridge-meta">
              <span>⏱️ ${bridge.estimatedTime}</span>
              <span>🔒 ${bridge.security}</span>
              <span>💧 ${bridge.liquidity}</span>
            </div>
          </div>
          <div class="fee-display">
            <div class="total-fee">$${bridge.totalCost.toFixed(2)}</div>
            <div class="fee-breakdown">
              Bridge: $${bridge.bridgeFee.toFixed(
                2
              )} | Gas: $${bridge.gasFee.toFixed(2)}
            </div>
          </div>
          <button class="bridge-action" data-bridge="${bridge.name}">
            Use Bridge →
          </button>
        </div>
      </div>
    `;
    return card;
  }
}
