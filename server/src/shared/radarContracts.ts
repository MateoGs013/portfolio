/**
 * Contrato de /api/admin/radar/* (Tendencias) que comparten el servidor y el admin (el admin lo
 * importa con `import type`, y los rótulos como valores: este archivo no importa nada). Es la forma
 * que responde el servidor, venga de Eros (normalizada en server/src/admin/erosRadarContract.ts) o de
 * la muestra de EROS_DEMO. Lo que Eros no trae va en null: nunca un valor inventado. Una tendencia se
 * vuelve artículo con POST /articles/generate { trendId } (articleRunContracts.ts).
 */

/** De dónde salió una respuesta: Eros o la muestra de pruebas (EROS_DEMO). Sin Eros no hay respaldo. */
export type RadarSource = 'eros' | 'demo'

export const trendStatuses = ['DISCOVERED', 'GENERATED', 'DISCARDED'] as const
export type TrendStatus = (typeof trendStatuses)[number]

/** GENERATED es como la marca Eros cuando escribió algo desde ella. */
export const trendStatusLabels: Readonly<Record<TrendStatus, string>> = {
  DISCOVERED: 'Nueva',
  GENERATED: 'Usada',
  DISCARDED: 'Descartada',
}

const isOneOf = <T extends string>(options: readonly T[]) => (value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)

export const isTrendStatus = isOneOf(trendStatuses)

/** Rótulo de las fuentes que recorre el radar; una fuente que no está acá se muestra con su código. */
export const trendSourceLabels: Readonly<Record<string, string>> = {
  HACKER_NEWS: 'Hacker News',
  DEVTO: 'Dev.to',
  GITHUB: 'GitHub',
  TECH_RSS: 'Blogs técnicos',
}

/** Una nota de terceros que detectó el radar. */
export interface Trend {
  id: string
  title: string
  /** Código de la fuente en mayúsculas (HACKER_NEWS, DEVTO…); ver trendSourceLabels. */
  source: string
  url: string | null
  summary: string | null
  /** Cuándo la detectó el radar; null si Eros no lo dijo. */
  detected_at: string | null
  status: TrendStatus
  /** Afinidad que calculó Eros (0–100); null si no la trae. */
  relevance_score: number | null
  engineering_angle: string | null
  tags: string[]
  _source: RadarSource
  demo?: true
}

/** POST /radar/scan. */
export interface TrendScan {
  total_found: number
  new_trends: number
  trends: Trend[]
}

export interface TrendChange {
  ok: true
  trend: Trend | null
}
