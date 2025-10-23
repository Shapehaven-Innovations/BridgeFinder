// worker/adapters/rango.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class RangoAdapter extends BridgeAdapter {
  constructor(config) {
    super('Rango', config)
    this.icon = '🦘'
  }

  mapChainToRango(chainId) {
    const blockchainMap = {
      1: 'ETH',
      137: 'POLYGON',
      42161: 'ARBITRUM',
      10: 'OPTIMISM',
      56: 'BSC',
      43114: 'AVAX_CCHAIN',
      8453: 'BASE',
      250: 'FANTOM',
    }

    const blockchain = blockchainMap[chainId]
    if (!blockchain) {
      throw new Error(`${this.name}: Unsupported chain ${chainId}`)
    }
    return blockchain
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

    const fromTokenAddress = tokenCfg.addresses?.[fromChainId]
    const toTokenAddress = tokenCfg.addresses?.[toChainId]

    if (!fromTokenAddress || !toTokenAddress) {
      throw new Error(
        `${this.name}: Token ${token} not available on chains ${fromChainId} -> ${toChainId}`
      )
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals)
    const fromBlockchain = this.mapChainToRango(fromChainId)
    const toBlockchain = this.mapChainToRango(toChainId)

    const body = {
      from: {
        blockchain: fromBlockchain,
        symbol: token,
        address: fromTokenAddress,
      },
      to: {
        blockchain: toBlockchain,
        symbol: token,
        address: toTokenAddress,
      },
      amount: fromAmount,
      slippage: params.slippage || '.01',
      affiliateRef: 'BridgeAggregator',
    }

    const url = 'https://api.rango.exchange/routing/best'

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    if (env.RANGO_API_KEY) {
      headers['API-KEY'] = env.RANGO_API_KEY
    }

    console.log(`[${this.name}] Fetching:`, url)
    console.log(`[${this.name}] Body:`, JSON.stringify(body, null, 2))

    const res = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
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

    if (!data || !data.route || !data.route.outputAmount) {
      throw new Error(`${this.name}: Invalid response - missing route data`)
    }

    return this.mapToStandardFormat(data, tokenCfg)
  }

  mapToStandardFormat(apiResponse, tokenCfg) {
    const route = apiResponse.route

    const parseUSD = (value) => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }

    const feeUSD = route.feeUsd ? parseUSD(route.feeUsd) : 0
    const gasUSD = route.estimatedGasInUsd
      ? parseUSD(route.estimatedGasInUsd)
      : 0
    const totalCostUSD = feeUSD + gasUSD

    const timeSeconds = route.estimatedTimeInSeconds || 300
    const timeMinutes = Math.ceil(timeSeconds / 60)

    return this.formatResponse({
      totalCost: totalCostUSD,
      bridgeFee: feeUSD,
      gasFee: gasUSD,
      estimatedTime: `${timeMinutes} mins`,
      route: route.swapper?.title || 'Rango',
      protocol: 'Rango',
      outputAmount: route.outputAmount,
      meta: {
        tool: 'rango',
        swapper: route.swapper,
        path: route.path,
        estimatedTimeInSeconds: route.estimatedTimeInSeconds,
      },
    })
  }
}
