// Add this to the beginning of your app.js file

// Theme Management
class ThemeManager {
  constructor() {
    this.theme = this.getStoredTheme() || this.getSystemTheme();
    this.init();
  }

  init() {
    // Apply initial theme
    this.applyTheme(this.theme);

    // Create and insert theme toggle button
    this.createThemeToggle();

    // Listen for system theme changes
    this.watchSystemTheme();
  }

  getStoredTheme() {
    return localStorage.getItem("bridge-theme");
  }

  getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.theme = theme;
    localStorage.setItem("bridge-theme", theme);

    // Update theme toggle icon
    this.updateToggleIcon(theme);
  }

  createThemeToggle() {
    const toggle = document.createElement("button");
    toggle.className = "theme-toggle";
    toggle.setAttribute("aria-label", "Toggle theme");
    toggle.setAttribute("title", "Toggle dark/light mode");

    toggle.innerHTML = this.getIconHTML(this.theme);

    toggle.addEventListener("click", () => {
      const newTheme = this.theme === "dark" ? "light" : "dark";
      this.applyTheme(newTheme);
    });

    document.body.appendChild(toggle);
    this.toggleButton = toggle;
  }

  updateToggleIcon(theme) {
    if (this.toggleButton) {
      this.toggleButton.innerHTML = this.getIconHTML(theme);
    }
  }

  getIconHTML(theme) {
    if (theme === "dark") {
      // Sun icon for dark mode (switch to light)
      return `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            `;
    } else {
      // Moon icon for light mode (switch to dark)
      return `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            `;
    }
  }

  watchSystemTheme() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!this.getStoredTheme()) {
          this.applyTheme(e.matches ? "dark" : "light");
        }
      });
    }
  }
}

// Initialize theme manager when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new ThemeManager();
  });
} else {
  new ThemeManager();
}

// Bridge Aggregator Application
const API_BASE_URL =
  "https://bridge-aggregator-api.shapehaveninnovations.workers.dev";

// Chain configurations
const chains = {
  1: { name: "Ethereum", icon: "⟠" },
  137: { name: "Polygon", icon: "🟣" },
  42161: { name: "Arbitrum", icon: "🔵" },
  10: { name: "Optimism", icon: "🔴" },
  56: { name: "BSC", icon: "🟡" },
  43114: { name: "Avalanche", icon: "🔺" },
  8453: { name: "Base", icon: "🔷" },
  100: { name: "Gnosis", icon: "🦉" },
  250: { name: "Fantom", icon: "👻" },
};

// Bridge configurations with proper icons
const bridgeIcons = {
  paraswap: "🔄",
  "0x": "0️⃣",
  socket: "🔌",
  hop: "🐰",
  stargate: "⭐",
  across: "➡️",
  synapse: "🧬",
  cbridge: "🌉",
};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("bridgeForm");
  const compareBtn = document.getElementById("compareBtn");
  const btnText = compareBtn.querySelector(".btn-text");
  const loader = compareBtn.querySelector(".loader");
  const resultsSection = document.getElementById("results");
  const resultsContainer = document.getElementById("resultsContainer");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const savingsBadge = document.getElementById("savingsBadge");
  const disclaimerLink = document.getElementById("disclaimerLink");
  const disclaimerModal = document.getElementById("disclaimerModal");

  // Form submission handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await compareBridges();
  });

  // Disclaimer modal handler
  if (disclaimerLink && disclaimerModal) {
    disclaimerLink.addEventListener("click", (e) => {
      e.preventDefault();
      disclaimerModal.showModal();
    });

    const modalClose = disclaimerModal.querySelector(".modal-close");
    if (modalClose) {
      modalClose.addEventListener("click", () => {
        disclaimerModal.close();
      });
    }

    // Close on backdrop click
    disclaimerModal.addEventListener("click", (e) => {
      if (e.target === disclaimerModal) {
        disclaimerModal.close();
      }
    });
  }

  // Compare bridges function
  async function compareBridges() {
    // Clear previous messages
    hideMessages();

    // Get form values
    const fromChain = document.getElementById("fromChain").value;
    const toChain = document.getElementById("toChain").value;
    const token = document.getElementById("token").value;
    const amount = document.getElementById("amount").value;

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    if (fromChain === toChain) {
      showError("Source and destination chains must be different");
      return;
    }

    // Show loading state
    setLoadingState(true);

    try {
      // API call to compare bridges
      const response = await fetch(`${API_BASE_URL}/api/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromChainId: fromChain,
          toChainId: toChain,
          token,
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.bridges && data.bridges.length > 0) {
        displayResults(data.bridges, amount, token);
        showSuccess(`Found ${data.bridges.length} bridge options`);
      } else {
        showError("No bridges available for this route");
      }
    } catch (error) {
      console.error("Error comparing bridges:", error);
      showError("Failed to fetch bridge data. Please try again.");
    } finally {
      setLoadingState(false);
    }
  }

  // Display results
  function displayResults(bridges, amount, token) {
    // Clear previous results
    resultsContainer.innerHTML = "";

    // Sort bridges by total cost
    bridges.sort((a, b) => a.totalCost - b.totalCost);

    // Calculate savings
    if (bridges.length > 1) {
      const cheapest = bridges[0].totalCost;
      const mostExpensive = bridges[bridges.length - 1].totalCost;
      const savings = (mostExpensive - cheapest).toFixed(2);

      savingsBadge.textContent = `💰 Save up to ${savings}`;
      savingsBadge.classList.remove("hidden");
    }

    // Create bridge cards
    bridges.forEach((bridge, index) => {
      const card = createBridgeCard(bridge, index === 0, amount, token);
      resultsContainer.appendChild(card);
    });

    // Show results section
    resultsSection.classList.remove("hidden");

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  // Create bridge card element
  function createBridgeCard(bridge, isBest, amount, token) {
    const card = document.createElement("div");
    card.className = `bridge-card ${isBest ? "best-option" : ""}`;

    const icon = bridgeIcons[bridge.name.toLowerCase()] || "🌉";

    card.innerHTML = `
            <div class="bridge-logo">
                <span>${icon}</span>
            </div>
            <div class="bridge-info">
                <h3>${bridge.name}</h3>
                <div class="bridge-details">
                    <span>⏱️ ${bridge.estimatedTime || "5-10 mins"}</span>
                    <span>${getSecurityBadge(bridge)}</span>
                    <span>${getSpeedBadge(bridge)}</span>
                </div>
            </div>
            <div class="fee-breakdown">
                <div class="total-cost">${bridge.totalCost.toFixed(2)}</div>
                <div class="fee-details">
                    Bridge: ${bridge.bridgeFee.toFixed(
                      2
                    )} | Gas: ${bridge.gasFee.toFixed(2)}
                </div>
            </div>
            <button class="bridge-btn" data-bridge="${bridge.name}">
                Use Bridge →
            </button>
        `;

    // Add click handler for bridge button
    const bridgeBtn = card.querySelector(".bridge-btn");
    bridgeBtn.addEventListener("click", () => {
      handleBridgeSelection(bridge, amount, token);
    });

    return card;
  }

  // Get security badge
  function getSecurityBadge(bridge) {
    const badges = {
      high: "🔒 Audited",
      medium: "🛡️ Secure",
      low: "⚠️ Use Caution",
    };
    return badges[bridge.security] || badges["medium"];
  }

  // Get speed badge
  function getSpeedBadge(bridge) {
    const badges = {
      instant: "⚡ Instant",
      fast: "🚀 Fast",
      normal: "✓ Normal",
      slow: "🐢 Slow",
    };
    return badges[bridge.speed] || badges["normal"];
  }

  // Handle bridge selection
  function handleBridgeSelection(bridge, amount, token) {
    // Track selection (analytics)
    if (typeof gtag !== "undefined") {
      gtag("event", "bridge_selected", {
        bridge_name: bridge.name,
        amount: amount,
        token: token,
      });
    }

    // Redirect to bridge (in production, this would open the bridge interface)
    console.log(`Selected bridge: ${bridge.name}`);
    showSuccess(`Redirecting to ${bridge.name}...`);

    // In production, you would redirect to the actual bridge URL
    // window.open(bridge.url, '_blank');
  }

  // Loading state management
  function setLoadingState(isLoading) {
    compareBtn.disabled = isLoading;
    compareBtn.setAttribute("aria-busy", isLoading);

    if (isLoading) {
      btnText.textContent = "Comparing...";
      loader.classList.remove("hidden");
    } else {
      btnText.textContent = "Compare Bridges";
      loader.classList.add("hidden");
    }
  }

  // Message display functions
  function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    const messageText = errorDiv.querySelector(".message-text");

    if (!messageText) {
      errorDiv.innerHTML = `
                <span class="message-icon" aria-hidden="true">⚠️</span>
                <span class="message-text">${message}</span>
            `;
    } else {
      messageText.textContent = message;
    }

    errorDiv.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.classList.add("hidden");
    }, 5000);
  }

  function showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    const messageText = successDiv.querySelector(".message-text");

    if (!messageText) {
      successDiv.innerHTML = `
                <span class="message-icon" aria-hidden="true">✅</span>
                <span class="message-text">${message}</span>
            `;
    } else {
      messageText.textContent = message;
    }

    successDiv.classList.remove("hidden");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      successDiv.classList.add("hidden");
    }, 3000);
  }

  function hideMessages() {
    document.getElementById("errorMessage").classList.add("hidden");
    document.getElementById("successMessage").classList.add("hidden");
  }

  // Input validation
  const amountInput = document.getElementById("amount");
  amountInput.addEventListener("input", (e) => {
    // Remove non-numeric characters except decimal point
    e.target.value = e.target.value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = e.target.value.split(".");
    if (parts.length > 2) {
      e.target.value = parts[0] + "." + parts.slice(1).join("");
    }
  });

  // Chain selection validation
  const fromChainSelect = document.getElementById("fromChain");
  const toChainSelect = document.getElementById("toChain");

  function validateChainSelection() {
    if (fromChainSelect.value === toChainSelect.value) {
      // Show visual feedback
      toChainSelect.classList.add("error");
      showError("Please select different chains for source and destination");
    } else {
      toChainSelect.classList.remove("error");
      hideMessages();
    }
  }

  fromChainSelect.addEventListener("change", validateChainSelection);
  toChainSelect.addEventListener("change", validateChainSelection);
});

// Format numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Debounce function for input events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
