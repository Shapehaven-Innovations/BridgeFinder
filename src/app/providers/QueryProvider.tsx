import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 60 * 1000, // 1 minute (formerly cacheTime)
            retry: (failureCount, error) => {
              // Retry 5xx errors, not 4xx
              if (error instanceof Error && 'status' in error) {
                const status = (error as { status: number }).status
                if (status >= 400 && status < 500) {
                  return false // Don't retry client errors
                }
              }
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
