// worker/adapters/across.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class AcrossAdapter extends BridgeAdapter {
  constructor(config) {
    super('Across', config)
    this.icon = '🌉'
  }

  // Across has limited token support - check if route is supported
  isSupportedRoute(token, fromChainId, toChainId) {
    const supportedRoutes = {
      USDC: {
        1: [10, 42161, 137, 8453],
        10: [1, 42161, 137, 8453],
        42161: [1, 10, 137, 8453],
        137: [1, 10, 42161, 8453],
        8453: [1, 10, 42161, 137],
      },
      WETH: {
        1: [10, 42161, 137, 8453],
        10: [1, 42161, 137, 8453],
        42161: [1, 10, 137, 8453],
        137: [1, 10, 42161, 8453],
        8453: [1, 10, 42161, 137],
      },
    }

    const destinations = supportedRoutes[token]?.[fromChainId]
    return destinations?.includes(toChainId) || false
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

    // Check if route is supported
    if (!this.isSupportedRoute(token, fromChainId, toChainId)) {
      throw new Error(
        `${this.name}: Route not supported for ${token} from chain ${fromChainId} to ${toChainId}`
      )
    }

    const tokenCfg = TOKENS[token]
    if (!tokenCfg) {
      throw new Error(`${this.name}: Unknown token ${token}`)
    }

    const tokenAddress = tokenCfg.addresses?.[fromChainId]
    if (!tokenAddress) {
      throw new Error(
        `${this.name}: Missing token address for chain ${fromChainId}`
      )
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals)

    const queryParams = new URLSearchParams({
      originChainId: String(fromChainId),
      destinationChainId: String(toChainId),
      token: tokenAddress,
      amount: fromAmount,
      depositor: sender,
      recipient: sender,
    })

    const url = `https://app.across.to/api/suggested-fees?${queryParams}`

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

    if (!data || typeof data.totalRelayFee === 'undefined') {
      throw new Error(`${this.name}: Invalid response - missing fee data`)
    }

    return this.mapToStandardFormat(data, tokenCfg, fromAmount)
  }

  mapToStandardFormat(apiResponse, tokenCfg, inputAmount) {
    const parseUSD = (value) => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }

    const relayFee =
      parseUSD(apiResponse.totalRelayFee.total) /
      Math.pow(10, tokenCfg.decimals)
    const lpFee =
      (parseUSD(apiResponse.relayFeePct) * parseFloat(inputAmount)) /
      Math.pow(10, tokenCfg.decimals + 4)

    // Across fees are in tokens, approximate USD (assuming stablecoin ~= $1)
    const totalFeeUSD = relayFee + lpFee
    const outputAmount = (
      BigInt(inputAmount) - BigInt(apiResponse.totalRelayFee.total)
    ).toString()

    return this.formatResponse({
      totalCost: totalFeeUSD,
      bridgeFee: totalFeeUSD,
      gasFee: 0, // Gas not included in quote
      estimatedTime: '2-4 mins',
      route: 'Across Protocol',
      protocol: 'Across',
      outputAmount: outputAmount,
      meta: {
        tool: 'across',
        totalRelayFee: apiResponse.totalRelayFee,
        relayFeePct: apiResponse.relayFeePct,
        timestamp: apiResponse.timestamp,
      },
    })
  }
}
