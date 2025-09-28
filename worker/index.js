// worker/index.js
import { CHAINS, TOKENS } from "./config.js";
import { corsHeaders, json } from "./utils.js";
import {
  handleCompare,
  testAdapter,
  handleStatus,
  getActiveProviders,
} from "./handlers.js";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const debug = url.searchParams.get("debug") === "1";

    try {
      switch (url.pathname) {
        case "/":
        case "/api":
          return json({
            name: "Bridge Aggregator API",
            version: "5.0",
            architecture: "Modular Adapter System",
            endpoints: {
              "/api/compare": "POST - Compare bridge routes",
              "/api/status": "GET - Service status",
              "/api/chains": "GET - Supported chains",
              "/api/tokens": "GET - Supported tokens",
              "/api/providers": "GET - Active providers",
              "/api/test-adapter": "POST - Test specific adapter",
            },
          });

        case "/api/compare":
          if (request.method === "POST") {
            return await handleCompare(request, env, debug);
          }
          break;

        case "/api/status":
          if (request.method === "GET") {
            return json(handleStatus(env));
          }
          break;

        case "/api/chains":
          if (request.method === "GET") {
            return json({
              chains: CHAINS,
              count: Object.keys(CHAINS).length,
            });
          }
          break;

        case "/api/tokens":
          if (request.method === "GET") {
            return json({
              tokens: Object.keys(TOKENS),
              details: TOKENS,
              count: Object.keys(TOKENS).length,
            });
          }
          break;

        case "/api/providers":
          if (request.method === "GET") {
            return json(getActiveProviders(env));
          }
          break;

        case "/api/test-adapter":
          if (request.method === "POST") {
            return await testAdapter(request, env);
          }
          break;
      }

      return json({ success: false, error: "Not found" }, 404);
    } catch (err) {
      console.error("Worker error:", err);
      return json(
        {
          success: false,
          error: "Internal server error",
          message: err.message,
        },
        500
      );
    }
  },
};
