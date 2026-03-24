// Module-level cache for page state across navigation.
// Survives route changes (component unmount/remount) but not app restart.
const _cache = {}

export function savePageState(key, state) {
  _cache[key] = state
}

export function loadPageState(key) {
  return _cache[key] || null
}
