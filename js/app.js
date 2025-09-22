// frontend/js/app.js
const API_URL =
  "https://bridge-aggregator-api.shapehaveninnovations.workers.dev"; // Will be updated after deploying worker

const CHAIN_INFO = {
  1: { name: "Ethereum", icon: "⟠" },
  137: { name: "Polygon", icon: "🟣" },
  42161: { name: "Arbitrum", icon: "🔵" },
  10: { name: "Optimism", icon: "🔴" },
  56: { name: "BSC", icon: "🟡" },
  43114: { name: "Avalanche", icon: "🔺" },
};

const TOKEN_ADDRESSES = {
  USDC: {
    1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    137: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    10: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
    56: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
  },
  USDT: {
    1: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    137: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    42161: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    10: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    56: "0x55d398326f99059ff775485246999027b3197955",
    43114: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
  },
};

class BridgeAggregator {
  constructor() {
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document
      .getElementById("compareBtn")
      .addEventListener("click", () => this.compareBridges());

    // Auto-switch chains if same selected
    document.getElementById("fromChain").addEventListener("change", (e) => {
      const toChain = document.getElementById("toChain");
      if (e.target.value === toChain.value) {
        // Switch to a different chain
        const options = Array.from(toChain.options);
        const nextOption = options.find((opt) => opt.value !== e.target.value);
        if (nextOption) toChain.value = nextOption.value;
      }
    });
  }

  async compareBridges() {
    const fromChain = document.getElementById("fromChain").value;
    const toChain = document.getElementById("toChain").value;
    const token = document.getElementById("token").value;
    const amount = document.getElementById("amount").value;

    if (!amount || amount <= 0) {
      this.showError("Please enter a valid amount");
      return;
    }

    this.showLoading(true);
    this.hideError();

    try {
      const response = await fetch(`${API_URL}/api/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromChain,
          toChain,
          token,
          amount: parseFloat(amount),
          tokenAddress: TOKEN_ADDRESSES[token]?.[fromChain],
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch quotes");

      const data = await response.json();
      this.displayResults(data.quotes, fromChain, toChain, amount, token);
    } catch (error) {
      this.showError("Failed to fetch bridge quotes. Please try again.");
      console.error("Error:", error);
    } finally {
      this.showLoading(false);
    }
  }

  displayResults(quotes, fromChain, toChain, amount, token) {
    const resultsSection = document.getElementById("results");
    const resultsContainer = document.getElementById("resultsContainer");
    const savingsBadge = document.getElementById("savingsBadge");

    // Clear previous results
    resultsContainer.innerHTML = "";

    if (!quotes || quotes.length === 0) {
      resultsContainer.innerHTML =
        "<p>No available bridges found for this route.</p>";
      resultsSection.classList.remove("hidden");
      return;
    }

    // Sort by total cost (ascending)
    quotes.sort((a, b) => a.totalCost - b.totalCost);

    // Calculate potential savings
    if (quotes.length > 1) {
      const bestPrice = quotes[0].totalCost;
      const worstPrice = quotes[quotes.length - 1].totalCost;
      const savings = (worstPrice - bestPrice).toFixed(2);

      if (savings > 0) {
        savingsBadge.textContent = `💰 Save up to $${savings}`;
        savingsBadge.classList.remove("hidden");
      }
    }

    // Display each bridge option
    quotes.forEach((quote, index) => {
      const card = this.createBridgeCard(
        quote,
        index === 0,
        fromChain,
        toChain,
        amount,
        token
      );
      resultsContainer.appendChild(card);
    });

    resultsSection.classList.remove("hidden");
  }

  createBridgeCard(quote, isBest, fromChain, toChain, amount, token) {
    const card = document.createElement("div");
    card.className = `bridge-card ${isBest ? "best-option" : ""}`;

    const estimatedTime = quote.estimatedTime || "5-20 mins";
    const bridgeFee = quote.bridgeFee || 0;
    const gasFee = quote.gasFee || 0;
    const totalCost = quote.totalCost || bridgeFee + gasFee;

    card.innerHTML = `
            <div class="bridge-logo">${quote.icon || "🌉"}</div>
            <div class="bridge-info">
                <h3>${quote.bridge} ${isBest ? "✨ Best Option" : ""}</h3>
                <div class="bridge-details">
                    <span>⏱ ${estimatedTime}</span>
                    <span>🔒 ${quote.security || "Trusted"}</span>
                    <span>📊 ${quote.liquidity || "High Liquidity"}</span>
                </div>
            </div>
            <div class="fee-breakdown">
                <div class="total-cost">$${totalCost.toFixed(2)}</div>
                <div class="fee-details">
                    Bridge: $${bridgeFee.toFixed(2)} | Gas: $${gasFee.toFixed(
      2
    )}
                </div>
            </div>
            <button class="bridge-btn" onclick="window.open('${this.generateBridgeUrl(
              quote,
              fromChain,
              toChain,
              amount,
              token
            )}', '_blank')">
                Use Bridge →
            </button>
        `;

    return card;
  }

  generateBridgeUrl(quote, fromChain, toChain, amount, token) {
    // Add affiliate/revenue parameters to the bridge URL
    const baseUrl = quote.url || "#";
    const separator = baseUrl.includes("?") ? "&" : "?";

    // These would be your actual affiliate parameters
    const affiliateParams = {
      "LI.FI": "ref=aggregator123",
      Socket: "partner=bridgeagg",
      Stargate: "affiliate=agg456",
      Hop: "source=aggregator",
    };

    const param = affiliateParams[quote.bridge] || "ref=default";
    return `${baseUrl}${separator}${param}&from=${fromChain}&to=${toChain}&amount=${amount}&token=${token}`;
  }

  showLoading(show) {
    const btn = document.getElementById("compareBtn");
    const btnText = btn.querySelector(".btn-text");
    const loader = btn.querySelector(".loader");

    if (show) {
      btn.disabled = true;
      btnText.textContent = "Fetching quotes";
      loader.classList.remove("hidden");
    } else {
      btn.disabled = false;
      btnText.textContent = "Compare Bridges";
      loader.classList.add("hidden");
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.classList.remove("hidden");
  }

  hideError() {
    document.getElementById("errorMessage").classList.add("hidden");
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  new BridgeAggregator();
});
