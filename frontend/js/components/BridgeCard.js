// frontend/js/components/BridgeCard.js

export class BridgeCard {
  constructor(options) {
    this.bridge = options.bridge;
    this.isBest = options.isBest;
    this.events = options.events;
  }

  render() {
    const card = document.createElement("div");
    card.className = `bridge-card ${this.isBest ? "best-option" : ""} fade-in`;

    if (this.isBest) {
      card.innerHTML += `<div class="best-badge">✨ Best Option</div>`;
    }

    card.innerHTML += `
            <div class="bridge-content">
                <div class="bridge-icon">${this.bridge.icon}</div>
                <div class="bridge-info">
                    <h3>${this.bridge.name}</h3>
                    <div class="bridge-meta">
                        <span class="meta-item">⏱️ ${
                          this.bridge.estimatedTime
                        }</span>
                        <span class="meta-item">🔒 ${
                          this.bridge.security
                        }</span>
                        <span class="meta-item">💧 ${
                          this.bridge.liquidity
                        }</span>
                    </div>
                </div>
                <div class="fee-display">
                    <div class="total-fee">$${this.bridge.totalCost.toFixed(
                      2
                    )}</div>
                    <div class="fee-breakdown">
                        Bridge: $${this.bridge.bridgeFee.toFixed(
                          2
                        )} | Gas: $${this.bridge.gasFee.toFixed(2)}
                    </div>
                </div>
                <button class="bridge-action" data-bridge="${this.bridge.name}">
                    Use Bridge →
                </button>
            </div>
        `;

    // Bind events
    const actionBtn = card.querySelector(".bridge-action");
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleBridgeSelect();
    });

    card.addEventListener("click", () => {
      this.events.emit("bridge:card:clicked", this.bridge);
    });

    return card;
  }

  handleBridgeSelect() {
    this.events.emit("bridge:selected", this.bridge);

    // In production, redirect to bridge
    console.log(`Selected bridge: ${this.bridge.name}`);

    // Show redirect toast
    Toast.show(`Redirecting to ${this.bridge.name}...`, "info");
  }
}
