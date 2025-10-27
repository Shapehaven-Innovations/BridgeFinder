import React from 'react'
import { QueryProvider } from './app/providers/QueryProvider' // adjust path as needed
import { HomePage } from './pages/HomePage'

export const App: React.FC = () => {
  return (
    <QueryProvider>
      <HomePage />
    </QueryProvider>
  )
}
