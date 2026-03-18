import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ── Drag-and-drop foundation ──
// These CAPTURE-phase listeners fire BEFORE any React or component handler.
// They ensure: (1) every element in the app is a valid drop target,
//              (2) Electron never navigates to a dropped file.
document.addEventListener('dragover', (e) => e.preventDefault(), true)
document.addEventListener('drop', (e) => e.preventDefault(), true)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
