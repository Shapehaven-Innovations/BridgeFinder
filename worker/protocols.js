// worker/protocols.js - Bridge Protocol Security & Liquidity Metadata

/**
 * PROTOCOL_INFO - Bridge Protocol Security & Liquidity Metadata
 *
 * This configuration contains security and liquidity ratings for bridge protocols.
 * This data is NOT from APIs - it's based on protocol research and documentation.
 *
 * Handler uses this to enrich adapter responses with business metadata.
 * Keep this updated as protocols change or new ones are added.
 *
 * Sources:
 * - Protocol documentation
 * - Audit reports
 * - DeFi Llama TVL data
 * - Security assessments
 */
export const PROTOCOL_INFO = {
  // Across Protocol
  // https://docs.across.to/
  across: {
    name: "Across",
    security: "Optimistic Oracle",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Intent-based bridge with optimistic verification",
    tvl: "High",
  },

  // Stargate Protocol
  // https://stargateprotocol.gitbook.io/stargate/
  stargate: {
    name: "Stargate",
    security: "LayerZero",
    liquidity: "Very High",
    auditStatus: "Audited",
    description: "Omnichain liquidity protocol powered by LayerZero",
    tvl: "Very High",
  },

  // Hop Protocol
  // https://docs.hop.exchange/
  hop: {
    name: "Hop Protocol",
    security: "Optimistic Rollup",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Rollup-to-rollup general token bridge",
    tvl: "Medium",
  },

  // Connext
  // https://docs.connext.network/
  connext: {
    name: "Connext",
    security: "Modular",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Modular interoperability protocol",
    tvl: "Medium",
  },

  // Amarok (Connext upgrade)
  amarok: {
    name: "Amarok",
    security: "Modular",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Connext Amarok upgrade",
    tvl: "Medium",
  },

  // Celer cBridge
  // https://cbridge-docs.celer.network/
  cbridge: {
    name: "Celer cBridge",
    security: "PoS Validation",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Cross-chain liquidity network",
    tvl: "High",
  },

  // Synapse Protocol
  // https://docs.synapseprotocol.com/
  synapse: {
    name: "Synapse",
    security: "Multi-Party Computation",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Cross-chain liquidity protocol",
    tvl: "High",
  },

  // Multichain (Anyswap)
  // https://docs.multichain.org/
  multichain: {
    name: "Multichain",
    security: "MPC Network",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Cross-chain router protocol",
    tvl: "High",
  },

  // Wormhole
  // https://docs.wormhole.com/
  wormhole: {
    name: "Wormhole",
    security: "Guardian Network",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Generic message passing protocol",
    tvl: "High",
  },

  // Axelar
  // https://docs.axelar.dev/
  axelar: {
    name: "Axelar",
    security: "Proof of Stake",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Universal interoperability network",
    tvl: "Medium",
  },

  // Squid (uses Axelar)
  // https://docs.squidrouter.com/
  squid: {
    name: "Squid",
    security: "Axelar GMP",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Cross-chain swap and liquidity routing",
    tvl: "High",
  },

  // LiFi Fee Collection (internal mechanism)
  // https://docs.li.fi/
  feeCollection: {
    name: "LiFi Fee",
    security: "Smart Contract",
    liquidity: "N/A",
    auditStatus: "Audited",
    description: "LiFi integrator fee collection mechanism",
    tvl: "N/A",
  },

  // Socket (Bungee)
  // https://docs.socket.tech/
  socket: {
    name: "Socket",
    security: "Multi-Bridge Aggregator",
    liquidity: "Aggregated",
    auditStatus: "Audited",
    description: "Meta-aggregator for bridge protocols",
    tvl: "Aggregated",
  },

  // Rango Exchange
  // https://docs.rango.exchange/
  rango: {
    name: "Rango",
    security: "Multi-Protocol",
    liquidity: "Aggregated",
    auditStatus: "Audited",
    description: "Cross-chain DEX aggregator",
    tvl: "Aggregated",
  },

  // XY Finance
  // https://docs.xy.finance/
  xyfinance: {
    name: "XY Finance",
    security: "Y Pool",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Cross-chain swap aggregator",
    tvl: "High",
  },

  // Rubic
  // https://docs.rubic.finance/
  rubic: {
    name: "Rubic",
    security: "Multi-Chain",
    liquidity: "Aggregated",
    auditStatus: "Audited",
    description: "Cross-chain trading platform",
    tvl: "Medium",
  },

  // OpenOcean
  // https://docs.openocean.finance/
  openocean: {
    name: "OpenOcean",
    security: "DEX Aggregator",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Full aggregation protocol",
    tvl: "High",
  },

  // 0x Protocol
  // https://docs.0x.org/
  "0x": {
    name: "0x Protocol",
    security: "Audited",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Decentralized exchange infrastructure",
    tvl: "High",
  },

  // 1inch
  // https://docs.1inch.io/
  "1inch": {
    name: "1inch",
    security: "Audited",
    liquidity: "Very High",
    auditStatus: "Audited",
    description: "DEX aggregator with Fusion+",
    tvl: "Very High",
  },

  // Jumper (LiFi frontend)
  // https://jumper.exchange/
  jumper: {
    name: "Jumper",
    security: "LI.FI",
    liquidity: "High",
    auditStatus: "Audited",
    description: "LiFi-powered bridge interface",
    tvl: "High",
  },

  // Meson
  meson: {
    name: "Meson",
    security: "Atomic Swap",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Fast atomic swap protocol",
    tvl: "Medium",
  },

  // deBridge
  debridge: {
    name: "deBridge",
    security: "Validator Network",
    liquidity: "High",
    auditStatus: "Audited",
    description: "Cross-chain interoperability protocol",
    tvl: "High",
  },

  // Symbiosis
  symbiosis: {
    name: "Symbiosis",
    security: "Multi-Chain",
    liquidity: "Medium",
    auditStatus: "Audited",
    description: "Cross-chain AMM DEX",
    tvl: "Medium",
  },
};

/**
 * Default metadata for unknown protocols
 */
export const DEFAULT_PROTOCOL_INFO = {
  name: "Unknown",
  security: "Unspecified",
  liquidity: "Unknown",
  auditStatus: "Unknown",
  description: "Protocol information not available",
  tvl: "Unknown",
};

/**
 * Get protocol metadata by tool key
 *
 * @param {string} toolKey - Protocol tool key (e.g., 'across', 'stargate')
 * @returns {object} Protocol metadata
 */
export function getProtocolInfo(toolKey) {
  if (!toolKey) {
    return DEFAULT_PROTOCOL_INFO;
  }

  // Normalize key (lowercase, trim whitespace)
  const normalizedKey = String(toolKey).toLowerCase().trim();

  return PROTOCOL_INFO[normalizedKey] || DEFAULT_PROTOCOL_INFO;
}

/**
 * Get all available protocol keys
 *
 * @returns {string[]} Array of protocol keys
 */
export function getAvailableProtocols() {
  return Object.keys(PROTOCOL_INFO);
}

/**
 * Check if a protocol is known
 *
 * @param {string} toolKey - Protocol tool key
 * @returns {boolean} True if protocol is in PROTOCOL_INFO
 */
export function isKnownProtocol(toolKey) {
  if (!toolKey) return false;
  const normalizedKey = String(toolKey).toLowerCase().trim();
  return normalizedKey in PROTOCOL_INFO;
}
