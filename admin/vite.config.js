import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.4:3000', //use your pc ip here
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
