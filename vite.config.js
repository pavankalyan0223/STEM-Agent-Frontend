import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: ['vis-network', 'pdfjs-dist'],
    force: true
  },
  server: {
    fs: {
      strict: false
    }
  }
})
