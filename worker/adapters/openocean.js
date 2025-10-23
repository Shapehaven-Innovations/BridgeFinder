// worker/adapters/openocean.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class OpenOceanAdapter extends BridgeAdapter {
  constructor(config) {
    super('OpenOcean', config)
    this.icon = '🌊'
  }

  mapChainToOpenOcean(chainId) {
    const map = {
      1: 'eth',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      56: 'bsc',
      43114: 'avax',
      8453: 'base',
      250: 'fantom',
    }
    const result = map[chainId]
    if (!result) {
      throw new Error(`OpenOcean: Unsupported chain ${chainId}`)
    }
    return result
  }

  async getQuote(params, env) {
    await this.checkRateLimit()

    const { fromChainId, toChainId, token, amount, sender } = params

    // OpenOcean only works for same-chain swaps, not cross-chain
    if (fromChainId !== toChainId) {
      throw new Error(
        `${this.name}: Only supports same-chain swaps, not cross-chain bridges`
      )
    }

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

    const inTokenAddress = tokenCfg.addresses?.[fromChainId]
    const outTokenAddress = tokenCfg.addresses?.[toChainId]

    if (!inTokenAddress || !outTokenAddress) {
      throw new Error(`${this.name}: Missing token addresses`)
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals)
    const chain = this.mapChainToOpenOcean(fromChainId)

    const queryParams = new URLSearchParams({
      inTokenAddress: inTokenAddress,
      outTokenAddress: outTokenAddress,
      amount: fromAmount,
      gasPrice: '5',
      slippage: '1',
      account: sender,
    })

    const url = `https://open-api.openocean.finance/v3/${chain}/quote?${queryParams}`

    console.log(`[${this.name}] Fetching:`, url)

    const res = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BridgeAggregator/1.0',
      },
    })

    console.log(`[${this.name}] HTTP Status:`, res.status)

    if (!res.ok) {
      const errorBody = await res.text().catch(() => 'No details')
      console.error(`[${this.name}] API Error:`, errorBody)

      // Handle IP ban gracefully
      if (res.status === 403) {
        throw new Error(
          `${this.name}: Access restricted (IP may be rate-limited). Try again later.`
        )
      }

      throw new Error(
        `${this.name}: HTTP ${res.status} - ${errorBody.substring(0, 200)}`
      )
    }

    const data = await res.json()
    console.log(`[${this.name}] API Response:`, JSON.stringify(data, null, 2))

    if (!data || !data.data || !data.data.outAmount) {
      throw new Error(`${this.name}: Invalid response`)
    }

    return this.mapToStandardFormat(data.data, tokenCfg)
  }

  mapToStandardFormat(apiResponse, tokenCfg) {
    const parseFloat2 = (value) => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }

    const estimatedGas = parseFloat2(apiResponse.estimatedGas)
    const gasPrice = parseFloat2(apiResponse.gasPrice) / 1e9
    const gasUSD = (estimatedGas * gasPrice * 2000) / 1e18
    const priceImpact = parseFloat2(apiResponse.priceImpact)
    const feeUSD =
      (Math.abs(priceImpact) * parseFloat2(apiResponse.inAmount)) /
      Math.pow(10, 6)

    return this.formatResponse({
      totalCost: gasUSD + feeUSD,
      bridgeFee: feeUSD,
      gasFee: gasUSD,
      estimatedTime: '1-2 mins',
      route: 'OpenOcean',
      protocol: 'OpenOcean',
      outputAmount: apiResponse.outAmount,
      meta: {
        tool: 'openocean',
        priceImpact: apiResponse.priceImpact,
        estimatedGas: apiResponse.estimatedGas,
      },
    })
  }
}
