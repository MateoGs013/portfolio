/**
 * Cómo se juntan y se ubican los fallos de validación del admin (input.ts arma los mensajes).
 *
 * Cada objeto que llega en un body validado queda registrado con su ruta y su modelo, así un campo de
 * un enlace o de un inglés anidado sabe dónde está (`links[0].url`, `translations.en.title`) aunque
 * la función que lo valida reciba solo ese objeto.
 */
import type { ModelName } from '../shared/adminSchema.js'
import type { FieldIssue } from '../shared/adminContracts.js'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/** 400 con todos los campos que fallaron. `message` resume la lista para un aviso de una línea. */
export class ValidationError extends HttpError {
  constructor(public issues: FieldIssue[]) {
    super(400, summarize(issues))
  }
}

function summarize(issues: readonly FieldIssue[]): string {
  if (issues.length === 1) return issues[0]?.message ?? ''
  return `Hay ${issues.length} campos para revisar. ${issues.map(i => i.message).join(' ')}`
}

export interface Place {
  path: string
  model: ModelName | null
}

const places = new WeakMap<object, Place>()

export function placeOf(value: object): Place | undefined {
  return places.get(value)
}

/**
 * Registra `value` y todo lo que cuelga de él. `child` dice el modelo de cada clave anidada. Un objeto
 * ya registrado conserva su ruta: validar una parte de un body no la mueve a la raíz.
 */
export function register(value: unknown, model: ModelName | null, child: (model: ModelName | null, key: string) => ModelName | null, path = ''): void {
  if (!value || typeof value !== 'object' || places.has(value)) return
  places.set(value, { path, model })
  if (Array.isArray(value)) {
    value.forEach((item, i) => register(item, model, child, `${path}[${i}]`))
    return
  }
  for (const [key, nested] of Object.entries(value)) register(nested, child(model, key), child, path ? `${path}.${key}` : key)
}

/** Lista abierta por `collecting`, o null fuera de una validación (entonces cada fallo responde solo). */
let active: FieldIssue[] | null = null

/** Anota un fallo. Fuera de `collecting` responde 400 en el acto. */
export function issue(found: FieldIssue): void {
  if (!active) throw new ValidationError([found])
  if (!active.some(i => i.path === found.path && i.message === found.message)) active.push(found)
}

/** Anota el fallo del campo `k` de `b` y devuelve `fallback` para que la validación siga. */
export function fail<T>(b: object, k: string, message: string, fallback: T): T {
  const place = placeOf(b)
  issue({ path: place?.path ? `${place.path}.${k}` : k, message })
  return fallback
}

interface Collected<T> {
  issues: FieldIssue[]
  result?: T
  error?: unknown
}

/**
 * Corre `build` anotando los fallos en vez de cortar en el primero. Un 400 que lanza `build` (de un
 * validador que no anota) se suma a la lista; cualquier otro error vuelve en `error`.
 */
export function collecting<T>(build: () => T): Collected<T> {
  const outer = active
  const issues: FieldIssue[] = []
  active = issues
  try {
    return { issues, result: build() }
  }
  catch (err) {
    if (err instanceof ValidationError) issues.push(...err.issues)
    else if (err instanceof HttpError && err.status === 400) issues.push({ path: '', message: err.message })
    else return { issues, error: err }
    return { issues }
  }
  finally {
    active = outer
  }
}

export function describeIssues(issues: FieldIssue[]): ValidationError {
  return new ValidationError(issues)
}
