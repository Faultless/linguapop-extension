import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/linguapop-extension/',
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
  },
})
