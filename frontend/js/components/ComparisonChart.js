// frontend/js/components/ComparisonChart.js - Visual Comparison Chart

// Add formatNumber function at the top of the file:
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
                    <<span class="bar-value">$${formatNumber(
                      bridge.totalCost
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
