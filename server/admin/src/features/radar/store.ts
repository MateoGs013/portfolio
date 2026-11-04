/**
 * Las tendencias del radar de Eros, una sola copia para la lista y el registro. Buscar y cambiar el
 * estado van a Eros; la lista se actualiza con lo que respondió.
 */
import type { Trend, TrendStatus } from '@shared/radarContracts'
import { radarApi } from './api'
import { erosList, isSampleRow, newestFirst } from './erosList'

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
