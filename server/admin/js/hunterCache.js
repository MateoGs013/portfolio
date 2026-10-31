// Copia local de las vacantes reales de Eros (localStorage).
// Las filas de respaldo o de muestra nunca se guardan: si Eros no responde, la copia sigue
// siendo la última cola real con sus mensajes y CV, y no la muestra de la API.

const KEY = 'eros_hunter_jobs'

/** Fila que no viene de Eros: la cola de ejemplo del respaldo o la muestra de demostración. */
export function isSampleJob(job) {
  return !!job && (job._source === 'fallback' || job._source === 'demo')
}

export function readCachedJobs() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(j => j && typeof j === 'object' && !isSampleJob(j)) : []
  } catch {
    return []
  }
}

/** Guarda solo las vacantes reales. Una cola hecha solo de muestra no toca la copia que había. */
export function writeCachedJobs(jobs) {
  const real = (jobs || []).filter(j => j && !isSampleJob(j))
  if (real.length === 0 && (jobs || []).length > 0) return
  try {
    localStorage.setItem(KEY, JSON.stringify(real))
  } catch (err) {
    console.warn('No se pudo guardar la copia local de las vacantes:', err)
  }
}

export function clearCachedJobs() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Sin acceso al almacenamiento no queda nada que borrar.
  }
}
