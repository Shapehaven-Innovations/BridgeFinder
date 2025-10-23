// worker/adapters/squid.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class SquidAdapter extends BridgeAdapter {
  constructor(config) {
    super('Squid', config)
    this.icon = '🦑'
  }

  async getQuote(params, env) {
    await this.checkRateLimit()

    const { fromChainId, toChainId, token, amount, sender } = params

    console.log(`[${this.name}] API Request:`, {
      fromChainId,
      toChainId,
      token,
      amount,
      sender,
    })

    const tokenCfg = TOKENS[token]
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`)
    }

    const fromToken = tokenCfg.addresses?.[fromChainId]
    const toToken = tokenCfg.addresses?.[toChainId]

    if (!fromToken || !toToken) {
      throw new Error(`${this.name}: Missing token addresses`)
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals)

    const body = {
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken: fromToken,
      toToken: toToken,
      fromAmount: fromAmount,
      fromAddress: sender,
      toAddress: sender,
      slippage: params.slippage ? parseFloat(params.slippage) : 1.0,
      enableBoost: true,
      quoteOnly: false,
    }

    const url = 'https://apiplus.squidrouter.com/v2/route'

    console.log(`[${this.name}] Fetching:`, url)
    console.log(`[${this.name}] Body:`, JSON.stringify(body, null, 2))

    const res = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-integrator-id': 'bridge-aggregator-api',
      },
      body: JSON.stringify(body),
    })

    console.log(`[${this.name}] HTTP Status:`, res.status)

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'No details')
      console.error(`[${this.name}] API Error:`, errorBody)
      throw new Error(
        `${this.name}: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
      )
    }

    const data = await res.json()
    console.log(`[${this.name}] API Response:`, JSON.stringify(data, null, 2))

    if (!data || !data.route || !data.route.estimate) {
      throw new Error(`${this.name}: Invalid response - missing route data`)
    }

    return this.mapToStandardFormat(data)
  }

  mapToStandardFormat(apiResponse) {
    const route = apiResponse.route

    const parseUSD = (value) => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }

    const gasCostUSD = parseUSD(route.estimate.gasCosts?.[0]?.amountUSD) || 0
    const feeCosts = route.estimate.feeCosts || []
    const feeCostUSD = feeCosts.reduce(
      (sum, fee) => sum + parseUSD(fee.amountUSD),
      0
    )

    return this.formatResponse({
      totalCost: gasCostUSD + feeCostUSD,
      bridgeFee: feeCostUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil(route.estimate.estimatedRouteDuration / 60)} mins`,
      route: 'Squid Router',
      protocol: 'Axelar',
      outputAmount: route.estimate.toAmount,
      meta: {
        tool: 'squid',
        estimatedRouteDuration: route.estimate.estimatedRouteDuration,
      },
    })
  }
}
