import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { setPendingFile } from './globalDrop.js'

// Allow drops everywhere (shows correct drag cursor, prevents browser nav).
document.addEventListener('dragover', (e) => e.preventDefault(), false)

// Global drop catch-all: always prevent Electron default navigation,
// then route to inspector only if the drop did NOT land on a component dropzone.
document.addEventListener('drop', (e) => {
  e.preventDefault()  // ALWAYS prevent — stops Electron from loading the file as a page
  e.stopPropagation()

  // If the drop landed inside a component dropzone, let the component handle it
  if (e.target.closest('.dropzone, .inspector-drop')) return

  const file = Array.from(e.dataTransfer.files)[0]
  if (!file) return
  const filePath = file.path || ''
  if (!filePath) return

  setPendingFile(filePath)
  if (!window.location.hash.startsWith('#/inspector')) {
    window.location.hash = '#/inspector'
  }
}, false)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
