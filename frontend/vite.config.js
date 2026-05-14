import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cấu hình Vite cho dự án (Issue #003)
export default defineConfig({
  // Issue #003: Cấu hình plugins cho React và Tailwind CSS v4
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Issue #003: Cấu hình Proxy để kết nối Frontend với Backend (FastAPI)
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
