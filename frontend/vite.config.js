import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  define: {
    "process.env.API_BASE_URL": JSON.stringify(
      process.env.NODE_ENV === "production"
        ? "https://your-api.vercel.app"
        : "http://localhost:3000"
    )}
})
