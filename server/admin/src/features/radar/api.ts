/**
 * Los pedidos de Tendencias a /api/admin/radar/*, con el contrato de @shared/radarContracts. Todo
 * pasa por Eros: buscar y cambiar el estado. Una tendencia se vuelve artículo con «Escribir artículo»
 * (POST /articles/generate { trendId }, features/articles/runs.ts).
 */
import type { Trend, TrendChange, TrendScan, TrendStatus } from '@shared/radarContracts'
import { api, type RequestOptions } from '../../api/client'

const path = (id: string, rest = '') => `/radar/trends/${encodeURIComponent(id)}${rest}`

export const radarApi = {
  trends: (options?: RequestOptions) => api.get<Trend[]>('/radar/trends', options),
  trend: (id: string, options?: RequestOptions) => api.get<Trend>(path(id), options),
  scan: () => api.post<TrendScan>('/radar/scan'),
  setStatus: (id: string, status: TrendStatus) => api.patch<TrendChange>(path(id, '/status'), { status }),
}
