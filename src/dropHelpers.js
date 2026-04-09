/**
 * dropHelpers — utilities for drag-and-drop file handling.
 *
 * Electron 32+ deprecated File.path. Use webUtils.getPathForFile() via
 * the preload bridge (window.swissKnife.getPathForFile) instead.
 */

const api = window.swissKnife

/**
 * Extract the native file path from a dropped File object.
 * Uses Electron's webUtils.getPathForFile via the preload bridge.
 */
export function getDropPath(file) {
  if (!file) return ''
  try {
    if (api?.getPathForFile) return api.getPathForFile(file) || ''
  } catch { /* fall through */ }
  return file.path || ''
}

/**
 * Extract file paths from a drop event.
 */
export function getDropPaths(e) {
  let paths = Array.from(e.dataTransfer?.files || [])
    .map(f => getDropPath(f))
    .filter(Boolean)
    
  // Fallback: If no files were parsed (e.g. dragged from a web browser or Antigravity),
  // they might be represented as text/uri-list (links to local files).
  if (paths.length === 0 && e.dataTransfer) {
    const uriStr = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || ''
    const lines = uriStr.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    for (const line of lines) {
      if (line.startsWith('file:///')) {
        try {
          const decoded = decodeURIComponent(line.substring(8)) // Remove file:///
          // Handle Windows paths vs Unix paths
          const isWindows = /^[A-Z]:\//i.test(decoded) || /^[A-Z]:\\/i.test(decoded)
          paths.push(isWindows ? decoded : '/' + decoded)
        } catch (err) {}
      } else if (/^[A-Z]:\\[^/:*?"<>|]+$/i.test(line) || line.startsWith('/')) {
        // Plain absolute path from text
        paths.push(line)
      }
    }
  }

  // Deduplicate
  return [...new Set(paths)]
}

/**
 * Extract the first file path from a drop event.
 * Returns the path string or '' if none.
 */
export function getFirstDropPath(e) {
  const paths = getDropPaths(e)
  return paths.length > 0 ? paths[0] : ''
}
