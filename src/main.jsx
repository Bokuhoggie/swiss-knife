import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { setPendingFile } from './globalDrop.js'

// Allow drops everywhere (shows correct drag cursor, prevents browser nav).
document.addEventListener('dragover', (e) => e.preventDefault(), false)

// Global drop catch-all: always prevent Electron default navigation first,
// then only redirect to inspector if no component dropzone handled the drop.
document.addEventListener('drop', (e) => {
  const handledByComponent = e.defaultPrevented
  e.preventDefault()   // ALWAYS prevent — stops Electron from loading the file as a page
  if (handledByComponent) return
  const files = Array.from(e.dataTransfer.files).filter(f => f.path)
  if (files.length === 0) return
  setPendingFile(files[0].path)
  // Navigate to inspector via hash router
  if (!window.location.hash.startsWith('#/inspector')) {
    window.location.hash = '#/inspector'
  }
}, false)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
