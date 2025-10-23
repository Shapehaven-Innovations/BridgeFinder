// worker/adapters/stargate.js
import { BridgeAdapter } from './base.js'
import { CONFIG, TOKENS } from '../config.js'

export class StargateAdapter extends BridgeAdapter {
  constructor(config) {
    super('Stargate', config)
    this.icon = '⭐'
  }

  getPoolId(token, chainId) {
    const poolMap = {
      USDC: {
        1: 1,
        137: 1,
        42161: 1,
        10: 1,
        56: 1,
        43114: 1,
        8453: 1,
      },
      USDT: {
        1: 2,
        137: 2,
        42161: 2,
        10: 2,
        56: 2,
        43114: 2,
      },
      ETH: {
        1: 13,
        42161: 13,
        10: 13,
        8453: 13,
      },
      WETH: {
        1: 13,
        42161: 13,
        10: 13,
        8453: 13,
      },
    }

    return poolMap[token]?.[chainId] || null
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

    const layerZeroChainMap = {
      1: 101,
      137: 109,
      42161: 110,
      10: 111,
      56: 102,
      43114: 106,
      8453: 184,
      250: 112,
    }

    const srcChainId = layerZeroChainMap[fromChainId]
    const dstChainId = layerZeroChainMap[toChainId]

    if (!srcChainId || !dstChainId) {
      throw new Error(
        `${this.name}: Chain not supported (${fromChainId} -> ${toChainId})`
      )
    }

    const fromAmount = this.toUnits(amount, tokenCfg.decimals)
    const srcPoolId = this.getPoolId(token, fromChainId)
    const dstPoolId = this.getPoolId(token, toChainId)

    if (!srcPoolId || !dstPoolId) {
      throw new Error(
        `${this.name}: No pool available for ${token} on chain ${fromChainId} -> ${toChainId}`
      )
    }

    // Use Stargate V2 API endpoint
    const url = `https://api-v2.stargate.finance/v1/quote`

    const body = {
      srcChainId: srcChainId,
      dstChainId: dstChainId,
      srcPoolId: srcPoolId,
      dstPoolId: dstPoolId,
      amountLD: fromAmount,
    }

    console.log(`[${this.name}] Fetching:`, url)
    console.log(`[${this.name}] Body:`, JSON.stringify(body, null, 2))

    const res = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
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

    if (!data || typeof data.amountLD === 'undefined') {
      throw new Error(`${this.name}: Invalid response - missing amount data`)
    }

    return this.mapToStandardFormat(data, tokenCfg)
  }

  mapToStandardFormat(apiResponse, tokenCfg) {
    const parseUSD = (value) => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }

    const feeInTokens =
      parseUSD(apiResponse.eqFee) / Math.pow(10, tokenCfg.decimals)
    const totalBridgeFeeUSD = feeInTokens
    const gasFeeUSD = 0 // Stargate doesn't provide gas estimates
    const estimatedTimeMinutes = 5

    return this.formatResponse({
      totalCost: totalBridgeFeeUSD,
      bridgeFee: totalBridgeFeeUSD,
      gasFee: gasFeeUSD,
      estimatedTime: `${estimatedTimeMinutes} mins`,
      route: 'Stargate Bridge',
      protocol: 'LayerZero',
      outputAmount: apiResponse.amountLD,
      meta: {
        tool: 'stargate',
        eqFee: apiResponse.eqFee,
        amountLD: apiResponse.amountLD,
        gasNotIncluded: true,
      },
    })
  }
}
