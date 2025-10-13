// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ThemeProvider } from './lib/ThemeProvider'
import { ThemeToggle } from '@components/ThemeToggle'
import '../styles/variables.css'
import '../styles/globals.css'
import '../styles/themes.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find root element')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 1000,
          }}
        >
          <ThemeToggle />
        </div>
        <App />
      </div>
    </ThemeProvider>
  </React.StrictMode>
)
