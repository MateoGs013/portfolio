/**
 * Las tendencias del radar de Eros, una sola copia para la lista y el registro. Buscar, cambiar el
 * estado y crear una publicación van a Eros; la lista se actualiza con lo que respondió.
 */
import type { ContentPost, Trend, TrendStatus } from '@shared/contentContracts'
import { erosList, isSampleRow, newestFirst } from '../content/erosList'
import { posts } from '../content/store'
import { radarApi, type TrendGenerate } from './api'

export const trends = erosList<Trend>(
  () => radarApi.trends(),
  newestFirst(row => row.detected_at),
)

export function canChangeTrend(row: Trend): boolean {
  return !isSampleRow(row) && !trends.offline.value
}

export async function changeTrendStatus(row: Trend, status: TrendStatus): Promise<Trend> {
  const result = await radarApi.setStatus(row.id, status)
  const next: Trend = { ...row, ...(result.trend ?? {}), status: result.trend?.status ?? status }
  trends.upsert(next)
  return next
}

/**
 * Eros escribe una publicación desde la tendencia: entra a Publicaciones y la tendencia se vuelve a
 * leer (Eros la marca con su publicación).
 */
export async function postFromTrend(row: Trend, request: TrendGenerate): Promise<ContentPost | null> {
  const { post } = await radarApi.generate(row.id, request)
  if (post) posts.upsert(post)
  const fresh = await radarApi.trend(row.id).catch(() => null)
  trends.upsert(fresh ?? (post ? { ...row, post_id: post.id } : row))
  return post
}
