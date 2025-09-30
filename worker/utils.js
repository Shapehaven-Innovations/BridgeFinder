// worker/utils.js - Utility Functions

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
  Vary: "Origin",
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function delayedCall(fn, delay) {
  await new Promise((r) => setTimeout(r, delay));
  return fn();
}

export function generateReferralUrl(bridge, env) {
  const referralId =
    env.FEE_RECEIVER_ADDRESS || env.INTEGRATOR_NAME || "bridgeaggregator";

  const urls = {
    lifi: `https://jumper.exchange/?ref=${referralId}`,
    stargate: `https://stargate.finance/?ref=${referralId}`,
    socket: `https://socketbridge.com/?ref=${referralId}`,
    squid: `https://app.squidrouter.com/?ref=${referralId}`,
    rango: `https://rango.exchange/?ref=${referralId}`,
    xyfinance: `https://app.xy.finance/?ref=${referralId}`,
    rubic: `https://app.rubic.exchange/?ref=${referralId}`,
    openocean: `https://openocean.finance/?ref=${referralId}`,
    "0x": `https://matcha.xyz/?ref=${referralId}`,
    "1inch": `https://app.1inch.io/?ref=${referralId}`,
    across: `https://across.to/?ref=${referralId}`,
    jumper: `https://jumper.exchange/?ref=${referralId}`,
  };

  return urls[bridge.provider] || "#";
}
