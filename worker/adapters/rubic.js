// worker/adapters/rubic.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class RubicAdapter extends BridgeAdapter {
  constructor(config) {
    super('Rubic', config)
    this.icon = '💎'
  }

  mapChainToRubic(chainId) {
    const chainMap = {
      1: 'ETHEREUM',
      137: 'POLYGON',
      42161: 'ARBITRUM',
      10: 'OPTIMISM',
      56: 'BSC',
      43114: 'AVALANCHE',
      8453: 'BASE',
      250: 'FANTOM',
    }

    const chain = chainMap[chainId]
    if (!chain) {
      throw new Error(`${this.name}: Unsupported chain ${chainId}`)
    }
    return chain
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
    const srcChain = this.mapChainToRubic(fromChainId)
    const dstChain = this.mapChainToRubic(toChainId)

    // Use the GET endpoint instead of POST
    const queryParams = new URLSearchParams({
      fromBlockchain: srcChain,
      toBlockchain: dstChain,
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount: fromAmount,
      walletAddress: sender,
    })

    const url = `https://api.rubic.exchange/api/routes/v2?${queryParams}`

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

    if (!data || !data.routes || data.routes.length === 0) {
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

    const gasCostUSD = parseUSD(route.gasEstimate?.usd) || 0
    const platformFeeUSD = parseUSD(route.platformFee?.usd) || 0
    const priceImpactUSD = parseUSD(route.priceImpact?.usd) || 0

    return this.formatResponse({
      totalCost: gasCostUSD + platformFeeUSD,
      bridgeFee: platformFeeUSD,
      gasFee: gasCostUSD,
      estimatedTime: `${Math.ceil((route.estimatedTime || 300) / 60)} mins`,
      route: route.name || 'Rubic',
      protocol: 'Rubic',
      outputAmount: route.to.tokenAmount,
      meta: {
        tool: 'rubic',
        type: route.type,
        priceImpact: route.priceImpact,
      },
    })
  }
}
