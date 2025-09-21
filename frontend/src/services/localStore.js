// small helpers to persist/retrieve arrays from localStorage
export function loadArray(key) {
try { return JSON.parse(localStorage.getItem(key) || '[]') } catch(e) { return [] }
}
export function saveArray(key, arr) { localStorage.setItem(key, JSON.stringify(arr || [])) }