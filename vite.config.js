import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port for devUrl
  server: {
    port: 5173,
    strictPort: true,
  },
  // Tauri uses its own asset protocol, but keep relative paths for build
  base: './',
})
