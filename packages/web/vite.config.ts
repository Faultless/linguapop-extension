import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'cors-proxy',
      configureServer(server) {
        server.middlewares.use('/cors-proxy', async (req, res) => {
          const targetUrl = new URL(req.url!, 'http://localhost').searchParams.get('url')
          if (!targetUrl) {
            res.statusCode = 400
            res.end('Missing ?url= parameter')
            return
          }
          try {
            const resp = await fetch(targetUrl)
            res.setHeader('Content-Type', resp.headers.get('content-type') ?? 'application/octet-stream')
            res.setHeader('Access-Control-Allow-Origin', '*')
            const body = await resp.arrayBuffer()
            res.end(Buffer.from(body))
          } catch (e: any) {
            res.statusCode = 502
            res.end(e.message)
          }
        })
      },
    },
  ],
  build: {
    outDir: 'dist',
  },
})
