// worker/handlers.js
import { CONFIG, CHAINS, TOKENS } from "./config.js";
import { AdapterFactory } from "./factory.js";
import {
  json,
  ZERO_ADDRESS,
  delayedCall,
  generateReferralUrl,
} from "./utils.js";

export async function handleCompare(request, env, debug) {
  try {
    const { fromChainId, toChainId, token, amount, fromAddress, slippage } =
      await request.json();

    console.log("[Handler] Received request:", {
      fromChainId,
      toChainId,
      token,
      amount,
      fromAddress,
      slippage,
    });

    // Validation
    if (!fromChainId || !toChainId || !token || !amount) {
      return json(
        {
          success: false,
          error:
            "Missing required parameters (fromChainId, toChainId, token, amount)",
        },
        400
      );
    }

    if (fromChainId === toChainId) {
      return json(
        {
          success: false,
          error: "Source and destination chains must be different",
        },
        400
      );
    }

    // Get sender address
    const sender = fromAddress || env.QUOTE_FROM_ADDRESS || ZERO_ADDRESS;
    if (!sender || sender === ZERO_ADDRESS) {
      return json(
        {
          success: false,
          error: "Valid wallet address required",
          details:
            "Set QUOTE_FROM_ADDRESS secret or pass fromAddress in request body",
        },
        400
      );
    }

    const params = {
      fromChainId,
      toChainId,
      token,
      amount,
      sender,
      slippage: slippage || "0.01", // Add slippage parameter with default
    };

    console.log("[Handler] Parameters being passed to adapters:", params);

    // Create adapter instances and group by priority
    const adapterGroups = [];
    const priorityGroups = {};

    for (const [key, config] of Object.entries(CONFIG.PROVIDERS)) {
      if (!config.enabled) continue;

      const priority = config.priority;
      if (!priorityGroups[priority]) {
        priorityGroups[priority] = [];
      }

      try {
        const adapter = AdapterFactory.createAdapter(config.adapter, config);
        priorityGroups[priority].push({
          name: key,
          adapter,
          config,
        });
        console.log(
          `[Handler] Created adapter: ${key} with priority ${priority}`
        );
      } catch (error) {
        console.error(`Failed to create adapter ${key}:`, error.message);
      }
    }

    // Sort priorities and create delayed calls
    const sortedPriorities = Object.keys(priorityGroups).sort((a, b) => a - b);
    const providerCalls = [];
    let delay = 0;

    for (const priority of sortedPriorities) {
      const group = priorityGroups[priority];

      for (const { name, adapter, config } of group) {
        // Skip adapters that require auth if no key is provided
        if (config.requiresAuth && !env[`${name}_API_KEY`]) {
          if (debug) console.log(`Skipping ${name}: API key required`);
          continue;
        }

        providerCalls.push({
          name,
          fn:
            delay === 0
              ? () => adapter.getQuote(params, env)
              : () => delayedCall(() => adapter.getQuote(params, env), delay),
        });
      }

      // Increase delay for next priority group
      delay += 500;
    }

    console.log(
      `[Handler] Calling ${providerCalls.length} adapters:`,
      providerCalls.map((p) => p.name)
    );

    // Execute all provider calls
    const results = await Promise.allSettled(
      providerCalls.map(async (call) => {
        try {
          const result = await call.fn();
          // If adapter returns null, it means complete failure
          if (result === null) {
            return {
              provider: call.name,
              failed: true,
              error: "Provider returned no response",
            };
          }
          return { ...result, _provider: call.name };
        } catch (error) {
          console.error(`${call.name} error:`, error.message);
          return {
            error: error.message,
            provider: call.name,
            failed: true,
          };
        }
      })
    );

    // Separate available and unavailable bridges
    const availableBridges = [];
    const unavailableBridges = [];

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value && !r.value.failed) {
        if (r.value.unavailable) {
          unavailableBridges.push(r.value);
        } else if (r.value.totalCost != null && r.value.totalCost > 0) {
          availableBridges.push(r.value);
        }
      }
    });

    // Sort available bridges by cost
    availableBridges.sort((a, b) => a.totalCost - b.totalCost);

    // Sort unavailable bridges alphabetically
    unavailableBridges.sort((a, b) => a.name.localeCompare(b.name));

    const failures = debug
      ? results
          .filter(
            (r) =>
              r.status === "rejected" ||
              (r.status === "fulfilled" && r.value?.failed)
          )
          .map((r, i) => ({
            provider: providerCalls[i].name,
            status: r.status,
            error: r.status === "rejected" ? r.reason?.message : r.value?.error,
          }))
      : undefined;

    console.log(
      `[Handler] Results: ${availableBridges.length} available, ${unavailableBridges.length} unavailable`
    );

    // Combine available and unavailable bridges
    const allBridges = [...availableBridges, ...unavailableBridges];

    if (allBridges.length === 0) {
      return json({
        success: false,
        error: "No providers responded",
        details: debug
          ? {
              providers: providerCalls.map((p) => p.name),
              failures,
            }
          : undefined,
        bridges: [],
      });
    }

    // Add metadata to bridges
    const enrichedBridges = allBridges.map((bridge, index) => {
      // Only calculate savings for available bridges
      if (bridge.unavailable) {
        return {
          ...bridge,
          position: null,
          isBest: false,
          savings: null,
          url: null,
        };
      }

      const availableIndex = availableBridges.indexOf(bridge);
      return {
        ...bridge,
        position: availableIndex + 1,
        isBest: availableIndex === 0,
        savings:
          availableIndex > 0
            ? availableBridges[availableBridges.length - 1].totalCost -
              bridge.totalCost
            : 0,
        url: generateReferralUrl(bridge, env),
      };
    });

    return json({
      success: true,
      bridges: enrichedBridges,
      summary: {
        bestPrice:
          availableBridges.length > 0 ? availableBridges[0].totalCost : null,
        worstPrice:
          availableBridges.length > 0
            ? availableBridges[availableBridges.length - 1].totalCost
            : null,
        averagePrice:
          availableBridges.length > 0
            ? availableBridges.reduce((sum, b) => sum + b.totalCost, 0) /
              availableBridges.length
            : null,
        providersQueried: providerCalls.length,
        providersResponded: availableBridges.length,
        providersUnavailable: unavailableBridges.length,
        failures: debug ? failures : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Compare error:", error);
    return json(
      {
        success: false,
        error: "Failed to compare bridges",
        details: error.message,
      },
      500
    );
  }
}

export async function testAdapter(request, env) {
  try {
    const { adapter: adapterName, ...params } = await request.json();

    if (!adapterName) {
      return json({ success: false, error: "Adapter name required" }, 400);
    }

    const config = CONFIG.PROVIDERS[adapterName.toUpperCase()];
    if (!config) {
      return json({ success: false, error: "Unknown adapter" }, 400);
    }

    const adapter = AdapterFactory.createAdapter(config.adapter, config);
    const result = await adapter.getQuote(params, env);

    return json({
      success: true,
      adapter: adapterName,
      result,
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
}

export function handleStatus(env) {
  const providers = {};

  for (const [key, config] of Object.entries(CONFIG.PROVIDERS)) {
    const status = config.enabled
      ? config.requiresAuth && !env[`${key}_API_KEY`]
        ? "Disabled (no key)"
        : "Active"
      : "Disabled";
    providers[key.toLowerCase()] = {
      status,
      adapter: config.adapter,
      priority: config.priority,
      rateLimit: `${config.rateLimit.requests} req/${
        config.rateLimit.window / 1000
      }s`,
    };
  }

  return {
    status: "operational",
    version: "5.0",
    architecture: "Modular Adapter System",
    environment: env.ENVIRONMENT || "production",
    timestamp: new Date().toISOString(),
    settings: {
      integrator: env.INTEGRATOR_NAME || "BridgeAggregator",
      feeReceiver: env.FEE_RECEIVER_ADDRESS || "Not configured",
      quoteAddress: env.QUOTE_FROM_ADDRESS
        ? "Configured"
        : "Using zero address",
    },
    providers,
    features: {
      caching: "30 second TTL",
      rateLimit: "Per-adapter rate limiting",
      retry: `${CONFIG.RETRY_ATTEMPTS} attempts with backoff`,
      timeout: `${CONFIG.REQUEST_TIMEOUT}ms per request`,
      adapters: Array.from(AdapterFactory.adapters.keys()),
    },
  };
}

export function getActiveProviders(env) {
  const active = [];

  for (const [key, config] of Object.entries(CONFIG.PROVIDERS)) {
    if (config.enabled) {
      const needsAuth = config.requiresAuth;
      const hasAuth = env[`${key}_API_KEY`];

      active.push({
        name: key,
        adapter: config.adapter,
        status: needsAuth && !hasAuth ? "Limited" : "Active",
        priority: config.priority,
        requiresAuth: needsAuth,
        authConfigured: needsAuth ? hasAuth : "N/A",
        rateLimit: `${config.rateLimit.requests} req/${
          config.rateLimit.window / 1000
        }s`,
      });
    }
  }

  return {
    count: active.length,
    providers: active.sort((a, b) => a.priority - b.priority),
  };
}
