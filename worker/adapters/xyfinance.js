// worker/adapters/xyfinance.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class XYFinanceAdapter extends BridgeAdapter {
  constructor(config) {
    super('XY Finance', config)
    this.icon = '⚡'
  }

  async getQuote(params, env) {
    await this.checkRateLimit()

    const { fromChainId, toChainId, token, amount, sender, slippage } = params

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

    const queryParams = new URLSearchParams({
      srcChainId: String(fromChainId),
      fromTokenAddress: fromToken,
      amount: fromAmount,
      destChainId: String(toChainId),
      toTokenAddress: toToken,
      slippage: slippage || '0.01',
      receiver: sender,
    })

    const url = `https://open-api.xy.finance/v1/quote?${queryParams}`

    console.log(`[${this.name}] Fetching:`, url)

    const res = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
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

    // Check if route is paused or unavailable
    if (!data.isSuccess || data.success === false) {
      throw new Error(
        `${this.name}: ${data.msg || 'Route unavailable or paused'}`
      )
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error(`${this.name}: No routes available`)
    }

    // Use the best route (first one)
    return this.mapToStandardFormat(data.routes[0], tokenCfg)
  }

  mapToStandardFormat(route, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }

    const gasCostUSD = parseUSD(route.estimatedGas) / 1e6
    const bridgeFeeUSD = parseUSD(route.xyFee) / 1e6

    return this.formatResponse({
      totalCost: gasCostUSD + bridgeFeeUSD,
      bridgeFee: bridgeFeeUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil((route.estimatedTransferTime || 300) / 60)} mins`,
      route: route.bridgeName || 'XY Finance',
      protocol: 'XY Finance',
      outputAmount: route.toTokenAmount,
      meta: {
        tool: 'xyfinance',
        bridgeName: route.bridgeName,
        estimatedTransferTime: route.estimatedTransferTime,
      },
    })
  }
}
