/**
 * globalDrop — cross-component channel for files dropped outside a dropzone.
 *
 * Flow:
 *   1. App.jsx's onDrop fires for drops that land outside any component dropzone
 *      (component dropzones call stopPropagation to prevent this).
 *   2. It stores the file path here and navigates to /inspector.
 *   3. FileInspector reads the pending file on mount OR listens while mounted.
 */

let _pending = null

/** Store a file path and broadcast to any mounted listeners. */
export function setPendingFile(p) {
  _pending = p
  window.dispatchEvent(new CustomEvent('global-file-drop'))
}

/** Consume and return the pending file (clears it). */
export function consumePendingFile() {
  const f = _pending
  _pending = null
  return f
}
