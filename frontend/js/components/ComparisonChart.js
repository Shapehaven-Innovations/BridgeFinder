// frontend/js/components/ComparisonChart.js - Visual Comparison Chart

function formatNumber(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const formatted = num.toFixed(decimals);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export class ComparisonChart {
  static render(bridges) {
    if (!bridges || bridges.length === 0) {
      return '<p class="chart-empty">No data available for comparison</p>';
    }

    const maxCost = Math.max(
      ...bridges.map((b) => parseFloat(b.totalCost) || 0)
    );

    return `
      <div class="chart-header">Fee Comparison</div>
      <div class="bar-chart">
        ${bridges
          .slice(0, 8)
          .map((bridge) => {
            const cost = parseFloat(bridge.totalCost) || 0;
            const height = maxCost > 0 ? (cost / maxCost) * 100 : 0;
            const speedClass = this.getSpeedClass(bridge.estimatedTime);

            return `
            <div class="bar-item">
              <div class="bar ${speedClass}" style="height: ${height}%;" title="${bridge.name}: $${formatNumber(cost)}"></div>
              <div class="bar-value">$${formatNumber(cost, 1)}</div>
              <div class="bar-label">${bridge.name.length > 12 ? bridge.name.substring(0, 10) + "..." : bridge.name}</div>
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
    `;
  }

  static getSpeedClass(time) {
    if (!time) return "";
    const timeLower = time.toLowerCase();

    if (
      timeLower.includes("second") ||
      timeLower.includes("instant") ||
      timeLower.includes("< 1 min")
    ) {
      return "fast";
    } else if (
      timeLower.includes("minute") &&
      !timeLower.includes("10") &&
      !timeLower.includes("15")
    ) {
      return "fast";
    } else if (timeLower.includes("hour")) {
      return "slow";
    }
    return "";
  }
}
