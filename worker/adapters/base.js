// worker/adapters/base.js
import { CONFIG, TOKENS } from '../config.js'

export class BridgeAdapter {
  constructor(name, config) {
    this.name = name
    this.config = config
    this.icon = '🌉'
    this.lastRequestTime = 0
    this.requestCount = 0
    this.windowStart = Date.now()
  }

  async checkRateLimit() {
    const now = Date.now()
    const windowElapsed = now - this.windowStart

    if (windowElapsed > this.config.rateLimit.window) {
      this.windowStart = now
      this.requestCount = 0
    }

    if (this.requestCount >= this.config.rateLimit.requests) {
      const waitTime = this.config.rateLimit.window - windowElapsed
      throw new Error(
        `Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`
      )
    }

    this.requestCount++
  }

  async getQuote(params) {
    throw new Error('getQuote must be implemented by adapter')
  }

  toUnits(amountStr, decimals) {
    try {
      let cleanAmount = String(amountStr)
        .trim()
        .replace(/[^\d.-]/g, '')

      if (!cleanAmount || cleanAmount === '-' || cleanAmount === '.') {
        return '0'
      }

      if (isNaN(Number(cleanAmount))) {
        console.warn(`Invalid amount: "${amountStr}"`)
        return '0'
      }

      const [integerPart = '0', fractionalPart = ''] = cleanAmount.split('.')

      if (!/^-?\d+$/.test(integerPart)) {
        console.warn(`Invalid integer: "${integerPart}"`)
        return '0'
      }

      const paddedFraction = (fractionalPart + '0'.repeat(decimals)).slice(
        0,
        decimals
      )

      if (paddedFraction && !/^\d+$/.test(paddedFraction)) {
        console.warn(`Invalid fraction: "${fractionalPart}"`)
        return '0'
      }

      const integerBigInt = BigInt(integerPart) * 10n ** BigInt(decimals)
      const fractionalBigInt = BigInt(paddedFraction || '0')

      const result =
        integerBigInt >= 0n
          ? integerBigInt + fractionalBigInt
          : integerBigInt - fractionalBigInt

      return result.toString()
    } catch (error) {
      console.error('toUnits error:', error)
      return '0'
    }
  }

  getTokenAddress(token, chainId) {
    const tokenCfg = TOKENS[token]
    if (!tokenCfg) return null
    if (typeof tokenCfg.address === 'object') {
      return tokenCfg.address[chainId] || tokenCfg.address[1]
    }
    return tokenCfg.address
  }

  async fetchWithTimeout(url, options = {}, timeout = CONFIG.REQUEST_TIMEOUT) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  formatResponse(data) {
    return {
      name: this.name,
      icon: this.icon,
      provider: this.name.toLowerCase().replace(/\s+/g, ''),
      totalCost: data.totalCost ?? CONFIG.DEFAULT_GAS_ESTIMATE,
      bridgeFee: data.bridgeFee || 0,
      gasFee: data.gasFee ?? CONFIG.DEFAULT_GAS_ESTIMATE,
      estimatedTime: data.estimatedTime || '5-10 mins',
      security: data.security || 'Verified',
      liquidity: data.liquidity || 'Medium',
      route: data.route || `${this.name} Route`,
      outputAmount: data.outputAmount || null,
      protocol: data.protocol || this.name,
      isEstimated: data.isEstimated || false,
      meta: data.meta || undefined,
    }
  }
}
