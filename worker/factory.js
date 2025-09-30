// worker/factory.js - Complete Adapter Factory with All Providers
import { LiFiAdapter } from "./adapters/lifi.js";
import { StargateAdapter } from "./adapters/stargate.js";
import { SocketAdapter } from "./adapters/socket.js";
import { SquidAdapter } from "./adapters/squid.js";
import { RangoAdapter } from "./adapters/rango.js";
import { XYFinanceAdapter } from "./adapters/xyfinance.js";
import { RubicAdapter } from "./adapters/rubic.js";
import { OpenOceanAdapter } from "./adapters/openocean.js";
import { ZeroXAdapter } from "./adapters/zerox.js";
import { OneInchAdapter } from "./adapters/oneinch.js";
import { AcrossAdapter } from "./adapters/across.js";
import { JumperAdapter } from "./adapters/jumper.js";

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
    // Register all adapters in priority order
    AdapterFactory.registerAdapter("LiFiAdapter", LiFiAdapter);
    AdapterFactory.registerAdapter("StargateAdapter", StargateAdapter);
    AdapterFactory.registerAdapter("SocketAdapter", SocketAdapter);
    AdapterFactory.registerAdapter("SquidAdapter", SquidAdapter);
    AdapterFactory.registerAdapter("RangoAdapter", RangoAdapter);
    AdapterFactory.registerAdapter("XYFinanceAdapter", XYFinanceAdapter);
    AdapterFactory.registerAdapter("RubicAdapter", RubicAdapter);
    AdapterFactory.registerAdapter("OpenOceanAdapter", OpenOceanAdapter);
    AdapterFactory.registerAdapter("ZeroXAdapter", ZeroXAdapter);
    AdapterFactory.registerAdapter("OneInchAdapter", OneInchAdapter);
    AdapterFactory.registerAdapter("AcrossAdapter", AcrossAdapter);
    AdapterFactory.registerAdapter("JumperAdapter", JumperAdapter);

    console.log(
      `✅ Registered ${AdapterFactory.adapters.size} bridge adapters`
    );
  }
}

// Initialize all adapters on module load
AdapterFactory.initialize();
