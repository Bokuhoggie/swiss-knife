import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Required for Electron: file:// protocol needs relative asset paths
  base: './',
  // Allow window.swissKnife (injected by Electron preload) to be used
  // without errors in browser-only mode
  define: {
    // Prevent process.env issues
  },
})
