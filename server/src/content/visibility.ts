/**
 * Visibilidad: una obra se muestra en el sitio solo si `publishedAt` no es nulo y ya pasó.
 * Se aplica en la API (listas, detalles, relaciones y conteos) y en el snapshot, nunca en un componente.
 */
import type { Prisma } from '../../generated/prisma/client.js'

/** Filtro de Prisma armado en cada consulta: `now` no queda fijo al cargar el módulo. */
export function visibleProject(): Prisma.ProjectWhereInput {
  return { publishedAt: { not: null, lte: new Date() } }
}

/** Artículos visibles: publicados y con fecha ya cumplida. */
export function visibleArticle(): Prisma.ArticleWhereInput {
  return { status: 'PUBLISHED', publishedAt: { not: null, lte: new Date() } }
}

/** La misma regla en memoria, para registros del snapshot (fechas como Date o como texto ISO). */
export function isVisible(record: { publishedAt: Date | string | null }): boolean {
  if (record.publishedAt === null) return false
  const at = new Date(record.publishedAt).getTime()
  return Number.isFinite(at) && at <= Date.now()
}

export function isVisibleArticle(record: { status: string, publishedAt: Date | string | null }): boolean {
  return record.status === 'PUBLISHED' && isVisible(record)
}
