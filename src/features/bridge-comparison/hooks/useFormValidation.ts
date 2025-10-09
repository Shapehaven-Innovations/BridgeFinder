import { useMemo } from 'react'
import type {
  BridgeComparisonFormData,
  BridgeComparisonFormErrors,
} from '../types'

export function useFormValidation(formData: BridgeComparisonFormData) {
  const errors = useMemo<BridgeComparisonFormErrors>(() => {
    const newErrors: BridgeComparisonFormErrors = {}

    if (!formData.fromChainId) {
      newErrors.fromChainId = 'Please select a source chain'
    }

    if (!formData.toChainId) {
      newErrors.toChainId = 'Please select a destination chain'
    }

    if (formData.fromChainId && formData.toChainId) {
      if (formData.fromChainId === formData.toChainId) {
        newErrors.toChainId = 'Destination must differ from source'
      }
    }

    if (!formData.token) {
      newErrors.token = 'Please select a token'
    }

    const amount = parseFloat(formData.amount)
    if (!formData.amount) {
      newErrors.amount = 'Please enter an amount'
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount must be a valid number'
    } else if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    const slippage = parseFloat(formData.slippage)
    if (isNaN(slippage)) {
      newErrors.slippage = 'Slippage must be a valid number'
    } else if (slippage < 0 || slippage > 1) {
      newErrors.slippage = 'Slippage must be between 0 and 1'
    }

    return newErrors
  }, [formData])

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  return { errors, isValid }
}
