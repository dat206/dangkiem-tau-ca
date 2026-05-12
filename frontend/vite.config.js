import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cấu hình Vite cho dự án (Issue #003)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tích hợp Tailwind CSS v4 vào quy trình build
  ],
  server: {
    // Cấu hình Proxy để gọi API backend mà không bị lỗi CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Forward các request bắt đầu bằng /api sang Backend
        changeOrigin: true,
      },
    },
  },
})
