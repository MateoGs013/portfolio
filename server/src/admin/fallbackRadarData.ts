/**
 * Muestra de Tendencias para pruebas y capturas: solo existe con EROS_DEMO=1 (nunca en producción) y
 * solo cuando Eros no responde. Las tendencias de muestra dicen que lo son: sin dirección, sin fecha
 * y sin afinidad, porque ninguna fuente las publicó. Nada se modifica en memoria y ninguna se vuelve
 * artículo.
 */
import type { Response } from 'express'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import type { Trend } from '../shared/radarContracts.js'

export { erosDemo } from './fallbackHunterData.js'

/** Las tendencias de muestra empiezan así; nunca se le preguntan a Eros. */
export const DEMO_PREFIX = 'demo-'
export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX)

/** El 400 de cualquier cambio pedido sobre la muestra: no hay dónde guardarlo. */
export const demoRefusal: AdminErrorBody = {
  error: 'Es una muestra para probar el admin sin Eros: no se guarda ningún cambio.',
  code: 'invalid',
  errors: [],
}

/** Un cambio pedido sobre la muestra responde 400 y nunca llega a Eros. true si se respondió. */
export function refuseDemo(res: Response, id: string): boolean {
  if (!isDemoId(id)) return false
  res.status(400).json(demoRefusal)
  return true
}

/** Una respuesta de la muestra, con su origen en el header (el cliente lo pasa a `_source`). */
export function sendDemo(res: Response, body: unknown): void {
  res.setHeader('X-Eros-Source', 'demo')
  res.json(body)
}

interface TrendSample {
  id: string
  title: string
  source: string
  summary: string
  tags: string[]
}

/** Tres notas de muestra, una por fuente, para ver la lista y sus filtros. Ninguna existe afuera. */
const trendSamples: readonly TrendSample[] = [
  {
    id: 'demo-tendencia-postgres',
    title: 'Muestra: PostgreSQL como base relacional y de vectores a la vez',
    source: 'HACKER_NEWS',
    summary: 'Tendencia de muestra para probar el radar sin Eros: no viene de ninguna fuente.',
    tags: ['postgresql'],
  },
  {
    id: 'demo-tendencia-agentes',
    title: 'Muestra: agentes con contratos estrictos entre servicios',
    source: 'DEVTO',
    summary: 'Tendencia de muestra para probar el radar sin Eros: no viene de ninguna fuente.',
    tags: ['python'],
  },
  {
    id: 'demo-tendencia-nuxt',
    title: 'Muestra: renderizado híbrido con Nuxt y su costo en el servidor',
    source: 'GITHUB',
    summary: 'Tendencia de muestra para probar el radar sin Eros: no viene de ninguna fuente.',
    tags: ['nuxt', 'vue'],
  },
]

/** Copias nuevas de la muestra: sin URL, sin fecha y sin afinidad. */
export function demoTrends(): Trend[] {
  return trendSamples.map(s => ({
    ...s,
    tags: [...s.tags],
    url: null,
    detected_at: null,
    status: 'DISCOVERED',
    relevance_score: null,
    engineering_angle: null,
    _source: 'demo',
    demo: true,
  }))
}

export const findDemoTrend = (id: string): Trend | null => demoTrends().find(t => t.id === id) ?? null
