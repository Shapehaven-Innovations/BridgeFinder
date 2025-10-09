import { useState, useCallback } from 'react'
import { ToastMessage, ToastType } from './Toast'

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: ToastMessage = { id, type, message }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (message: string) => addToast('success', message),
    [addToast]
  )

  const error = useCallback(
    (message: string) => addToast('error', message),
    [addToast]
  )

  const warning = useCallback(
    (message: string) => addToast('warning', message),
    [addToast]
  )

  const info = useCallback(
    (message: string) => addToast('info', message),
    [addToast]
  )

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
