import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const proxyConfig = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: proxyConfig,
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: proxyConfig,
  },
})
