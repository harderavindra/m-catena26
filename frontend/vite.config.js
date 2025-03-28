import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    host: '0.0.0.0',      // To allow external access
    port: 3000,           // Custom port number
    open: true,           // Automatically open in the browser
    proxy: {
      '/api': {
        target: 'https://m-catena-b.vercel.app',  // Your backend URL
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),  // Optional rewrite rule
      },
    },
  },
 
})
