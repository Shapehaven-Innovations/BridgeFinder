// worker/factory.js
import { LiFiAdapter } from "./adapters/lifi.js";
import { StargateAdapter } from "./adapters/stargate.js";
import { SocketAdapter } from "./adapters/socket.js";
// ... import all adapters

export class AdapterFactory {
  static adapters = new Map();

  static registerAdapter(name, AdapterClass) {
    AdapterFactory.adapters.set(name, AdapterClass);
  }

  static createAdapter(name, config) {
    const AdapterClass = AdapterFactory.adapters.get(name);
    if (!AdapterClass) {
      throw new Error(`Unknown adapter: ${name}`);
    }
    return new AdapterClass(config);
  }

  static initialize() {
    AdapterFactory.registerAdapter("LiFiAdapter", LiFiAdapter);
    AdapterFactory.registerAdapter("StargateAdapter", StargateAdapter);
    AdapterFactory.registerAdapter("SocketAdapter", SocketAdapter);
    // ... register all adapters
  }
}

AdapterFactory.initialize();
