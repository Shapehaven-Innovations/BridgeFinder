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
        `,
          )
          .join("")}
      </div>
    `;
  }
}
