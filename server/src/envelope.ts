/** Envoltura de toda respuesta: `{ data, meta: { count, filters } }`. */
export function envelope<T>(data: T, meta: { count?: number, filters?: Record<string, string> } = {}) {
  const count = meta.count ?? (Array.isArray(data) ? data.length : 1)
  return { data, meta: { count, filters: meta.filters ?? {} } }
}
