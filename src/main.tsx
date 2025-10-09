import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '../styles/variables.css'
import '../styles/globals.css'
import '../styles/themes.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find root element')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
