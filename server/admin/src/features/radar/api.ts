/**
 * Los pedidos de Tendencias a /api/admin/radar/*, con el contrato de @shared/contentContracts. Todo
 * pasa por Eros: buscar, cambiar el estado y crear una publicación desde una tendencia.
 */
import type { GenerateRequest, Trend, TrendChange, TrendPost, TrendScan, TrendStatus } from '@shared/contentContracts'
import { api, type RequestOptions } from '../../api/client'

const path = (id: string, rest = '') => `/radar/trends/${encodeURIComponent(id)}${rest}`

/** Lo que se le pide a Eros además de la tendencia (que es el tema). */
export type TrendGenerate = Omit<GenerateRequest, 'topic'>

export const radarApi = {
  trends: (options?: RequestOptions) => api.get<Trend[]>('/radar/trends', options),
  trend: (id: string, options?: RequestOptions) => api.get<Trend>(path(id), options),
  scan: () => api.post<TrendScan>('/radar/scan'),
  setStatus: (id: string, status: TrendStatus) => api.patch<TrendChange>(path(id, '/status'), { status }),
  generate: (id: string, request: TrendGenerate) => api.post<TrendPost>(path(id, '/generate'), request),
}
