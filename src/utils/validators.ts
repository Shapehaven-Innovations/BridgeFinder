import { CHAINS } from './constants'

// src/utils/validators.ts
export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && num < 1000000
}

export const validateSlippage = (slippage: number): boolean => {
  return slippage >= 0.1 && slippage <= 50
}

export const isValidChainId = (chainId: number): boolean => {
  return Object.values(CHAINS).some((chain) => chain.id === chainId)
}
