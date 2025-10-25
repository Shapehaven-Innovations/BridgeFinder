import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs/promises'

// Types for the hook & Node req/res
import type { ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** Dev-only plugin that writes posted JSON to api-results.json */
function saveResultsPlugin() {
  return {
    name: 'dev-save-results',
    apply: 'serve' as const, // only in `vite serve` (npm run dev)
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        '/dev/save-results',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }

          try {
            const chunks: Uint8Array[] = []
            for await (const chunk of req) chunks.push(chunk)
            const body = Buffer.concat(chunks).toString() || '{}'

            // Parse & pretty-print
            const json = JSON.parse(body)
            const outPath = path.join(process.cwd(), 'api-results.json')
            await fs.writeFile(
              outPath,
              JSON.stringify(json, null, 2) + '\n',
              'utf-8'
            )

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, saved: outPath }))
          } catch (e: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({ ok: false, error: e?.message || 'write failed' })
            )
          }
        }
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), saveResultsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './styles'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔴 Proxy error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔵 Proxying:', req.method, req.url, '→', proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('🟢 Proxy response:', req.url, '→', proxyRes.statusCode)
          })
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/types.ts',
      ],
    },
  },
})
