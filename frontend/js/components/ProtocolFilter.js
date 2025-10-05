// frontend/js/components/ProtocolFilter.js - Protocol Filter Component

export class ProtocolFilter {
  static render(protocols) {
    if (!protocols || protocols.length === 0) {
      return '<p class="filter-empty">No protocols available</p>';
    }

    return `
      <div class="filter-header">
        <h3>Filter by Protocol</h3>
        <div class="filter-actions">
          <button type="button" id="selectAllProtocols" class="btn-text">Select All</button>
          <button type="button" id="clearAllProtocols" class="btn-text">Clear All</button>
        </div>
      </div>
      <div class="protocol-chips">
        ${protocols
          .map(
            (protocol) => `
          <label class="protocol-chip">
            <input type="checkbox" value="${protocol}" checked aria-label="Toggle ${protocol}">
            <span>${protocol}</span>
          </label>
        `
          )
          .join("")}
      </div>
    `;
  }
}
