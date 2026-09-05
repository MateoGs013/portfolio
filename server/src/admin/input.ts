/** Coerción mínima del body del admin. Lanza HttpError 400 con el campo que falla. */

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

type Body = Record<string, unknown>

function bad(field: string, expected: string): never {
  throw new HttpError(400, `campo "${field}": se esperaba ${expected}`)
}

export function str(b: Body, k: string): string {
  const v = b[k]
  if (typeof v !== 'string' || v.trim() === '') bad(k, 'string no vacío')
  return v.trim()
}

export function optStr(b: Body, k: string): string | null {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string') bad(k, 'string o null')
  return v.trim()
}

export function int(b: Body, k: string): number {
  const v = b[k]
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isInteger(n)) bad(k, 'entero')
  return n
}

export function optInt(b: Body, k: string): number | null {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  return int(b, k)
}

export function bool(b: Body, k: string): boolean {
  const v = b[k]
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false' || v === undefined) return false
  return bad(k, 'boolean')
}

export function date(b: Body, k: string): Date {
  const v = b[k]
  const d = typeof v === 'string' ? new Date(v) : null
  if (!d || Number.isNaN(d.getTime())) bad(k, 'fecha ISO')
  return d
}

export function optDate(b: Body, k: string): Date | null {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  return date(b, k)
}

export function enumOf<T extends string>(b: Body, k: string, values: readonly T[]): T {
  const v = b[k]
  if (typeof v !== 'string' || !(values as readonly string[]).includes(v)) bad(k, `uno de ${values.join(' | ')}`)
  return v as T
}

export function intList(b: Body, k: string): number[] {
  const v = b[k] ?? []
  if (!Array.isArray(v) || !v.every(x => Number.isInteger(x))) bad(k, 'lista de enteros')
  return v as number[]
}

export function list(b: Body, k: string): Body[] {
  const v = b[k] ?? []
  if (!Array.isArray(v) || !v.every(x => x && typeof x === 'object')) bad(k, 'lista de objetos')
  return v as Body[]
}

/** JSON libre: objeto, array o null. Acepta string y lo parsea. */
export function json(b: Body, k: string): unknown {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'string') {
    try {
      return JSON.parse(v)
    }
    catch {
      bad(k, 'JSON válido')
    }
  }
  return v
}
