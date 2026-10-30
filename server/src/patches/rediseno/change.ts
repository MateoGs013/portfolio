/** Un cambio pendiente del parche: qué hace (para --dry) y cómo aplicarlo dentro de la transacción. */
import type { Prisma } from '../../../generated/prisma/client.js'

export type Tx = Prisma.TransactionClient

export interface Change {
  /** Una línea por cada cosa que cambia, en el formato `registro: campo antes → después`. */
  what: string[]
  apply: (tx: Tx) => Promise<unknown>
}

/** Valor corto y legible para el diff. */
export function show(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > 70 ? `${text.slice(0, 67)}…` : text
}
