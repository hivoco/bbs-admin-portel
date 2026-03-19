import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      // Only proxy /scan/{uuid} — not /scanner or /scan-history
      '^/scan/[0-9a-f-]+$': 'http://localhost:8000',
    },
  },
})
