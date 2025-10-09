import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@types': path.resolve(__dirname, './types'),
      '@styles': path.resolve(__dirname, './styles'),
    },
  },
  // IMPORTANT: Set this to your repo name for GitHub Pages
  // Format: '/repo-name/'
  // Example: If your repo is 'BridgeFinder', use '/BridgeFinder/'
  // If deploying to user/org site (username.github.io), use '/'
  base: '/BridgeFinder/', // <-- CHANGE THIS to match your repo name

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
