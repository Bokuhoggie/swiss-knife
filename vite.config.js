import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Allow window.swissKnife (injected by Electron preload) to be used
  // without errors in browser-only mode
  define: {
    // Prevent process.env issues
  },
})
