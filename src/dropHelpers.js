/**
 * dropHelpers — utilities for drag-and-drop file handling.
 *
 * Electron 32+ deprecated File.path. Use webUtils.getPathForFile() via
 * the preload bridge (window.swissKnife.getPathForFile) instead.
 */

const api = window.swissKnife

/**
 * Extract the native file path from a dropped File object.
 * Uses Electron's webUtils.getPathForFile (modern) with File.path fallback.
 */
export function getDropPath(file) {
  if (!file) return ''
  try {
    // Modern Electron 32+ API (exposed via preload)
    if (api?.getPathForFile) return api.getPathForFile(file) || ''
  } catch { /* fall through */ }
  // Legacy fallback
  return file.path || ''
}

/**
 * Extract file paths from a drop event's dataTransfer.
 * Returns an array of non-empty path strings.
 */
export function getDropPaths(e) {
  return Array.from(e.dataTransfer?.files || [])
    .map(f => getDropPath(f))
    .filter(Boolean)
}

/**
 * Extract the first file path from a drop event.
 * Returns the path string or '' if none.
 */
export function getFirstDropPath(e) {
  const file = e.dataTransfer?.files?.[0]
  return file ? getDropPath(file) : ''
}
